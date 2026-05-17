document.addEventListener('DOMContentLoaded', () => {
    
    // إعداد تاريخ اليوم تلقائياً
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // --- نظام التبويبات السفلي ---
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(targetId) {
        navItems.forEach(n => n.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));

        const targetNav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
        if(targetNav) targetNav.classList.add('active');
        document.getElementById(targetId).classList.add('active');

        if(targetId === 'tab-transactions') renderTransactions();
        if(targetId === 'tab-dashboard') updateDashboard();
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            switchTab(item.getAttribute('data-target'));
        });
    });

    // --- العمليات الحسابية الحية ---
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
        
        // التعديل: المتبقي الديون يعتمد على سعر الشراء 
        const totalPurchase = qty * purchase;
        const remaining = totalPurchase - received;

        totalSaleDisplay.textContent = totalSale.toLocaleString();
        netProfitDisplay.textContent = netProfit.toLocaleString();
        remainingDebtDisplay.textContent = remaining.toLocaleString();
    }

    [qtyInput, purchaseInput, sellingInput, amountReceivedInput].forEach(input => {
        input.addEventListener('input', calculateLive);
    });

    // --- حفظ أو تعديل البيانات ---
    const form = document.getElementById('record-form');
    const recordIdInput = document.getElementById('record-id');
    const submitBtn = document.getElementById('submit-btn');
    let records = JSON.parse(localStorage.getItem('systemRecords')) || [];

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const currentId = recordIdInput.value;
        const inputDate = dateInput.value;
        const inputCar = document.getElementById('car-info').value.trim();

        // التعديل: منع تكرار السيارة في نفس اليوم (مع استثناء السجل الحالي إذا كنا في وضع التعديل)
        const isCarDuplicate = records.some(rec => 
            rec.date === inputDate && 
            rec.carInfo === inputCar && 
            rec.id.toString() !== currentId
        );

        if (isCarDuplicate) {
            alert("عذراً، هذه السيارة مسجلة مسبقاً في هذا اليوم! يرجى التأكد من رقم السيارة.");
            return; // إيقاف عملية الحفظ
        }

        const qty = parseFloat(qtyInput.value) || 0;
        const purchase = parseFloat(purchaseInput.value) || 0;
        const selling = parseFloat(sellingInput.value) || 0;
        const received = parseFloat(amountReceivedInput.value) || 0;
        const totalSale = qty * selling;
        
        // حساب الدين بناءً على سعر الشراء
        const totalPurchase = qty * purchase;

        const recordData = {
            id: currentId ? parseInt(currentId) : Date.now(),
            date: inputDate,
            driverName: document.getElementById('driver-name').value,
            companyName: document.getElementById('company-name').value,
            carInfo: inputCar,
            materialType: document.getElementById('material-type').value,
            unitType: document.getElementById('unit-type').value,
            quantity: qty,
            purchasePrice: purchase,
            sellingPrice: selling,
            totalSale: totalSale,
            netProfit: (selling - purchase) * qty,
            cashierName: document.getElementById('cashier-name').value,
            amountReceived: received,
            remainingDebt: totalPurchase - received // بناءً على الشراء
        };

        if (currentId) {
            // تحديث سجل موجود
            const index = records.findIndex(r => r.id.toString() === currentId);
            if(index !== -1) records[index] = recordData;
            alert('تم تعديل الحركة بنجاح!');
        } else {
            // إضافة سجل جديد
            records.push(recordData);
            alert('تم حفظ الحركة بنجاح!');
        }

        localStorage.setItem('systemRecords', JSON.stringify(records));
        
        // إعادة تهيئة النموذج
        resetForm();
    });

    function resetForm() {
        form.reset();
        recordIdInput.value = "";
        submitBtn.textContent = "حفظ البيانات";
        dateInput.value = new Date().toISOString().split('T')[0];
        calculateLive();
    }

    // --- الحركات اليومية، التعديل والحذف ---
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
                <td>${rec.carInfo}</td>
                <td>${rec.companyName}</td>
                <td>${rec.materialType} (${rec.unitType})</td>
                <td>${rec.quantity}</td>
                <td>${rec.amountReceived.toLocaleString()}</td>
                <td style="color: #ff5252">${rec.remainingDebt.toLocaleString()}</td>
                <td style="color: #00e676">${rec.netProfit.toLocaleString()}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn btn-edit" data-id="${rec.id}">تعديل</button>
                        <button class="action-btn btn-delete" data-id="${rec.id}">حذف</button>
                    </div>
                </td>
            `;
            transactionsBody.appendChild(tr);
        });
    }

    // إدارة أزرار التعديل والحذف داخل الجدول
    transactionsBody.addEventListener('click', (e) => {
        if(e.target.classList.contains('btn-edit')) {
            const id = parseInt(e.target.getAttribute('data-id'));
            loadRecordForEdit(id);
        } else if(e.target.classList.contains('btn-delete')) {
            const id = parseInt(e.target.getAttribute('data-id'));
            deleteRecord(id);
        }
    });

    function loadRecordForEdit(id) {
        const rec = records.find(r => r.id === id);
        if(!rec) return;

        recordIdInput.value = rec.id;
        document.getElementById('date').value = rec.date;
        document.getElementById('driver-name').value = rec.driverName;
        document.getElementById('company-name').value = rec.companyName;
        document.getElementById('car-info').value = rec.carInfo;
        document.getElementById('material-type').value = rec.materialType;
        document.getElementById('unit-type').value = rec.unitType;
        document.getElementById('quantity').value = rec.quantity;
        document.getElementById('purchase-price').value = rec.purchasePrice;
        document.getElementById('selling-price').value = rec.sellingPrice;
        document.getElementById('cashier-name').value = rec.cashierName;
        document.getElementById('amount-received').value = rec.amountReceived;

        submitBtn.textContent = "تعديل البيانات";
        calculateLive();
        
        // الانتقال لتبويب الإضافة/التعديل
        switchTab('tab-add');
    }

    function deleteRecord(id) {
        if(confirm("هل أنت متأكد من حذف هذه الحركة بشكل نهائي؟")) {
            records = records.filter(r => r.id !== id);
            localStorage.setItem('systemRecords', JSON.stringify(records));
            renderTransactions();
            updateDashboard();
        }
    }

    searchDriver.addEventListener('input', renderTransactions);
    searchDate.addEventListener('change', renderTransactions);

    // --- الإحصائيات ---
    const filterCompanySelect = document.getElementById('filter-company');
    const statTotalQty = document.getElementById('stat-total-qty');
    const statTotalProfit = document.getElementById('stat-total-profit');
    const statTotalDebt = document.getElementById('stat-total-debt');

    function updateDashboard() {
        const companies = [...new Set(records.map(r => r.companyName))];
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
