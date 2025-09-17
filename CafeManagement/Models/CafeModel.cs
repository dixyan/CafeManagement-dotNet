namespace CafeManagement.Models
{
    public class CafeModel
    {
        public int Id { get; set; }
        public String? Name { get; set; }
        public String? Category { get; set; }
        public decimal Price { get; set; }
        public decimal Cost { get; set; }
        public int Stock { get; set; }
        public decimal ProfitMargin { get; set; }
        public int TotalProduct { get; set; }
        public int LowStock { get; set; }
        public int OutOfStock { get; set; }
        public decimal AveragePrice { get; set; }
    }

    public class TableStatus
    {
        public int TotalTable { get; set; }
        public int Available { get; set; }
        public int Occupied { get; set; }
        public int Reserved { get; set; }
    }

    public class Reservation
    {
        public int TableId { get; set; }
        public String? CustomerName { get; set; }
        public String? CustomerPhone { get; set; }
        public DateTime ReservationTime { get; set; }
        public int Status { get; set; }
    }

    public class Table
    {
        public int Id { get; set; }
        public string? TableNumber { get; set; }
        public int Seats { get; set; }
        public int Status { get; set; }
        public string? Section { get; set; } 
        public string? OrderInfo { get; set; }
        public ReservationInfo? ReservationInfo { get; set; }
    }

    public class ReservationInfo
    {
        public string? CustomerName { get; set; }
        public string? Time { get; set; }
    }

    public class TableResponse
    {
        public List<TableApiModel> Tables { get; set; } = new List<TableApiModel>();
    }

    public class TableApiModel
    {
        public string? table_number { get; set; }
        public int seats { get; set; }
        public int status { get; set; }
        public string? section { get; set; }
        public string? order_info { get; set; }
        public ReservationInfo? reservation_info { get; set; }
    }

    public class CartItem
    {
        public String? Name { get; set; }
        public decimal? Price { get; set; }
        public int Qty { get; set; }
    }

    public class PaymentRequest
    {
        public List<CartItem> Cart { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Tax { get; set; }
        public decimal Tip { get; set; }
        public decimal Total { get; set; }
    }

}