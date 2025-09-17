function createMenuCard(menu) {
    $('.menu-grid').empty();

    menu.forEach(menu => {
        $('.menu-grid').append(`
        <div class="border border-gray-200 rounded-xl hover:shadow-md transition-shadow w-64 mt-6" onclick="addToCart('${menu.name}', ${menu.price}, ${menu.id})" style="background: #ffffff; padding: 40px 20px;">
    <div class="flex justify-between items-start mb-2">
        <div>
            <h3 class="font-medium text-gray-900">${menu.name}</h3>
        </div>
        <span class="bg-orange-200 text-orange-600 text-xs font-medium px-2 py-1 rounded-full">${menu.category}</span>
    </div>
    <p class="text-sm text-gray-600 mb-3">${menu.note}</p>
    <div class="flex justify-between items-center">
        <span class="text-lg font-semibold text-gray-900">$${menu.price}</span>
        <span class="text-sm text-gray-500 block mt-2">Stock: ${menu.stock}</span>
    </div>
</div>
            `);
    });
}


//<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow mt-6" onclick="addToCart('${menu.name}', ${menu.price})">
//    <div class="flex justify-between items-start mb-2">
//        <div>
//            <h3 class="font-medium text-gray-900">${menu.name}</h3>
//            <span class="category-coffee">${menu.category}</span>
//        </div>
//    </div>
//    <p class="text-sm text-gray-600 mb-3">${menu.note}</p>
//    <div class="flex justify-between items-center">
//        <span class="text-lg font-semibold text-gray-900">$${menu.price}</span>
//        <span class="text-sm text-gray-500">Stock: ${menu.stock}</span>
//    </div>
//</div>   



function loadMenuItems(search) {

    $.ajax({
        url: 'GetProductMenu',
        type: 'GET',
        data: { search: search },
        success: function (response) {
            createMenuCard(response.menu);
        },
        error: function () {
            alert('Error loading menu');
        }
    });
}

//$('#clear-order').click(function () {
//    cart = [];
//    updateCart();
//});


$('#btnSearch').click(function () {
    var search = $('#searchBox').val()
    loadMenuItems(search);
});

$(document).ready(function () {
    loadMenuItems(null);


});


lucide.createIcons();

let cart = [];
let subtotal = 0;

function addToCart(name, price, id) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    updateCart(); 
}


function removeFromCart(name) {
    const itemIndex = cart.findIndex(item => item.name === name);
    if (itemIndex > -1) {
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity -= 1;
        } else {
            cart.splice(itemIndex, 1);
        }
    }
    updateCart();
}

function updateCart() {
    const $cartItemsContainer = $('#cart-items');
    const $cartCount = $('#cart-count');
    const $processPaymentBtn = $('#process-payment');

    if (cart.length === 0) {
        $cartItemsContainer.html('<p class="text-gray-500 text-center">No items in cart</p>');
        $cartCount.text('0');
        $processPaymentBtn
            .prop('disabled', true)
            .removeClass('bg-blue-600 hover:bg-blue-700')
            .addClass('bg-gray-400 cursor-not-allowed');
    } else {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        $cartCount.text(totalItems);

        const cartHtml = `
            <table style="width: 100%; border-collapse: collapse; margin: 12px 0 20px 0;">
                ${cart.map(item => `
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                            <div style="font-weight: 500; color: #2d3748;">${item.name}</div>
                            <div style="color: #718096; font-size: 14px; margin-top: 2px;">$${item.price.toFixed(2)}</div>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; width: 40px;">
                            <span style="background: #e9f5ff; color: #3182ce; font-weight: 600; border-radius: 12px; padding: 3px 8px; font-size: 13px; display: inline-block;">${item.quantity}</span>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; width: 50px; padding-left: 12px;">
                            <button onclick="removeFromCart('${item.name}')" class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                            <i data-lucide="minus" class="w-3 h-3"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </table>
        `;

        $cartItemsContainer.html(cartHtml);

        $processPaymentBtn
            .prop('disabled', false)
            .removeClass('bg-gray-400 cursor-not-allowed')
            .addClass('bg-blue-600 hover:bg-blue-700');

        lucide.createIcons();
    }
    updateTotal();
}

function updateTotal() {
    subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const tip = parseFloat($('#tip-input').val()) || 0;
    const total = subtotal + tax + tip;

    $('#subtotal').text(`$${subtotal.toFixed(2)}`);
    $('#tax').text(`$${tax.toFixed(2)}`);
    $('#total').text(`$${total.toFixed(2)}`);
}

$('#process-payment').on('click', function () {
    const tip = parseFloat($('#tip-input').val()) || 0;
    const total = subtotal + (subtotal * 0.08) + tip;

    $.ajax({
        url: '/Cafe/ProcessPayment',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            cart: cart,
            subtotal: subtotal,
            tax: subtotal * 0.08,
            tip: tip,
            total: total
        }),
        success: function (response) {
            alert('Payment processed successfully!');
            cart = [];
            updateCart();
        },
        error: function (xhr) {
            console.error(xhr);
            alert('Error processing payment.');
        }
    });
});





