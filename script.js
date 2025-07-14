// Constants
let pricing = { 139: 0.5, 239: 0.3, 359: 0.2 };  // 50%, 30%, 20% split
const marketingBudgetStart = 2000;  // Initial marketing budget
let CACIncreaseRate = 0.005;  // CAC increase by 1% per new user
const churnRate = 0.03;  // 3% churn rate
const transactionRevenuePerUser = 0.20;  // 20 cents per transaction
const avgTransactionsPerUser = 100;  // Average transactions per user per month
const expenseCap = 500000;  // Cap on business expenses
const monthsToProject = 12;

let currentUserCount = 0;
let CAC = 200;  // Starting Customer Acquisition Cost
let marketingBudget = marketingBudgetStart;
let businessExpenses = 0;  // Start at 0 and set later based on revenue
let totalRevenue = 0;
let cumulativeProfit = 0;
let monthData = [];
let currentMonth = 1;  // Start from month 1

// Function to calculate the tax
function calculateTax(grossProfit) {
    let annualizedProfit = cumulativeProfit + grossProfit;
    let tax = 0;
    if (annualizedProfit <= 500000) {
        tax = grossProfit * 0.122;
    } else {
        tax = 500000 * 0.122 + (annualizedProfit - 500000) * 0.265;
    }
    return tax;
}

// Function to calculate net profit
function calculateNetProfit(grossProfit, tax) {
    return grossProfit - tax;
}

// Function to determine marketing reinvestment rate based on MRR
function getMarketingReinvestmentRate(mrr) {
    if (mrr < 10000) return 1.0;         // 100% for pre-revenue – $10K
    if (mrr < 30000) return 0.9;         // 90% for $10K – $30K
    if (mrr < 50000) return 0.8;         // 80% for $30K – $50K
    if (mrr < 80000) return 0.7;         // 70% for $50K – $80K
    if (mrr < 120000) return 0.6;         // 60% for $80K – $120K
    if (mrr < 200000) return 0.5;         // 50% for $120K – $200K
    if (mrr < 300000) return 0.4;         // 40% for $200K – $300K
    return 0.3;                          // 30% for $300K+
}

// Function to simulate financial projection for a given month
function simulateMonth(month) {
    const year = Math.ceil(month / 12); // Calculate the year based on the month
    const monthInYear = ((month - 1) % 12) + 1; // Month within the year (1-12)

    // New users based on marketing budget and CAC
    let newUsers = Math.round(marketingBudget / CAC);
    let churnedUsers = Math.round(currentUserCount * churnRate);
    currentUserCount = Math.max(currentUserCount + newUsers - churnedUsers, 0);

    // Revenue from SaaS plans
    let revenueFromSaaSPlans = 0;
    for (let price in pricing) {
        let userCount = Math.round(currentUserCount * pricing[price]);
        revenueFromSaaSPlans += userCount * price;
    }

    // Revenue from payment processing (30 cents per transaction per user)
    let paymentProcessingRevenue = currentUserCount * avgTransactionsPerUser * transactionRevenuePerUser;

    // Total revenue (SaaS + payment processing)
    totalRevenue = revenueFromSaaSPlans + paymentProcessingRevenue;

    // --- CHANGE: Dynamic marketing reinvestment rate based on MRR ---
    const marketingReinvestmentRate = getMarketingReinvestmentRate(totalRevenue);
    marketingBudget = totalRevenue * marketingReinvestmentRate;
    // ---------------------------------------------------------------

    // Increase CAC by each new user acquired, but stop growing once it reaches $700
    CAC *= (1 + CACIncreaseRate * newUsers);
    if (CAC > 1000) {
        CAC = 1000; // Stop growing CAC once it reaches $700
    }

    // Business expenses (20% of revenue, capped at $500,000)
    businessExpenses = Math.min(totalRevenue * 0.20, 500000);

    // Gross profit
    let grossProfit = totalRevenue - businessExpenses - marketingBudget;

    // Calculate cumulative annual gross profit for the current year
    const currentYear = Math.ceil(month / 12);
    const previousMonthsGrossProfit = monthData
        .filter((data) => Math.ceil(data.month / 12) === currentYear)
        .reduce((sum, data) => sum + parseFloat(data.grossProfit), 0);
    const cumulativeAnnualGrossProfit = previousMonthsGrossProfit + grossProfit;

    // Calculate tax based on cumulative annual gross profit
    let tax = 0;
    if (cumulativeAnnualGrossProfit <= 500000) {
        tax = grossProfit * 0.122; // 12.2% for income <= 500,000
    } else {
        const taxableAbove500k = Math.max(0, cumulativeAnnualGrossProfit - 500000);
        const taxableAt12_2 = grossProfit - taxableAbove500k;
        tax = (taxableAt12_2 * 0.122) + (taxableAbove500k * 0.265); // 26.5% for income > 500,000
    }

    // Net profit
    let netProfit = calculateNetProfit(grossProfit, tax);

    return {
        year: `Year ${year}`, // Ensure this is correct
        month, // Use the actual month number (1, 2, ..., 24, etc.)
        newUsers,
        churnedUsers: -churnedUsers, // <-- Add comma here!
        totalUsers: currentUserCount,
        paymentProcessingRevenue: paymentProcessingRevenue.toFixed(2),
        saasPlansRevenue: revenueFromSaaSPlans.toFixed(2),
        revenue: totalRevenue.toFixed(2),
        marketing: marketingBudget.toFixed(2),
        businessExpenses: businessExpenses.toFixed(2),
        grossProfit: grossProfit.toFixed(2),
        tax: tax.toFixed(2),
        netProfit: netProfit.toFixed(2),
        cac: CAC.toFixed(2)
    };
}

// Update the table with financial data including year and month
function updateTable(data) {
    const tbody = document.querySelector("#financial-table tbody");
    tbody.innerHTML = "";

    let currentYear = null;
    let annualGrossProfit = 0;
    let annualRevenue = 0;
    let annualMarketing = 0;
    let annualBusinessExpenses = 0;
    let annualPaymentProcessingRevenue = 0;
    let annualSaasPlansRevenue = 0;

    data.forEach((row, index) => {
        const tr = document.createElement("tr");
        tr.classList.add(index % 2 === 0 ? "bg-white" : "bg-gray-100");

        const orderedKeys = [
            "month",
            "newUsers",
            "churnedUsers",
            "totalUsers",
            "paymentProcessingRevenue",
            "saasPlansRevenue",
            "cac",
            "marketing",
            "businessExpenses",
            "revenue",
            "grossProfit",
            "tax",
            "netProfit"
        ];

        // Helper function to format numbers with commas
        function formatNumber(num) {
            if (isNaN(num)) return num;
            return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        orderedKeys.forEach((key) => {
            const td = document.createElement("td");
            td.textContent = formatNumber(row[key]);
            td.classList.add(
                "text-center",
                "py-[1vh]",
                "border",
                "border-gray-300"
            );
            tr.appendChild(td);
        });

        // Accumulate annual totals
        annualGrossProfit += parseFloat(row.grossProfit);
        annualRevenue += parseFloat(row.revenue);
        annualMarketing += parseFloat(row.marketing);
        annualBusinessExpenses += parseFloat(row.businessExpenses);
        annualPaymentProcessingRevenue += parseFloat(row.paymentProcessingRevenue);
        annualSaasPlansRevenue += parseFloat(row.saasPlansRevenue);

        tbody.appendChild(tr);

        // Check if next row is a new year or last row, then add summary
        const nextRow = data[index + 1];
        if (
            nextRow === undefined ||
            nextRow.year !== row.year
        ) {
            // Add summary row for the current year
            const summaryRow = document.createElement("tr");
            summaryRow.classList.add("bg-gray-200", "font-bold");

            // Add empty cells for columns before the summary columns (9 columns before revenue)
            for (let i = 0; i < 4; i++) {
                const emptyCell = document.createElement("td");
                emptyCell.textContent = "";
                summaryRow.appendChild(emptyCell);
            }

            // Payment Processing Revenue (summary)
            const ppCell = document.createElement("td");
            ppCell.textContent = formatNumber(annualPaymentProcessingRevenue);
            ppCell.classList.add("text-center", "py-[1vh]", "border", "border-gray-300", "bg-yellow-50");
            summaryRow.appendChild(ppCell);

            // SaaS Plans Revenue (summary)
            const saasCell = document.createElement("td");
            saasCell.textContent = formatNumber(annualSaasPlansRevenue);
            saasCell.classList.add("text-center", "py-[1vh]", "border", "border-gray-300", "bg-yellow-50");
            summaryRow.appendChild(saasCell);

            // CAC (empty)
            summaryRow.appendChild(document.createElement("td"));

            // Marketing Budget (summary)
            const marketingCell = document.createElement("td");
            marketingCell.textContent = formatNumber(annualMarketing);
            marketingCell.classList.add("text-center", "py-[1vh]", "border", "border-gray-300", "bg-orange-100");
            summaryRow.appendChild(marketingCell);

            // Business Expenses (summary)
            const expensesCell = document.createElement("td");
            expensesCell.textContent = formatNumber(annualBusinessExpenses);
            expensesCell.classList.add("text-center", "py-[1vh]", "border", "border-gray-300", "bg-purple-100");
            summaryRow.appendChild(expensesCell);

            // Revenue (summary)
            const revenueCell = document.createElement("td");
            revenueCell.textContent = formatNumber(annualRevenue);
            revenueCell.classList.add("text-center", "py-[1vh]", "border", "border-gray-300", "bg-yellow-100");
            summaryRow.appendChild(revenueCell);

            // Gross Profit
            const grossProfitCell = document.createElement("td");
            grossProfitCell.textContent = formatNumber(annualGrossProfit);
            grossProfitCell.classList.add("text-center", "py-[1vh]", "border", "border-gray-300", "bg-blue-100");
            summaryRow.appendChild(grossProfitCell);

            // Tax
            const annualTax = annualGrossProfit <= 500000
                ? annualGrossProfit * 0.122
                : 500000 * 0.122 + (annualGrossProfit - 500000) * 0.265;
            const taxPercentage = annualGrossProfit > 0
                ? (annualTax / annualGrossProfit) * 100
                : 0;
            const taxCell = document.createElement("td");
            taxCell.textContent = `${formatNumber(annualTax)} (${taxPercentage.toFixed(1)}%)`;
            taxCell.classList.add("text-center", "py-[1vh]", "border", "border-gray-300", "bg-red-100");
            summaryRow.appendChild(taxCell);

            // Net Profit
            const netProfitCell = document.createElement("td");
            netProfitCell.textContent = formatNumber(annualGrossProfit - annualTax);
            netProfitCell.classList.add("text-center", "py-[1vh]", "border", "border-gray-300", "bg-green-100");
            summaryRow.appendChild(netProfitCell);

            tbody.appendChild(summaryRow);

            // Reset annual totals for the new year
            annualGrossProfit = 0;
            annualRevenue = 0;
            annualMarketing = 0;
            annualBusinessExpenses = 0;
            annualPaymentProcessingRevenue = 0;
            annualSaasPlansRevenue = 0;
        }
    });
}

// Update the table header to match the correct column order
function updateTableHeader() {
    const thead = document.querySelector("#financial-table thead");
    thead.innerHTML = "";

    const headerRow = document.createElement("tr");
    const headers = [
        "Month",
        "New Users",
        "Churn",
        "Total Users",
        "Payment Processing Revenue ($)",
        "SaaS Plans Revenue ($)",
        "CAC ($)",
        "Business Expenses ($)",
        "Marketing Budget ($)",
        "Total Revenue ($)",
        "Gross Profit/month ($)",
        "Tax Amount ($)",
        "Net Profit/month ($)"
    ];

    headers.forEach((title) => {
        const th = document.createElement("th");
        th.textContent = title;
        th.classList.add("text-center", "py-[1vh]", "border", "border-gray-300", "bg-gray-50");
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
}

// Generate the first 12 months of data
function generateFirst12Months() {
    monthData = [];
    currentUserCount = 0;
    CAC = 200;
    marketingBudget = marketingBudgetStart;
    businessExpenses = 0;
    totalRevenue = 0;
    cumulativeProfit = 0;
    currentMonth = 1;

    for (let i = 1; i <= 12; i++) {
        const row = simulateMonth(i);
        monthData.push(row);
    }
    updateTable(monthData);
}

// Generate the next 12 months of data (starting from currentMonth)
function generateNext12Months() {
    let newMonthData = [];
    for (let i = 0; i < 12; i++) {
        newMonthData.push(simulateMonth(currentMonth)); // Use currentMonth for the correct month number
        currentMonth++;  // Increment the month number after each iteration
    }
    monthData = [...monthData, ...newMonthData];  // Append the new months to existing data
    updateTable(monthData);  // Update the table with new data
}

// Function to export table data to CSV
function exportTableToCSV(filename) {
    const table = document.getElementById('financial-table');
    const rows = table.querySelectorAll('tr');
    let csvContent = '';

    rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        const rowData = Array.from(cells).map(cell => `"${cell.textContent}"`).join(',');
        csvContent += rowData + '\n';
    });

    // Create a Blob and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// Event listener for the toggle button
document.getElementById("toggle-button").addEventListener("click", () => {
    if (monthData.length === 0) {
        generateFirst12Months();  // Generate first 12 months only once
    } else {
        generateNext12Months();  // Generate next 12 months
    }
    document.getElementById("toggle-button").style.display = "inline-block";  // Keep the button visible
});

// Add event listener to the Export button
document.getElementById('export-button').addEventListener('click', () => {
    exportTableToCSV('financial_projection.csv');
});

// Handle form submission to update pricing and CACIncreaseRate
document.getElementById('settings-form').addEventListener('submit', function(e) {
    e.preventDefault();

    // Get values from form
    const plan1 = Number(document.getElementById('plan1').value);
    const portion1 = Number(document.getElementById('portion1').value);
    const plan2 = Number(document.getElementById('plan2').value);
    const portion2 = Number(document.getElementById('portion2').value);
    const plan3 = Number(document.getElementById('plan3').value);
    const portion3 = Number(document.getElementById('portion3').value);
    const cacRate = Number(document.getElementById('cacIncreaseRate').value);

    // Update global variables
    pricing = {};
    pricing[plan1] = portion1;
    pricing[plan2] = portion2;
    pricing[plan3] = portion3;
    CACIncreaseRate = cacRate;

    // Reset and regenerate table
    currentUserCount = 0;
    CAC = 200;
    marketingBudget = marketingBudgetStart;
    businessExpenses = 0;
    totalRevenue = 0;
    cumulativeProfit = 0;
    monthData = [];
    currentMonth = 1;

    updateTableHeader();
    generateFirst12Months();
});

// Modal open/close logic
document.getElementById('open-settings').addEventListener('click', () => {
    document.getElementById('settings-modal').classList.remove('hidden');
});
document.getElementById('close-settings').addEventListener('click', () => {
    document.getElementById('settings-modal').classList.add('hidden');
});
// Optional: close modal when clicking outside the modal content
document.getElementById('settings-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.add('hidden');
    }
});

// Initial rendering
updateTableHeader();
generateFirst12Months();