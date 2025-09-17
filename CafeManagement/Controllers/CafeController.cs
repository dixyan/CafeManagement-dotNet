using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Data.SqlClient;
using System.Data;
using CafeManagement.Models;

namespace CafeManagement.Controllers
{
    [Authorize]
    public class CafeController : Controller
    {
        private IDbConnection _context;

        public CafeController(IDbConnection context)
        {
            _context = context;
        }

        [Authorize]
        public IActionResult Index()
        {
            return View();
        }

        [Authorize]
        [HttpGet]
        public IActionResult Product()
        {
            return View();
        }

        [HttpPost]
        public IActionResult ProductEntry(CafeModel products)
        {
            DynamicParameters parameters = new();
            parameters.Add("@Id", products.Id, DbType.Int32);
            parameters.Add("@Name", products.Name, DbType.String);
            parameters.Add("@Category", products.Category, DbType.String);
            parameters.Add("@Cost", products.Cost, DbType.Decimal);
            parameters.Add("@Price", products.Price, DbType.Decimal);
            parameters.Add("@Stock", products.Stock, DbType.Int32);
            _context.Execute("SaveProduct_sp", parameters, commandType: CommandType.StoredProcedure);
            return RedirectToAction("Product");
        }

        [HttpGet]
        public IActionResult Edit(int productId)
        {
            if (productId == 0)
            {
                return PartialView("Edit");
            }
            DynamicParameters parameters = new();
            parameters.Add("@Id", productId, DbType.Int32);
            var product = _context.QueryFirstOrDefault<CafeModel>
                ("GetProductByIdEdit_sp", parameters, commandType: CommandType.StoredProcedure);
            return PartialView("Edit", product);
        }

        public IActionResult Delete(int id)
        {
            DynamicParameters parameters = new();
            parameters.Add("@Id", id, DbType.Int32);
            _context.Execute("DeleteProduct_sp", parameters, commandType: CommandType.StoredProcedure);
            return RedirectToAction("Product");
        }

        [HttpGet]
        public IActionResult ProductTable(String? search)
        {
            var products = _context.Query<CafeModel>("SearchProductsUniversal_sp", new { Search = search }, commandType: CommandType.StoredProcedure).ToList();
            return PartialView(products);
        }

        [HttpGet]
        public IActionResult GetStats()
        {
            var stats = _context.QueryFirstOrDefault<CafeModel>
                ("GetStatsProductPage_sp", commandType: CommandType.StoredProcedure);
            return Json(stats);
        }

        [HttpGet]
        public IActionResult GetStatsTable()
        {
            var stats = _context.QueryFirstOrDefault<TableStatus>("GetStatsTablePage_sp", commandType: CommandType.StoredProcedure);
            return Json(stats);
        }

        [HttpPost]
        public IActionResult ReservationPost(Reservation reserve)
        {
            DynamicParameters parameters = new();
            parameters.Add("@Id", reserve.TableId, DbType.Int32);
            parameters.Add("@CustomerName", reserve.CustomerName, DbType.String);
            parameters.Add("@CustomerPhone", reserve.CustomerPhone, DbType.String);
            parameters.Add("@ReservationTime", reserve.ReservationTime, DbType.DateTime);
            _context.Execute("ReservationDataPost_sp", parameters, commandType: CommandType.StoredProcedure);
            return Json(new { success = true, message = "Reservation created successfully!" });
        }

        [Authorize]
        public IActionResult Table()
        {
            return View();
        }


        public IActionResult GetTablesBySection(string? section = null)
        {
            try
            {
                DynamicParameters parameters = new();
                parameters.Add("@Section", section, DbType.String);

                var tablesData = _context.Query("GetTablesBySection_sp", parameters, commandType: CommandType.StoredProcedure).ToList();

                var tables = tablesData.Select(t => new
                {
                    id = (int)t.Id,
                    table_number = (string)t.TableName,
                    seats = (int)t.Seats,
                    status = (int)t.Status,
                    section = (string)t.Section,
                    order_info = t.OrderInfo as string,
                    reservation_info = !string.IsNullOrEmpty(t.ReservationCustomerName as string) ? new
                    {
                        customerName = t.ReservationCustomerName as string,
                        time = t.ReservationTime as string
                    } : null
                }).ToList();

                return Json(new { tables = tables });
            }
            catch (Exception ex)
            {
                return Json(new { error = "Failed to load tables", details = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult CreateTable(Table tableData)
        {
            try
            {
                DynamicParameters parameters = new();
                parameters.Add("@TableNumber", tableData.TableNumber, DbType.String);
                parameters.Add("@Seats", tableData.Seats, DbType.Int32);
                parameters.Add("@Status", 1, DbType.Int32); 
                parameters.Add("@Section", tableData.Section, DbType.String);

                _context.Execute("CreateTable_sp", parameters, commandType: CommandType.StoredProcedure);
                return Json(new { success = true, message = "Table created successfully!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, error = "Failed to create table", details = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult UpdateTableStatus(int tableId, string status)
        {
            try
            {
                DynamicParameters parameters = new();
                parameters.Add("@Id", tableId, DbType.Int32);
                parameters.Add("@Status", status, DbType.Int32);

                _context.Execute("UpdateTableStatus_sp", parameters, commandType: CommandType.StoredProcedure);
                return Json(new { success = true, message = "Table status updated successfully!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, error = "Failed to update table status", details = ex.Message });
            }
        }


        public IActionResult POS()
        {
            return View();
        }

        public IActionResult GetProductMenu(string? search)
        {
            try
            {
                DynamicParameters parameters = new();
                parameters.Add("@Search", search, DbType.String);

                var productsData = _context.Query("GetProductMenu_sp", parameters, commandType: CommandType.StoredProcedure).ToList();

                var Menu = productsData.Select(m => new
                {
                    id = (int)m.Id,
                    name = (string)m.Name,
                    category = (string?)m.Category,
                    note = (String?)m.Note,
                    price = (decimal?)m.Price,
                    stock = (int?)m.Stock
                }).ToList();

                return Json(new { Menu = Menu });
            }
            catch (Exception ex)
            {
                return Json(new { error = "Failed to load Menu", details = ex.Message });
            }
        }

        public IActionResult UpdateOrders(int TableId)
        {
            try
            {
                DynamicParameters parameters = new();
                parameters.Add("@Id", TableId, DbType.Int32);

                var ordersData = _context.Query("GetOrderItemsByTableId_sp", parameters, commandType: CommandType.StoredProcedure).ToList();

                var Orders = ordersData.Select(o => new
                {
                    Name = (String?)o.name,
                    Price = (decimal?)o.price
                });

                return Ok(Orders);
            }
            catch (Exception ex)
            {
                return Json(new { error = "Failed to load cart", details = ex.Message });
            }
        }

        public IActionResult ProcessPayment([FromBody] PaymentRequest request)
        {
            if (request == null || request.Cart == null || !request.Cart.Any())
            {
                return BadRequest("Cart is empty or invalid.");
            }

            foreach (var item in request.Cart)
            {
                _context.Execute("InsertOrderItem_sp", new
                {
                    Name = item.Name,
                    Price = item.Price,
                    Quantity = item.Qty,
                    Subtotal = request.Subtotal,
                    Tax = request.Tax,
                    Tip = request.Tip,
                    Total = request.Total
                }, commandType: CommandType.StoredProcedure);
            }
            return Json(new { success = true, message = "Payment saved to database." });
        }



        [Authorize]
        public IActionResult Staff()
        {
            return View();
        }

        [Authorize]
        public IActionResult Report()
        {
            return View();
        }

       
    }
}