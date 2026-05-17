document.addEventListener('DOMContentLoaded', () => {
    
    // إعداد تاريخ اليوم تلقائياً
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // --- نظام التبويبات السفلي (Bottom Navigation) ---
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // إزالة التفعيل من الكل
            navItems.forEach(n => n.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            // تفعيل التبويب المطلوب
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // تحديث البيانات إذا انتقلنا لتبويب آخر
            if(targetId === 'tab-transactions') renderTransactions();
            if(targetId === 'tab-dashboard') updateDashboard();
        });
    });

    // --- العمليات الحسابية الحية (Live Calculations) ---
    const qtyInput = document.getElementById('quantity');
    const purchaseInput = document.getElementById('purchase-price');
    const sellingInput = document.getElementById('selling-price');
    const amountReceivedInput = document.getElementById('amount-received');

    const totalSaleDisplay = document.getElementById('total-sale-display');
    const netProfitDisplay = document.getElementById('net-profit-display');
    const remainingDebtDisplay = document.getElementById('remaining-debt-display');

    function calculateLive() {
        const qty = parseFloat(qtyInput.value) || 0;
        const purchase = parseFloat(purchaseInput.value) || 0;
        const selling = parseFloat(sellingInput.value) || 0;
        const received = parseFloat(amountReceivedInput.value) || 0;

        const totalSale = qty * selling;
        const netProfit = (selling - purchase) * qty;
        const remaining = totalSale - received;

        totalSaleDisplay.textContent = totalSale.toLocaleString();
        netProfitDisplay.textContent = netProfit.toLocaleString();
        remainingDebtDisplay.textContent = remaining.toLocaleString();
    }

    [qtyInput, purchaseInput, sellingInput, amountReceivedInput].forEach(input => {
        input.addEventListener('input', calculateLive);
    });

    // --- حفظ البيانات (LocalStorage) ---
    const form = document.getElementById('record-form');
    let records = JSON.parse(localStorage.getItem('systemRecords')) || [];

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const qty = parseFloat(qtyInput.value) || 0;
        const purchase = parseFloat(purchaseInput.value) || 0;
        const selling = parseFloat(sellingInput.value) || 0;
        const received = parseFloat(amountReceivedInput.value) || 0;
        const totalSale = qty * selling;

        const newRecord = {
            id: Date.now(),
            date: dateInput.value,
            driverName: document.getElementById('driver-name').value,
            companyName: document.getElementById('company-name').value,
            carInfo: document.getElementById('car-info').value,
            materialType: document.getElementById('material-type').value,
            unitType: document.getElementById('unit-type').value,
            quantity: qty,
            purchasePrice: purchase,
            sellingPrice: selling,
            totalSale: totalSale,
            netProfit: (selling - purchase) * qty,
            cashierName: document.getElementById('cashier-name').value,
            amountReceived: received,
            remainingDebt: totalSale - received
        };

        records.push(newRecord);
        localStorage.setItem('systemRecords', JSON.stringify(records));
        
        alert('تم حفظ الحركة بنجاح!');
        form.reset();
        dateInput.value = today; // إعادة التاريخ
        calculateLive(); // تصفير الحسابات
    });

    // --- الحركات اليومية والبحث ---
    const transactionsBody = document.getElementById('transactions-body');
    const searchDriver = document.getElementById('search-driver');
    const searchDate = document.getElementById('search-date');

    function renderTransactions() {
        transactionsBody.innerHTML = '';
        const driverFilter = searchDriver.value.toLowerCase();
        const dateFilter = searchDate.value;

        const filteredRecords = records.filter(rec => {
            const matchDriver = rec.driverName.toLowerCase().includes(driverFilter);
            const matchDate = dateFilter ? rec.date === dateFilter : true;
            return matchDriver && matchDate;
        });

        filteredRecords.sort((a, b) => b.id - a.id).forEach(rec => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${rec.date}</td>
                <td>${rec.driverName}</td>
                <td>${rec.companyName}</td>
                <td>${rec.materialType} (${rec.unitType})</td>
                <td>${rec.quantity}</td>
                <td>${rec.totalSale.toLocaleString()}</td>
                <td>${rec.amountReceived.toLocaleString()}</td>
                <td style="color: #ff5252">${rec.remainingDebt.toLocaleString()}</td>
                <td style="color: #00e676">${rec.netProfit.toLocaleString()}</td>
            `;
            transactionsBody.appendChild(tr);
        });
    }

    searchDriver.addEventListener('input', renderTransactions);
    searchDate.addEventListener('change', renderTransactions);

    // --- الإحصائيات (الفلترة حسب الشركة والمجموع) ---
    const filterCompanySelect = document.getElementById('filter-company');
    const statTotalQty = document.getElementById('stat-total-qty');
    const statTotalProfit = document.getElementById('stat-total-profit');
    const statTotalDebt = document.getElementById('stat-total-debt');

    function updateDashboard() {
        // تحديث قائمة الشركات
        const companies = [...new Set(records.map(r => r.companyName))];
        
        // الاحتفاظ بالخيار المحدد حالياً لتجنب إعادة تعيين الفلتر
        const currentSelection = filterCompanySelect.value;
        filterCompanySelect.innerHTML = '<option value="all">الكل</option>';
        companies.forEach(company => {
            if(company) {
                const option = document.createElement('option');
                option.value = company;
                option.textContent = company;
                filterCompanySelect.appendChild(option);
            }
        });
        filterCompanySelect.value = currentSelection || 'all';

        calculateDashboardStats();
    }

    function calculateDashboardStats() {
        const selectedCompany = filterCompanySelect.value;
        
        const filteredRecords = selectedCompany === 'all' 
            ? records 
            : records.filter(r => r.companyName === selectedCompany);

        let totalQty = 0;
        let totalProfit = 0;
        let totalDebt = 0;

        filteredRecords.forEach(rec => {
            totalQty += rec.quantity;
            totalProfit += rec.netProfit;
            totalDebt += rec.remainingDebt;
        });

        statTotalQty.textContent = totalQty.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 3});
        statTotalProfit.textContent = totalProfit.toLocaleString();
        statTotalDebt.textContent = totalDebt.toLocaleString();
    }

    filterCompanySelect.addEventListener('change', calculateDashboardStats);
});
