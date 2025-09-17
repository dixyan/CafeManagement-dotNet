lucide.createIcons();


$('#addProductBtn').on('click', function () {

    var productId = 0;

    $.ajax({
        url: '/Cafe/Edit?productId=' + productId,
        type: 'GET',
        success: function (html) {
            console.log(html)
            $("#modalContainer").html(html);
            $("#addProductModal").removeClass("hidden").addClass("flex");



            $('#cancelBtn').on('click', function () {
                $('#addProductModal').addClass("hidden").removeClass("flex");
            });

        },
        error: function () {
            alert('Error loading modal.');
        }
    });
});




function loadProductsTable(search) {

    $.ajax({
        url: '/Cafe/ProductTable',
        type: 'GET',
        data: { search: search },
        success: function (html) {
            $("#productTableContainer").html(html);

            $('.edit-btn').on('click', function () {
                var productId = $(this).data('id');

                $.ajax({
                    url: '/Cafe/Edit?productId=' + productId,
                    type: 'GET',
                    success: function (html) {
                        $("#modalContainer").html(html);
                        $("#addProductModal").removeClass("hidden").addClass("flex"); 
                        $("#addbtn").text("Edit Product");


                        $('#cancelBtn').on('click', function () {
                            $('#addProductModal').addClass("hidden").removeClass("flex");
                        });

                    },
                    error: function () {
                        alert('Error loading product data.');
                    }
                });
            });
        },
        error: function () {
            alert('Error loading products.');
        }
    });

}

$('#btnSearch').click(function () {
    var search = $('#searchBox').val()
    loadProductsTable(search);
});

$("#searchBox").keypress(function (e) {
    if (e.which == 13) {
        var search = $("#searchBox").val();
        loadProductsTable(search);
        return false;
    }
});



$(document).ready(function () {

    loadProductsTable(null);
    $.getJSON("/Cafe/GetStats", function (data) {
        $("#TotalProduct").text(data.totalProduct);
        $("#LowStock").text(data.lowStock);
        $("#OutOfStock").text(data.outOfStock);
        $("#AveragePrice").text("$" + data.averagePrice.toFixed(2));
    });
});
