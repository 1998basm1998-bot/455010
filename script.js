document.addEventListener('DOMContentLoaded', () => {
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    document.getElementById('fin-date').value = today;

    let records = JSON.parse(localStorage.getItem('systemRecords')) || [];
    let financials = JSON.parse(localStorage.getItem('financialRecords')) || [];

    // --- نظام التبويبات ---
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(targetId) {
        navItems.forEach(n => n.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));

        const targetNav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
        if(targetNav) targetNav.classList.add('active');
        document.getElementById(targetId).classList.add('active');

        if(targetId === 'tab-transactions') renderTransactions();
        if(targetId === 'tab-financial') renderFinancials();
        if(targetId === 'tab-dashboard') updateDashboard();
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            switchTab(item.getAttribute('data-target'));
        });
    });

    // --- العمليات الحسابية لحركة البيع والتعبئة التلقائية للنقد ---
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
        const totalPurchase = qty * purchase; // الديون تعتمد على الشراء حسب الطلب
        const remaining = totalPurchase - received;

        totalSaleDisplay.textContent = totalSale.toLocaleString();
        netProfitDisplay.textContent = netProfit.toLocaleString();
        remainingDebtDisplay.textContent = remaining.toLocaleString();
    }

    // تعبئة المبلغ الواصل تلقائياً بناتج البيع عند إدخال الكمية والسعر
    function autoFillReceived() {
        const qty = parseFloat(qtyInput.value) || 0;
        const selling = parseFloat(sellingInput.value) || 0;
        // نضع القيمة تلقائياً، ويمكن للمستخدم تعديلها يدوياً
        amountReceivedInput.value = (qty * selling).toFixed(2).replace(/\.00$/, '');
        calculateLive();
    }

    qtyInput.addEventListener('input', autoFillReceived);
    sellingInput.addEventListener('input', autoFillReceived);
    
    // ربط الحسابات بتغيير الشراء أو تعديل المبلغ يدوياً
    purchaseInput.addEventListener('input', calculateLive);
    amountReceivedInput.addEventListener('input', calculateLive);

    // --- حفظ أو تعديل حركة المبيعات ---
    const form = document.getElementById('record-form');
    const recordIdInput = document.getElementById('record-id');
    const submitBtn = document.getElementById('submit-btn');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const currentId = recordIdInput.value;
        const inputDate = document.getElementById('date').value;
        const inputCar = document.getElementById('car-info').value.trim();

        // منع تكرار السيارة في نفس اليوم
        const isCarDuplicate = records.some(rec => 
            rec.date === inputDate && 
            rec.carInfo === inputCar && 
            rec.id.toString() !== currentId
        );

        if (isCarDuplicate) {
            alert("عذراً، هذه السيارة مسجلة مسبقاً في هذا اليوم! يرجى التأكد.");
            return;
        }

        const qty = parseFloat(qtyInput.value) || 0;
        const purchase = parseFloat(purchaseInput.value) || 0;
        const selling = parseFloat(sellingInput.value) || 0;
        const received = parseFloat(amountReceivedInput.value) || 0;
        
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
            totalSale: qty * selling,
            netProfit: (selling - purchase) * qty,
            cashierName: document.getElementById('cashier-name').value,
            amountReceived: received,
            remainingDebt: (qty * purchase) - received // بناءً على الشراء
        };

        if (currentId) {
            const index = records.findIndex(r => r.id.toString() === currentId);
            if(index !== -1) records[index] = recordData;
            alert('تم تعديل الحركة بنجاح!');
        } else {
            records.push(recordData);
            alert('تم حفظ الحركة بنجاح!');
        }

        localStorage.setItem('systemRecords', JSON.stringify(records));
        resetSalesForm();
    });

    function resetSalesForm() {
        form.reset();
        recordIdInput.value = "";
        submitBtn.textContent = "حفظ البيانات";
        document.getElementById('date').value = today;
        calculateLive();
    }

    // --- عرض وتعديل وحذف الحركات اليومية ---
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
                        <button class="action-btn btn-edit edit-sale" data-id="${rec.id}">تعديل</button>
                        <button class="action-btn btn-delete delete-sale" data-id="${rec.id}">حذف</button>
                    </div>
                </td>
            `;
            transactionsBody.appendChild(tr);
        });
    }

    transactionsBody.addEventListener('click', (e) => {
        if(e.target.classList.contains('edit-sale')) {
            const id = parseInt(e.target.getAttribute('data-id'));
            const rec = records.find(r => r.id === id);
            if(rec) {
                recordIdInput.value = rec.id;
                document.getElementById('date').value = rec.date;
                document.getElementById('driver-name').value = rec.driverName;
                document.getElementById('company-name').value = rec.companyName;
                document.getElementById('car-info').value = rec.carInfo;
                document.getElementById('material-type').value = rec.materialType;
                document.getElementById('unit-type').value = rec.unitType;
                qtyInput.value = rec.quantity;
                purchaseInput.value = rec.purchasePrice;
                sellingInput.value = rec.sellingPrice;
                document.getElementById('cashier-name').value = rec.cashierName;
                amountReceivedInput.value = rec.amountReceived;
                submitBtn.textContent = "تعديل البيانات";
                calculateLive();
                switchTab('tab-add');
            }
        } else if(e.target.classList.contains('delete-sale')) {
            const id = parseInt(e.target.getAttribute('data-id'));
            if(confirm("هل أنت متأكد من حذف هذه الحركة؟")) {
                records = records.filter(r => r.id !== id);
                localStorage.setItem('systemRecords', JSON.stringify(records));
                renderTransactions();
            }
        }
    });

    searchDriver.addEventListener('input', renderTransactions);
    searchDate.addEventListener('change', renderTransactions);

    // --- حركات الصندوق (قبض وصرف) ---
    const finForm = document.getElementById('financial-form');
    const finIdInput = document.getElementById('financial-id');
    const finSubmitBtn = document.getElementById('fin-submit-btn');

    finForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = finIdInput.value;
        const data = {
            id: id ? parseInt(id) : Date.now(),
            date: document.getElementById('fin-date').value,
            type: document.getElementById('fin-type').value,
            amount: parseFloat(document.getElementById('fin-amount').value),
            entityName: document.getElementById('fin-entity').value,
            notes: document.getElementById('fin-notes').value
        };

        if(id) {
            const idx = financials.findIndex(f => f.id.toString() === id);
            if(idx > -1) financials[idx] = data;
            alert('تم تعديل السند بنجاح!');
        } else {
            financials.push(data);
            alert('تم حفظ السند بنجاح!');
        }

        localStorage.setItem('financialRecords', JSON.stringify(financials));
        
        finForm.reset();
        finIdInput.value = "";
        finSubmitBtn.textContent = "حفظ السند";
        document.getElementById('fin-date').value = today;
        renderFinancials();
    });

    function renderFinancials() {
        const body = document.getElementById('financial-body');
        body.innerHTML = '';
        financials.sort((a,b) => b.id - a.id).forEach(f => {
            const tr = document.createElement('tr');
            const typeText = f.type === 'receipt' ? '<span style="color:#00e676">قبض</span>' : '<span style="color:#ff5252">صرف</span>';
            tr.innerHTML = `
                <td>${f.date}</td>
                <td>${typeText}</td>
                <td>${f.entityName}</td>
                <td>${f.amount.toLocaleString()}</td>
                <td>${f.notes}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn btn-edit fin-edit" data-id="${f.id}">تعديل</button>
                        <button class="action-btn btn-delete fin-delete" data-id="${f.id}">حذف</button>
                    </div>
                </td>
            `;
            body.appendChild(tr);
        });
    }

    document.getElementById('financial-body').addEventListener('click', (e) => {
        if(e.target.classList.contains('fin-edit')) {
            const id = parseInt(e.target.getAttribute('data-id'));
            const rec = financials.find(f => f.id === id);
            if(rec) {
                finIdInput.value = rec.id;
                document.getElementById('fin-date').value = rec.date;
                document.getElementById('fin-type').value = rec.type;
                document.getElementById('fin-amount').value = rec.amount;
                document.getElementById('fin-entity').value = rec.entityName;
                document.getElementById('fin-notes').value = rec.notes;
                finSubmitBtn.textContent = "تعديل السند";
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else if(e.target.classList.contains('fin-delete')) {
            const id = parseInt(e.target.getAttribute('data-id'));
            if(confirm("هل متأكد من حذف هذا السند نهائياً؟")) {
                financials = financials.filter(f => f.id !== id);
                localStorage.setItem('financialRecords', JSON.stringify(financials));
                renderFinancials();
            }
        }
    });

    // --- توليد كشف الحساب التفصيلي ---
    document.getElementById('btn-generate-stmt').addEventListener('click', () => {
        const from = document.getElementById('stmt-from').value;
        const to = document.getElementById('stmt-to').value;
        const entity = document.getElementById('stmt-entity').value.trim().toLowerCase();

        if(!entity) {
            alert("يرجى إدخال اسم الجهة المطلوبة للكشف!");
            return;
        }

        let stmtRecords = [];

        // استخراج مبيعات الجهة (الديون)
        records.forEach(r => {
            if(r.companyName.toLowerCase().includes(entity) || r.driverName.toLowerCase().includes(entity)) {
                if((!from || r.date >= from) && (!to || r.date <= to)) {
                    stmtRecords.push({
                        date: r.date,
                        desc: `فاتورة مبيعات (${r.materialType} / ${r.carInfo})`,
                        debit: r.quantity * r.purchasePrice, // عليه (قيمة البضاعة المسحوبة)
                        credit: r.amountReceived // له (المسدد نقداً في نفس الفاتورة)
                    });
                }
            }
        });

        // استخراج سندات القبض والصرف
        financials.forEach(f => {
            if(f.entityName.toLowerCase().includes(entity)) {
                if((!from || f.date >= from) && (!to || f.date <= to)) {
                    stmtRecords.push({
                        date: f.date,
                        desc: f.type === 'receipt' ? `سند استلام نقد (قبض) - ${f.notes}` : `سند دفع نقد (صرف) - ${f.notes}`,
                        debit: f.type === 'payment' ? f.amount : 0, // صرف يعني فلوس طلعتله (زادت ديونه)
                        credit: f.type === 'receipt' ? f.amount : 0 // قبض يعني سددنا (قلت ديونه)
                    });
                }
            }
        });

        // ترتيب حسب التاريخ
        stmtRecords.sort((a, b) => new Date(a.date) - new Date(b.date));

        const stmtBody = document.getElementById('stmt-body');
        stmtBody.innerHTML = '';
        
        let totalDebit = 0;
        let totalCredit = 0;

        stmtRecords.forEach(row => {
            totalDebit += row.debit;
            totalCredit += row.credit;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.date}</td>
                <td style="font-size:0.85rem">${row.desc}</td>
                <td style="color:#ff5252">${row.debit > 0 ? row.debit.toLocaleString() : '-'}</td>
                <td style="color:#00e676">${row.credit > 0 ? row.credit.toLocaleString() : '-'}</td>
            `;
            stmtBody.appendChild(tr);
        });

        const finalBalance = totalDebit - totalCredit;
        document.getElementById('stmt-final-balance').textContent = finalBalance.toLocaleString();
        document.getElementById('stmt-total-paid').textContent = totalCredit.toLocaleString();
        
        document.getElementById('stmt-result').style.display = 'block';
    });

    // --- الإحصائيات (تحديث شامل مع الصندوق) ---
    const filterCompanySelect = document.getElementById('filter-company');

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
        const filteredRecords = selectedCompany === 'all' ? records : records.filter(r => r.companyName === selectedCompany);

        let totalQty = 0;
        let totalProfit = 0;
        let totalDebt = 0;
        let safeBalance = 0; // رصيد الصندوق

        filteredRecords.forEach(rec => {
            totalQty += rec.quantity;
            totalProfit += rec.netProfit;
            totalDebt += rec.remainingDebt;
        });

        // حساب رصيد الصندوق (من المبيعات + السندات) 
        // ملاحظة: الصندوق عام ولا يتأثر بفلتر الشركة لأنه فلوسك الفعلية بالدرج
        records.forEach(r => safeBalance += (r.amountReceived || 0));
        financials.forEach(f => {
            if(f.type === 'receipt') safeBalance += f.amount;
            if(f.type === 'payment') safeBalance -= f.amount;
        });

        document.getElementById('stat-total-qty').textContent = totalQty.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 3});
        document.getElementById('stat-total-profit').textContent = totalProfit.toLocaleString();
        document.getElementById('stat-total-debt').textContent = totalDebt.toLocaleString();
        document.getElementById('stat-safe-balance').textContent = safeBalance.toLocaleString();
    }

    filterCompanySelect.addEventListener('change', calculateDashboardStats);
});
