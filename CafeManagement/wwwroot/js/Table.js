
lucide.createIcons();

let currentReservationTableId = null;
let currentReservationTableNumber = null;
let currentAddTableSection = null;

function openAddTableModal(section) {
    currentAddTableSection = section;
    const sectionDisplayName = section.charAt(0).toUpperCase() + section.slice(1);

    $('#addTableModalTitle').text(`Add New ${sectionDisplayName} Table`);
    $('#TableSection').val(section);
    $('#TableSectionDisplay').val(sectionDisplayName);

    const suggestedNumber = generateNextTableNumber(section);
    $('#TableNumber').val(suggestedNumber);

    $('#addTableModal').removeClass('hidden');
    $('#TableNumber').focus();
}

function closeAddTableModal() {
    $('#addTableModal').addClass('hidden');
    $('#addTableForm')[0].reset();
    currentAddTableSection = null;
}

function generateNextTableNumber(section) {
    const prefix = section.charAt(0).toUpperCase();
    const nextNumber = (tableCounters[section] || 0) + 1;
    return `${prefix}${nextNumber}`;
}

$('#addTableModal').on('click', function (e) {
    if (e.target === this) {
        closeAddTableModal();
    }
});

$('#addTableForm').on('submit', function (e) {
    e.preventDefault();

    $('.add-table-btn-text').addClass('hidden');
    $('.add-table-loading').removeClass('hidden');

    const formData = {
        TableNumber: $('#TableNumber').val(),
        Seats: parseInt($('#TableSeats').val()),
        Section: $('#TableSection').val()
    };

    $.ajax({
        url: '/Cafe/CreateTable',
        type: 'POST',
        data: formData,
        success: function (response) {
            $('.add-table-btn-text').removeClass('hidden');
            $('.add-table-loading').addClass('hidden');

            if (response.success) {
                alert('Table created successfully!');
                closeAddTableModal();
                loadTablesBySection(currentAddTableSection);
                loadStats();
            } else {
                alert('Error: ' + (response.error || 'Failed to create table'));
            }
        },
        error: function (xhr) {
            $('.add-table-btn-text').removeClass('hidden');
            $('.add-table-loading').addClass('hidden');
            console.error('Error creating table:', xhr.responseText);
            alert('Failed to create table. Please try again.');
        }
    });
});

function openReservationModal(tableNumber, section, tableId = null) {
    currentReservationTableId = tableId || tableNumber;
    currentReservationTableNumber = tableNumber;

    $('#modalTitle').text(`Reserve Table ${tableNumber}`);
    $('#TableId').val(currentReservationTableId);
    $('#reservationModal').removeClass('hidden');
}

function closeReservationModal() {
    $('#reservationModal').addClass('hidden');
    $('#reservationModalForm')[0].reset();
    currentReservationTableId = null;
    currentReservationTableNumber = null;
}

$('#reservationModal').on('click', function (e) {
    if (e.target === this) {
        closeReservationModal();
    }
});

$('#reservationModalForm').on('submit', function (e) {
    e.preventDefault();

    const formData = {
        TableId: $('#TableId').val(),
        CustomerName: $('#CustomerName').val(),
        CustomerPhone: $('#CustomerPhone').val(),
        ReservationTime: $('#ReservationTime').val()
    };

    $.ajax({
        url: '/Cafe/ReservationPost',
        type: 'POST',
        data: formData,
        success: function (response) {
            if (response.success) {
                alert('Reservation created successfully!');
                closeReservationModal();
                loadAllTables();
                loadStats();
            } else {
                alert('Error: ' + (response.message || 'Unknown error'));
            }
        },
        error: function (xhr) {
            console.error(xhr.responseText);
            alert('Something went wrong! Please try again.');
        }
    });
});

let tableCounters = {
    indoor: 0,
    outdoor: 0,
    patio: 0
};

function createTableCard(tables) {
    const { id, table_number, seats, status, section, order_info, reservation_info } = tables;

    let statusClass = '';
    let statusText = '';
    let cardClass = 'bg-white';
    let borderClass = 'border-gray-200';
    let actionButtons = '';
    let billBtn = '';

    if (status === 1) {
        statusClass = 'bg-green-200 text-green-800';
        statusText = 'Available';
        cardClass = 'bg-green-50';
        borderClass = 'border-green-200';
        actionButtons = `
            <button class="flex-1 bg-green-600 text-white text-sm py-2 px-3 rounded hover:bg-green-700 seat-btn" data-table-id="${id}" data-table="${table_number}" data-section="${section}">
                Seat
            </button>
            <button class="flex-1 bg-white text-green-600 border border-green-600 text-sm py-2 px-3 rounded hover:bg-green-50 reserve-btn" data-table-id="${id}" data-table="${table_number}" data-section="${section}">
                Reserve
            </button>`;
    } else if (status === 2) {
        statusClass = 'bg-red-200 text-red-800';
        statusText = 'Occupied';
        cardClass = 'bg-red-50';
        borderClass = 'border-red-200';
        actionButtons = `
            <button class="flex-1 bg-red-600 text-white text-sm py-2 px-3 rounded hover:bg-red-700 clean-btn" data-table-id="${id}" data-table="${table_number}" data-section="${section}">
                Clean
            </button>
            <button class="flex-1 bg-white text-red-600 border border-red-600 text-sm py-2 px-3 rounded hover:bg-red-50 free-btn" data-table-id="${id}" data-table="${table_number}" data-section="${section}">
                Free
            </button>`;
        billBtn = `
    <button id="receiptBtn" 
            class="p-2 rounded hover:bg-gray-200" 
            onclick="takeOrders(${id})">
        <svg xmlns="http://www.w3.org/2000/svg" 
             width="16" height="16" 
             fill="currentColor" 
             class="bi bi-receipt" 
             viewBox="0 0 16 16">
             
            <path d="M1.92.506a.5.5 0 0 1 .434.14L3 1.293l.646-.647a.5.5 
                     0 0 1 .708 0L5 1.293l.646-.647a.5.5 0 0 1 
                     .708 0L7 1.293l.646-.647a.5.5 0 0 1 
                     .708 0L9 1.293l.646-.647a.5.5 0 0 1 
                     .708 0l.646.647.646-.647a.5.5 0 0 1 
                     .708 0l.646.647.646-.647a.5.5 0 0 1 
                     .801.13l.5 1A.5.5 0 0 1 15 2v12a.5.5 
                     0 0 1-.053.224l-.5 1a.5.5 0 0 
                     1-.8.13L13 14.707l-.646.647a.5.5 
                     0 0 1-.708 0L11 14.707l-.646.647a.5.5 
                     0 0 1-.708 0L9 14.707l-.646.647a.5.5 
                     0 0 1-.708 0L7 14.707l-.646.647a.5.5 
                     0 0 1-.708 0L5 14.707l-.646.647a.5.5 
                     0 0 1-.708 0L3 14.707l-.646.647a.5.5 
                     0 0 1-.801-.13l-.5-1A.5.5 0 0 1 
                     1 14V2a.5.5 0 0 1 .053-.224l.5-1a.5.5 
                     0 0 1 .367-.27m.217 1.338L2 
                     2.118v11.764l.137.274.51-.51a.5.5 
                     0 0 1 .707 0l.646.647.646-.646a.5.5 
                     0 0 1 .708 0l.646.646.646-.646a.5.5 
                     0 0 1 .708 0l.646.646.646-.646a.5.5 
                     0 0 1 .708 0l.646.646.646-.646a.5.5 
                     0 0 1 .708 0l.646.646.646-.646a.5.5 
                     0 0 1 .708 0l.509.509.137-.274V2.118l-.137-.274-.51.51a.5.5 
                     0 0 1-.707 0L12 1.707l-.646.647a.5.5 
                     0 0 1-.708 0L10 1.707l-.646.647a.5.5 
                     0 0 1-.708 0L8 1.707l-.646.647a.5.5 
                     0 0 1-.708 0L6 1.707l-.646.647a.5.5 
                     0 0 1-.708 0L4 1.707l-.646.647a.5.5 
                     0 0 1-.708 0z"/>
                     
            <path d="M3 4.5a.5.5 0 0 1 .5-.5h6a.5.5 
                     0 1 1 0 1h-6a.5.5 0 0 
                     1-.5-.5m0 2a.5.5 0 0 
                     1 .5-.5h6a.5.5 0 1 
                     1 0 1h-6a.5.5 0 0 
                     1-.5-.5m0 2a.5.5 0 0 
                     1 .5-.5h6a.5.5 0 1 
                     1 0 1h-6a.5.5 0 0 
                     1-.5-.5m0 2a.5.5 0 0 
                     1 .5-.5h6a.5.5 0 0 
                     1 0 1h-6a.5.5 0 0 
                     1-.5-.5m8-6a.5.5 0 0 
                     1 .5-.5h1a.5.5 0 0 
                     1 0 1h-1a.5.5 0 0 
                     1-.5-.5m0 2a.5.5 0 0 
                     1 .5-.5h1a.5.5 0 0 
                     1 0 1h-1a.5.5 0 0 
                     1-.5-.5m0 2a.5.5 0 0 
                     1 .5-.5h1a.5.5 0 0 
                     1 0 1h-1a.5.5 0 0 
                     1-.5-.5m0 2a.5.5 0 0 
                     1 .5-.5h1a.5.5 0 0 
                     1 0 1h-1a.5.5 0 0 
                     1-.5-.5"/>
        </svg>
    </button>
`;
    } else if (status === 3) {
        var customerName = reservation_info ? reservation_info.customerName : 'N/A';
        statusClass = 'bg-blue-200 text-blue-800';
        statusText = 'Reserved';
        cardClass = 'bg-blue-50';
        borderClass = 'border-blue-200';
        actionButtons = `
            <button class="flex-1 bg-blue-600 text-white text-sm py-2 px-3 rounded hover:bg-blue-700 seat-btn" data-table-id="${id}" data-table="${table_number}" data-section="${section}">
                Seat
            </button>
            <button class="flex-1 bg-white text-blue-600 border border-blue-600 text-sm py-2 px-3 rounded hover:bg-blue-50 cancel-reservation-btn" data-table-id="${id}" data-table="${table_number}" data-section="${section}">
                Cancel
            </button>`;
    } else if (status === 4) {
        statusClass = 'bg-yellow-200 text-yellow-800';
        statusText = 'Cleaning';
        cardClass = 'bg-yellow-50';
        borderClass = 'border-yellow-200';
        actionButtons = `
            <button class="w-full bg-yellow-600 text-white text-sm py-2 px-3 rounded hover:bg-yellow-700 mark-clean-btn" data-table-id="${id}" data-table="${table_number}" data-section="${section}">
                Mark Clean
            </button>`;
        billBtn = `
    <button id="receiptBtn" 
            class="p-2 rounded hover:bg-gray-200" 
            onclick="takeOrders(${id})">
        <svg xmlns="http://www.w3.org/2000/svg" 
             width="16" height="16" 
             fill="currentColor" 
             class="bi bi-receipt" 
             viewBox="0 0 16 16">
             
            <path d="M1.92.506a.5.5 0 0 1 .434.14L3 1.293l.646-.647a.5.5 
                     0 0 1 .708 0L5 1.293l.646-.647a.5.5 0 0 1 
                     .708 0L7 1.293l.646-.647a.5.5 0 0 1 
                     .708 0L9 1.293l.646-.647a.5.5 0 0 1 
                     .708 0l.646.647.646-.647a.5.5 0 0 1 
                     .708 0l.646.647.646-.647a.5.5 0 0 1 
                     .801.13l.5 1A.5.5 0 0 1 15 2v12a.5.5 
                     0 0 1-.053.224l-.5 1a.5.5 0 0 
                     1-.8.13L13 14.707l-.646.647a.5.5 
                     0 0 1-.708 0L11 14.707l-.646.647a.5.5 
                     0 0 1-.708 0L9 14.707l-.646.647a.5.5 
                     0 0 1-.708 0L7 14.707l-.646.647a.5.5 
                     0 0 1-.708 0L5 14.707l-.646.647a.5.5 
                     0 0 1-.708 0L3 14.707l-.646.647a.5.5 
                     0 0 1-.801-.13l-.5-1A.5.5 0 0 1 
                     1 14V2a.5.5 0 0 1 .053-.224l.5-1a.5.5 
                     0 0 1 .367-.27m.217 1.338L2 
                     2.118v11.764l.137.274.51-.51a.5.5 
                     0 0 1 .707 0l.646.647.646-.646a.5.5 
                     0 0 1 .708 0l.646.646.646-.646a.5.5 
                     0 0 1 .708 0l.646.646.646-.646a.5.5 
                     0 0 1 .708 0l.646.646.646-.646a.5.5 
                     0 0 1 .708 0l.646.646.646-.646a.5.5 
                     0 0 1 .708 0l.509.509.137-.274V2.118l-.137-.274-.51.51a.5.5 
                     0 0 1-.707 0L12 1.707l-.646.647a.5.5 
                     0 0 1-.708 0L10 1.707l-.646.647a.5.5 
                     0 0 1-.708 0L8 1.707l-.646.647a.5.5 
                     0 0 1-.708 0L6 1.707l-.646.647a.5.5 
                     0 0 1-.708 0L4 1.707l-.646.647a.5.5 
                     0 0 1-.708 0z"/>
                     
            <path d="M3 4.5a.5.5 0 0 1 .5-.5h6a.5.5 
                     0 1 1 0 1h-6a.5.5 0 0 
                     1-.5-.5m0 2a.5.5 0 0 
                     1 .5-.5h6a.5.5 0 1 
                     1 0 1h-6a.5.5 0 0 
                     1-.5-.5m0 2a.5.5 0 0 
                     1 .5-.5h6a.5.5 0 1 
                     1 0 1h-6a.5.5 0 0 
                     1-.5-.5m0 2a.5.5 0 0 
                     1 .5-.5h6a.5.5 0 0 
                     1 0 1h-6a.5.5 0 0 
                     1-.5-.5m8-6a.5.5 0 0 
                     1 .5-.5h1a.5.5 0 0 
                     1 0 1h-1a.5.5 0 0 
                     1-.5-.5m0 2a.5.5 0 0 
                     1 .5-.5h1a.5.5 0 0 
                     1 0 1h-1a.5.5 0 0 
                     1-.5-.5m0 2a.5.5 0 0 
                     1 .5-.5h1a.5.5 0 0 
                     1 0 1h-1a.5.5 0 0 
                     1-.5-.5m0 2a.5.5 0 0 
                     1 .5-.5h1a.5.5 0 0 
                     1 0 1h-1a.5.5 0 0 
                     1-.5-.5"/>
        </svg>
    </button>
`;
    }

    let additionalInfo = '';
    if (status === 2 && order_info) {
        additionalInfo = `<p class="text-sm text-red-700 mb-3">Order: ${order_info}</p>`;
    }

    if (status === 3 && reservation_info) {
        additionalInfo = `
            <div class="text-sm text-blue-700 mb-3">
                <p>Reserved by: ${reservation_info.customerName}</p>
                <p>At: ${reservation_info.time}</p>
            </div>`;
    }

    return `<div class="${cardClass} rounded-lg p-4 border-2 ${borderClass} shadow-sm" data-table-id="${id}" data-section="${section}">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                        <span class="text-lg font-bold text-gray-800">#${table_number}</span>
                        <i data-lucide="users" class="w-4 h-4 text-gray-600"></i>
                        <span class="text-sm text-gray-700">${seats}</span>
                        <span class="${statusClass} text-xs px-2 py-1 rounded">${statusText}</span>
                        ${billBtn}
                    </div>
                </div>
                ${additionalInfo}
                <div class="flex gap-2">
                    ${actionButtons}
                </div>
            </div>`;
}

function loadTablesBySection(section) {
    const containerId = `${section}TableContainer`;
    const loadingId = `${section}-loading`;
    const countId = `${section}-count`;

    $(`#${loadingId}`).removeClass('hidden');
    $(`#${containerId}`).empty();
    $.ajax({
        url: `/Cafe/GetTablesBySection`,
        method: 'GET',
        data: { section: section },
        dataType: 'json',
        success: function (response) {
            $(`#${loadingId}`).addClass('hidden');
            if (response.tables && Array.isArray(response.tables)) {
                renderSectionTables(section, response.tables);
                updateSectionCount(section, response.tables.length);

                if (response.tables.length > 0) {
                    const sectionTables = response.tables.filter(t => t.section === section);
                    if (sectionTables.length > 0) {
                        const tableNumbers = sectionTables.map(table => {
                            const numberPart = table.table_number.toString().replace(/\D/g, '');
                            return numberPart ? parseInt(numberPart) : 0;
                        });
                        tableCounters[section] = Math.max(...tableNumbers, tableCounters[section] || 0);
                    }
                }
            } else {
                console.log(`No tables found for ${section} section`);
                $(`#${containerId}`).html(`<div class="text-center py-4 text-gray-500">No ${section} tables found.</div>`);
                updateSectionCount(section, 0);
            }
        },
        error: function (xhr, status, error) {
            $(`#${loadingId}`).addClass('hidden');
            console.error(`Error loading ${section} tables:`, error);
            $(`#${containerId}`).html(`
                <div class="text-center py-4 text-red-600">
                    <i data-lucide="alert-circle" class="w-5 h-5 mx-auto mb-2"></i>
                    <p>Failed to load ${section} tables.</p>
                    <button onclick="loadTablesBySection('${section}')" class="block mx-auto mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                        Try Again
                    </button>
                </div>
            `);
            updateSectionCount(section, 0);
            lucide.createIcons();
        }
    });
}

function renderSectionTables(section, tables) {
    const containerId = `${section}TableContainer`;
    $(`#${containerId}`).empty();
    if (!tables || tables.length === 0) {
        $(`#${containerId}`).html(`<div class="text-center py-4 text-gray-500">No ${section} tables found.</div>`);
        return;
    }

    const sectionTables = tables.filter(t => t.section === section);
    if (sectionTables.length > 0) {
        const tableNumbers = sectionTables.map(table => {
            const numberPart = table.table_number.toString().replace(/\D/g, '');
            return numberPart ? parseInt(numberPart) : 0;
        });
        tableCounters[section] = Math.max(...tableNumbers);
    }

    sectionTables.forEach(function (tables) {

        const tableCard = createTableCard(tables);
        $(`#${containerId}`).append(tableCard);

    });

    lucide.createIcons();
}

function updateSectionCount(section, count) {
    $(`#${section}-count`).text(count);
}

function loadStats() {
    $.getJSON("/Cafe/GetStatsTable", function (data) {
        $("#TotalTable").text(data.totalTable || 0);
        $(".Available").text(data.available || 0);
        $(".Occupied").text(data.occupied || 0);
        $("#Reserved").text(data.reserved || 0);
    }).fail(function () {
        console.error('Failed to load stats');
        $("#TotalTable").text('0');
        $(".Available").text('0');
        $(".Occupied").text('0');
        $("#Reserved").text('0');
    });
}

function loadAllTables() {
    loadTablesBySection('indoor');
    loadTablesBySection('outdoor');
    loadTablesBySection('patio');
    loadStats();
}

$(document).ready(function () {
    loadAllTables();

    $('#addIndoorTableBtn').on('click', function () {
        openAddTableModal('indoor');
    });

    $('#addOutdoorTableBtn').on('click', function () {
        openAddTableModal('outdoor');
    });

    $('#addPatioTableBtn').on('click', function () {
        openAddTableModal('patio');
    });

    $('#refreshAllTablesBtn').on('click', function () {
        loadAllTables();
    });

    $(document).on('click', '.reserve-btn', function () {
        const tableId = $(this).data('table-id');
        const tableNumber = $(this).data('table');
        const section = $(this).data('section');
        openReservationModal(tableNumber, section, tableId);
    });

    $(document).on('click', '.seat-btn', function () {
        const tableId = $(this).data('table-id');
        const tableNumber = $(this).data('table');
        const section = $(this).data('section');
        seatCustomers(tableId, tableNumber, section);
    });

    $(document).on('click', '.clean-btn', function () {
        const tableId = $(this).data('table-id');
        const tableNumber = $(this).data('table');
        const section = $(this).data('section');
        markTableForCleaning(tableId, tableNumber, section);
    });

    $(document).on('click', '.free-btn', function () {
        const tableId = $(this).data('table-id');
        const tableNumber = $(this).data('table');
        const section = $(this).data('section');
        freeTable(tableId, tableNumber, section);
    });

    $(document).on('click', '.cancel-reservation-btn', function () {
        const tableId = $(this).data('table-id');
        const tableNumber = $(this).data('table');
        const section = $(this).data('section');
        cancelReservation(tableId, tableNumber, section);
    });

    $(document).on('click', '.mark-clean-btn', function () {
        const tableId = $(this).data('table-id');
        const tableNumber = $(this).data('table');
        const section = $(this).data('section');
        markTableClean(tableId, tableNumber, section);
    });
});

function seatCustomers(tableId, tableNumber, section) {
    console.log(`Seating customers at table ${tableNumber} in ${section} section`);
    updateTableStatus(tableId, 2);
}

function markTableForCleaning(tableId, tableNumber, section) {
    console.log(`Marking table ${tableNumber} in ${section} section for cleaning`);
    updateTableStatus(tableId, 4);
}

function freeTable(tableId, tableNumber, section) {
    console.log(`Freeing table ${tableNumber} in ${section} section`);
    updateTableStatus(tableId, 1);
}

function cancelReservation(tableId, tableNumber, section) {
    console.log(`Canceling reservation for table ${tableNumber} in ${section} section`);
    updateTableStatus(tableId, 1);
}

function markTableClean(tableId, tableNumber, section) {
    console.log(`Marking table ${tableNumber} in ${section} section as clean`);
    updateTableStatus(tableId, 1);
}

function updateTableStatus(tableId, newStatus) {
    console.log(`Updating table ${tableId} status to ${newStatus}`);

    $.ajax({
        url: '/Cafe/UpdateTableStatus',
        type: 'POST',
        data: {
            tableId: tableId,
            status: newStatus
        },
        success: function (response) {
            if (response.success) {
                loadAllTables();
            } else {
                alert('Error: ' + (response.error || 'Failed to update table status'));
            }
        },
        error: function (xhr) {
            console.error('Error updating table status:', xhr.responseText);
            alert('Failed to update table status. Please try again.');
        }
    });
}

function takeOrders(Id) {

    $.ajax({
        url: '/Cafe/UpdateOrders',
        type: 'POST',
        data: { TableId: Id },
        success: function (r) {
            window.location.href = "/Cafe/POS";
        }
    });
}

