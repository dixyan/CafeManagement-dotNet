using Dapper;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Formatters;
using MySqlX.XDevAPI.Common;
using System.Data;
using System.Data.Common;
using System.Security.Claims;
using System.Security.Cryptography;
using CafeManagement.Models;
using MailKit.Net.Smtp;
using RazorLight;
using MimeKit;
using System.Threading.Tasks;
namespace CafeManagement.Controllers
{

    public class AuthorityController : Controller
    {
        private IDbConnection _context;

        public AuthorityController(IDbConnection context)
        {
            _context = context;
        }

        public static string PasswordHash(string password, string salt)
        {
            using (var hmac = new System.Security.Cryptography.HMACSHA512())
            {
                hmac.Key = Convert.FromBase64String(salt);
                string PasswordHash = Convert.ToBase64String(hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password)));
                return PasswordHash;
            }
        }

        public static string CreateSalt()
        {
            using (var hmac = new System.Security.Cryptography.HMACSHA512())
            {
                var salt = Convert.ToBase64String(hmac.Key);
                return salt;
            }
        }


        public IActionResult CreateUser(UserLoginModel user)
        {
            var salt = CreateSalt();
            var passwordHash = PasswordHash(user.Password, salt);

            DynamicParameters parameters = new();
            parameters.Add("@FirstName", user.FirstName, DbType.String);
            parameters.Add("@LastName", user.LastName, DbType.String);
            parameters.Add("@Email", user.Email, DbType.String);
            parameters.Add("@Role", user.Role, DbType.String);
            parameters.Add("@Password", passwordHash, DbType.String);
            parameters.Add("@Salt", salt, DbType.String);

            _context.Execute("AddUserDetails_sp", parameters, commandType: CommandType.StoredProcedure);

            return RedirectToAction("Login", "Authority");
        }

        public async Task<IActionResult> LoginUser(string UserName, String Password)
        {
            try
            {
                if (string.IsNullOrEmpty(UserName) || string.IsNullOrEmpty(Password))
                {
                    return View("Login");
                }

                var userCheck = _context.QueryFirstOrDefault<UserModel>("UserExist_sp", new { Username = UserName }, commandType: CommandType.StoredProcedure);

                if (userCheck == null)
                {
                    TempData["ErrorMessage"] = "username and password is required";
                    ViewData["ShowSharedContent"] = false;
                    return View("Login");
                }

                var loginSaltAndPassword = PasswordHash(Password, userCheck.Salt);

                if (loginSaltAndPassword == userCheck.Password)
                {
                    var claims = new List<Claim>
                    {
                         new Claim(ClaimTypes.Name, UserName)

                    };
                    var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                    var claimsPrincipal = new ClaimsPrincipal(claimsIdentity);

                    await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, claimsPrincipal);
                    HttpContext.Session.SetString("username", UserName);

                    return RedirectToAction("Index", "Cafe");


                }
                else
                {
                    TempData["ErrorMessage"] = "Invalid username or password.";
                    return RedirectToAction("login");
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Internal server error", ex });
            }
        }


        public IActionResult CheckSession()
        {
            var email = HttpContext.Session.GetString("email") ?? "No email in session";
            var FullName = HttpContext.Session.GetString("FullName") ?? "No FullName in session";
            var isAdminValue = HttpContext.Session.GetInt32("IsAdmin");
            bool isAdmin = isAdminValue.HasValue && isAdminValue.Value == 1;
            string isAdminDisplay = isAdminValue.HasValue ? isAdmin.ToString() : "No admin flag in session";
            var userId = HttpContext.Session.GetInt32("UserId");
            string userIdDisplay = userId.HasValue ? userId.Value.ToString() : "No UserId found in session";

            return Content($"Email: {email},Fullname: {FullName} IsAdmin: {isAdminDisplay}, UserId: {userIdDisplay}");
        }

        public async Task<IActionResult> Logout()
        {

            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            HttpContext.Response.Cookies.Delete(".AspNetCore.Cookies");
            HttpContext.Session.Clear();
            return RedirectToAction("login");
        }

        public IActionResult Login()
        {


            return View();
        }

        public IActionResult Register()
        {
            return View();
        }

        public static string GenerateOtp(int length = 6)
        {
            const string digits = "0123456789";
            var bytes = new byte[length];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }

            var result = new char[length];
            for (int i = 0; i < length; i++)
            {
                result[i] = digits[bytes[i] % digits.Length];
            }

            return new string(result);
        }

        public async Task<IActionResult> RecoverPassword(string UserName)
        {
            try
            {
                if (string.IsNullOrEmpty(UserName))
                {
                    return View("ForgotPassword");
                }

                var userCheck = _context.QueryFirstOrDefault<string>("RecoveryCheck_sp", new { Username = UserName }, commandType: CommandType.StoredProcedure);

                if (userCheck == null)
                {
                    TempData["ErrorMessage"] = "Email does not match";
                    ViewData["ShowSharedContent"] = false;
                    return View("ForgotPassword");
                }

                if (string.Equals(userCheck, UserName, StringComparison.OrdinalIgnoreCase))
                {
                    TempData["SuccessMessage"] = "Recovery email sent successfully.";
                    return RedirectToAction("OtpVerification", new { userCheck });
                }

                TempData["ErrorMessage"] = "Invalid username.";
                return View("ForgotPassword");

            }
            catch (Exception)
            {
                TempData["ErrorMessage"] = "Something went wrong Try again";
                return View("ForgotPassword");
            }
        }

        public async Task<bool> SendOtpEmailAsync(string userCheck, string otp)
        {
            try
            {
                var engine = new RazorLightEngineBuilder()
                    .UseFileSystemProject(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "EmailTemplates"))
                    .UseMemoryCachingProvider()
                    .Build();

                var model = new OtpEmailViewModel
                {
                    Otp = otp,
                    UserEmail = userCheck,
                    CompanyName = "CafeManagement",
                    Timestamp = DateTime.Now.ToString("f")
                };

                string htmlBody = await engine.CompileRenderAsync("OtpTemplate.cshtml", model);

                var mailDetail = _context.QueryFirstOrDefault<MailDetailDto>("GetMailDetails_sp", commandType: CommandType.StoredProcedure);

                var userName = mailDetail.UserName;
                var userEmail = mailDetail.UserEmail;
                var userPass = mailDetail.Pass;
                var smtpHost = mailDetail.SmtpHost;

                var message = new MimeKit.MimeMessage();
                message.From.Add(new MimeKit.MailboxAddress(userName, userEmail));
                message.To.Add(new MimeKit.MailboxAddress("", userCheck));
                message.Subject = "OTP for Password Recovery";
                message.Body = new MimeKit.TextPart("html") { Text = htmlBody };


                using var client = new SmtpClient();
                {
                    await client.ConnectAsync(smtpHost, 587, MailKit.Security.SecureSocketOptions.StartTls);
                    await client.AuthenticateAsync(userEmail, userPass);
                    var response = await client.SendAsync(message);
                    await client.DisconnectAsync(true);
                }
                return true;
            }
            catch (Exception)
            {
                Console.WriteLine("Error sending OTP email");
                return false;
            }
        }

        public async Task<IActionResult> SendOTP(string Username)
        {
            var otp = GenerateOtp();

            HttpContext.Session.SetString("Otp", otp);
            HttpContext.Session.SetString("OtpExpiry", DateTime.UtcNow.AddMinutes(5).ToString());

            var username = Username;

            bool emailSent = await SendOtpEmailAsync(username, otp);

            if (!emailSent)
            {
                TempData["ErrorMessage"] = "Failed to send OTP. Please try again.";
                return View("ForgotPassword");
            }

            return RedirectToAction("VerifyOtp", username, otp);
        }


        public async Task<IActionResult> VerifyOtp(string inputOtp, string username)
        {
            var UserName = username;

            try
            {
                if (string.IsNullOrEmpty(inputOtp))
                {
                    return Json(new { success = false, message = "OTP is required." });
                }
                var sessionOtp = HttpContext.Session.GetString("Otp");
                var otpExpiry = HttpContext.Session.GetString("OtpExpiry");

                if (sessionOtp == null || otpExpiry == null)
                {
                    return Json(new { success = false, message = "OTP has expired." });
                }
                if (DateTime.UtcNow > DateTime.Parse(otpExpiry))
                {
                    return Json(new { success = false, message = "OTP has expired" });
                }
                if (sessionOtp != inputOtp)
                {
                    return Json(new { success = false, message = "Invalid OTP." });
                }
                return Json(new { success = true, redirectTo = Url.Action("ResetPassword", "Authority", new { UserName = username }) });
            }
            catch (Exception)
            {
                return Json(new { success = false, message = "An error occurred." });
            }
        }

        [HttpPost]
        public IActionResult ResetPassword(string newPassword, string UserName)
        {
            try
            {
                var salt = CreateSalt();
                var passwordHash = PasswordHash(newPassword, salt);

                DynamicParameters parameters = new();
                parameters.Add("@Username", UserName, DbType.String);
                parameters.Add("@Password", passwordHash, DbType.String);
                parameters.Add("@Salt", salt, DbType.String);

                _context.Execute("UpdatePasswordUser_sp", parameters, commandType: CommandType.StoredProcedure);

                return Json(new { success = true, redirectTo = Url.Action("Login", "Authority") });
            }
            catch (Exception)
            {
                return Json(new { success = false, message = "Failed to reset password." });
            }
        }



        public IActionResult ForgotPassword()
        {
            return View();
        }

        public IActionResult OtpVerification(string userCheck)
        {
            ViewBag.UserEmail = userCheck;
            return View();
        }
        [HttpGet]
        public IActionResult ResetPassword(string UserName)
        {
            ViewBag.UserEmail = UserName;
            return View();
        }
    }
}
