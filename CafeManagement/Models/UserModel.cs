namespace CafeManagement.Models
{
    public class UserLoginModel
    {
        public int Id { get; set; }

        public String? FirstName { get; set; }

        public String? LastName { get; set; }

        public String? Email { get; set; }

        public String? Role { get; set; }

        public String? Password { get; set; }

        public String? Salt { get; set; }

        public String? PasswordHash { get; set; }


    }

    public class UserModel
    {
        public String? Username { get; set; }

        public String? Salt { get; set; }

        public String? Password { get; set; }
    }

    public class MailDetailDto
    {
        public string UserName { get; set; }
        public string UserEmail { get; set; }
        public string Pass { get; set; }
        public string SmtpHost { get; set; }
    }
}
