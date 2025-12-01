// frontend/js/app.js

// ==================== СОСТОЯНИЕ ПРИЛОЖЕНИЯ ====================
const state = {
    currentTab: 'dashboard',
    currentCategoryType: 'expense',
    accounts: [],
    categories: [],
    transactions: [],
    goals: [],
    credits: [],
    mortgages: [],
    creditCards: [],
    stores: [],
    products: [],
    investments: [],
    achievements: [],
    dashboard: null
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initModals();
    initFilters();
    initCalculator();
    loadAllData();
});

// ==================== НАВИГАЦИЯ ====================
function initNavigation() {
    // Клики по навигации
    document.querySelectorAll('.nav-item, .mobile-nav-item, .card-link').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.dataset.tab;
            if (tab) switchTab(tab);
        });
    });
    
    // Открытие/закрытие сайдбара
    document.getElementById('menuBtn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('open');
    });
    
    document.getElementById('sidebarClose').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
    });
    
    // Закрытие сайдбара при клике вне его
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const menuBtn = document.getElementById('menuBtn');
        if (sidebar.classList.contains('open') && 
            !sidebar.contains(e.target) && 
            !menuBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
    
    // Кнопки добавления
    document.getElementById('addBtn').addEventListener('click', showTransactionModal);
    document.getElementById('fab').addEventListener('click', showTransactionModal);
    document.getElementById('refreshBtn').addEventListener('click', () => {
        showToast('Обновление данных...', 'info');
        loadAllData();
    });
    
    // Кнопки добавления в секциях
    const addButtons = {
        'addAccountBtn': () => showAccountModal(),
        'addCreditCardBtn': () => showCreditCardModal(),
        'addCategoryBtn': () => showCategoryModal(),
        'addGoalBtn': () => showGoalModal(),
        'addCreditBtn': () => showCreditModal(),
        'addMortgageBtn': () => showMortgageModal(),
        'addInvestmentBtn': () => showInvestmentModal(),
        'addStoreBtn': () => showStoreModal(),
        'addProductBtn': () => showProductModal(),
        'addTaxBtn': () => showTaxModal()
    };
    
    Object.entries(addButtons).forEach(([id, handler]) => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', handler);
    });
    
    // Табы категорий
    document.querySelectorAll('.cat-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.currentCategoryType = tab.dataset.type;
            renderCategories();
        });
    });
}

function switchTab(tab) {
    state.currentTab = tab;
    
    // Обновляем активные элементы навигации
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tab);
    });
    
    // Показываем нужный контент
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tab}-tab`);
    });
    
    // Обновляем заголовок
    const titles = {
        'dashboard': 'Дашборд',
        'transactions': 'Операции',
        'accounts': 'Счета',
        'credit-cards': 'Кредитные карты',
        'categories': 'Категории',
        'goals': 'Цели',
        'credits': 'Кредиты',
        'mortgages': 'Ипотека',
        'calculator': 'Калькулятор',
        'investments': 'Инвестиции',
        'taxes': 'Налоги',
        'analytics': 'Аналитика',
        'prices': 'Сравнение цен',
        'achievements': 'Достижения'
    };
    document.getElementById('pageTitle').textContent = titles[tab] || tab;
    
    // Закрываем сайдбар на мобильных
    document.getElementById('sidebar').classList.remove('open');
    
    // Загружаем данные для вкладки
    if (tab === 'analytics') loadAnalytics();
    if (tab === 'achievements') loadAchievements();
    if (tab === 'transactions') loadTransactions();
}

// ==================== МОДАЛЬНЫЕ ОКНА ====================
function initModals() {
    const overlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('modalClose');
    
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
    
    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function openModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

// ==================== ФИЛЬТРЫ ====================
function initFilters() {
    const filterIds = ['filterType', 'filterAccount', 'filterCategory', 'filterStartDate', 'filterEndDate'];
    filterIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', loadTransactions);
    });
    
    const searchInput = document.getElementById('filterSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(loadTransactions, 300));
    }
    
    // Период аналитики
    const analyticsPeriod = document.getElementById('analyticsPeriod');
    if (analyticsPeriod) {
        analyticsPeriod.addEventListener('change', loadAnalytics);
    }
}

function updateFilters() {
    // Обновляем список счетов в фильтре
    const accountFilter = document.getElementById('filterAccount');
    if (accountFilter) {
        accountFilter.innerHTML = '<option value="">Все счета</option>' +
            state.accounts.map(a => `<option value="${a.id}">${a.icon} ${a.name}</option>`).join('');
    }
    
    // Обновляем список категорий в фильтре
    const categoryFilter = document.getElementById('filterCategory');
    if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="">Все категории</option>' +
            state.categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
    }
}

// ==================== КАЛЬКУЛЯТОР ====================
function initCalculator() {
    // Табы калькулятора
    document.querySelectorAll('.calc-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.calc-section').forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`calc-${tab.dataset.calc}`).classList.add('active');
        });
    });
    
    // Кнопки расчёта
    document.getElementById('calcCreditBtn')?.addEventListener('click', calculateCredit);
    document.getElementById('calcMortgageBtn')?.addEventListener('click', calculateMortgage);
    document.getElementById('calcEarlyBtn')?.addEventListener('click', calculateEarlyPayment);
}

async function calculateCredit() {
    const amount = parseFloat(document.getElementById('calcAmount').value) || 0;
    const rate = parseFloat(document.getElementById('calcRate').value) || 0;
    const term = parseInt(document.getElementById('calcTerm').value) || 0;
    const extra = parseFloat(document.getElementById('calcExtra').value) || 0;
    
    if (!amount || !rate || !term) {
        showToast('Заполните все поля', 'warning');
        return;
    }
    
    try {
        const result = await API.calculator.credit({
            amount, interest_rate: rate, term_months: term, extra_payment: extra
        });
        
        const container = document.getElementById('calcCreditResult');
        container.innerHTML = `
            <div class="calc-result-header">Результаты расчёта</div>
            <div class="calc-result-item">
                <span class="calc-result-label">Ежемесячный платёж</span>
                <span class="calc-result-value highlight">${formatMoney(result.monthly_payment)}</span>
            </div>
            <div class="calc-result-item">
                <span class="calc-result-label">Общая сумма выплат</span>
                <span class="calc-result-value">${formatMoney(result.total_payment)}</span>
            </div>
            <div class="calc-result-item">
                <span class="calc-result-label">Переплата</span>
                <span class="calc-result-value" style="color: var(--danger)">${formatMoney(result.overpayment)}</span>
            </div>
            ${result.strategies.with_extra ? `
                <div class="calc-comparison">
                    <div class="calc-comparison-title">💡 С досрочными платежами</div>
                    <div class="calc-comparison-options">
                        <div class="calc-option">
                            <div class="calc-option-title">Срок</div>
                            <div class="calc-option-value">${result.strategies.with_extra.term_months} мес.</div>
                            <div class="calc-option-savings">-${result.strategies.with_extra.months_saved} мес.</div>
                        </div>
                        <div class="calc-option recommended">
                            <div class="calc-option-title">Экономия</div>
                            <div class="calc-option-value">${formatMoney(result.strategies.with_extra.savings)}</div>
                            <div class="calc-option-savings">на процентах</div>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;
    } catch (error) {
        showToast('Ошибка расчёта', 'error');
    }
}

async function calculateMortgage() {
    const propertyValue = parseFloat(document.getElementById('calcPropertyValue').value) || 0;
    const downPayment = parseFloat(document.getElementById('calcDownPayment').value) || 0;
    const rate = parseFloat(document.getElementById('calcMortgageRate').value) || 0;
    const term = parseInt(document.getElementById('calcMortgageTerm').value) || 0;
    const paymentType = document.getElementById('calcPaymentType').value;
    
    if (!propertyValue || !rate || !term) {
        showToast('Заполните все поля', 'warning');
        return;
    }
    
    try {
        const result = await API.calculator.mortgage({
            property_value: propertyValue,
            down_payment: downPayment,
            interest_rate: rate,
            term_months: term * 12,
            payment_type: paymentType
        });
        
        const container = document.getElementById('calcMortgageResult');
        container.innerHTML = `
            <div class="calc-result-header">Результаты расчёта</div>
            <div class="calc-result-item">
                <span class="calc-result-label">Сумма кредита</span>
                <span class="calc-result-value">${formatMoney(result.loan_amount)}</span>
            </div>
            <div class="calc-result-item">
                <span class="calc-result-label">Ежемесячный платёж</span>
                <span class="calc-result-value highlight">${formatMoney(result.monthly_payment)}</span>
            </div>
            ${paymentType === 'differentiated' ? `
                <div class="calc-result-item">
                    <span class="calc-result-label">Последний платёж</span>
                    <span class="calc-result-value">${formatMoney(result.monthly_payment_last)}</span>
                </div>
            ` : ''}
            <div class="calc-result-item">
                <span class="calc-result-label">Общая сумма выплат</span>
                <span class="calc-result-value">${formatMoney(result.total_payment)}</span>
            </div>
            <div class="calc-result-item">
                <span class="calc-result-label">Переплата</span>
                <span class="calc-result-value" style="color: var(--danger)">${formatMoney(result.overpayment)}</span>
            </div>
        `;
    } catch (error) {
        showToast('Ошибка расчёта', 'error');
    }
}

function calculateEarlyPayment() {
    const remaining = parseFloat(document.getElementById('calcEarlyRemaining').value) || 0;
    const rate = parseFloat(document.getElementById('calcEarlyRate').value) || 0;
    const months = parseInt(document.getElementById('calcEarlyMonths').value) || 0;
    const payment = parseFloat(document.getElementById('calcEarlyPayment').value) || 0;
    const earlyAmount = parseFloat(document.getElementById('calcEarlyAmount').value) || 0;
    
    if (!remaining || !rate || !months || !payment || !earlyAmount) {
        showToast('Заполните все поля', 'warning');
        return;
    }
    
    const monthlyRate = rate / 100 / 12;
    
    // Без досрочного погашения
    const totalWithout = payment * months;
    const interestWithout = totalWithout - remaining;
    
    // Уменьшение срока
    const newRemaining = remaining - earlyAmount;
    let monthsReduced = 0;
    let tempRemaining = newRemaining;
    while (tempRemaining > 0 && monthsReduced < months * 2) {
        const interest = tempRemaining * monthlyRate;
        const principal = payment - interest;
        tempRemaining -= principal;
        monthsReduced++;
    }
    const totalReduceTerm = payment * monthsReduced;
    const savingsReduceTerm = totalWithout - totalReduceTerm - earlyAmount;
    
    // Уменьшение платежа
    const newPayment = newRemaining * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalReducePayment = newPayment * months + earlyAmount;
    const savingsReducePayment = totalWithout - totalReducePayment;
    
    const container = document.getElementById('calcEarlyResult');
    container.innerHTML = `
        <div class="calc-result-header">Сравнение вариантов</div>
        
        <div class="calc-comparison">
            <div class="calc-comparison-title">Без досрочного погашения</div>
            <div class="calc-result-item">
                <span class="calc-result-label">Всего выплатите</span>
                <span class="calc-result-value">${formatMoney(totalWithout)}</span>
            </div>
        </div>
        
        <div class="calc-comparison">
            <div class="calc-comparison-title">🎯 Уменьшение срока</div>
            <div class="calc-comparison-options">
                <div class="calc-option ${savingsReduceTerm > savingsReducePayment ? 'recommended' : ''}">
                    <div class="calc-option-title">Новый срок</div>
                    <div class="calc-option-value">${monthsReduced} мес.</div>
                    <div class="calc-option-savings">-${months - monthsReduced} мес.</div>
                </div>
                <div class="calc-option ${savingsReduceTerm > savingsReducePayment ? 'recommended' : ''}">
                    <div class="calc-option-title">Экономия</div>
                    <div class="calc-option-value">${formatMoney(savingsReduceTerm)}</div>
                </div>
            </div>
        </div>
        
        <div class="calc-comparison">
            <div class="calc-comparison-title">💰 Уменьшение платежа</div>
            <div class="calc-comparison-options">
                <div class="calc-option ${savingsReducePayment > savingsReduceTerm ? 'recommended' : ''}">
                    <div class="calc-option-title">Новый платёж</div>
                    <div class="calc-option-value">${formatMoney(newPayment)}</div>
                    <div class="calc-option-savings">-${formatMoney(payment - newPayment)}</div>
                </div>
                <div class="calc-option ${savingsReducePayment > savingsReduceTerm ? 'recommended' : ''}">
                    <div class="calc-option-title">Экономия</div>
                    <div class="calc-option-value">${formatMoney(savingsReducePayment)}</div>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 20px; padding: 16px; background: var(--success-light); border-radius: var(--radius); text-align: center;">
            <strong>💡 Рекомендация:</strong> ${savingsReduceTerm > savingsReducePayment 
                ? 'Уменьшайте срок — экономия больше!' 
                : 'Уменьшайте платёж — больше свободных денег!'}
        </div>
    `;
}

// ==================== ЗАГРУЗКА ДАННЫХ ====================
async function loadAllData() {
    try {
        const [dashboard, accounts, categories, transactionsData, goals, credits, mortgages, creditCards, stores, products, investments] = await Promise.all([
            API.dashboard.get(),
            API.accounts.getAll(),
            API.categories.getAll(),
            API.transactions.getAll({ per_page: 20 }),
            API.goals.getAll(),
            API.credits.getAll(),
            API.mortgages.getAll(),
            API.creditCards.getAll(),
            API.stores.getAll(),
            API.products.getAll(),
            API.investments.getAll()
        ]);
        
        state.dashboard = dashboard;
        state.accounts = accounts;
        state.categories = categories;
        state.transactions = transactionsData.transactions;
        state.goals = goals;
        state.credits = credits;
        state.mortgages = mortgages;
        state.creditCards = creditCards;
        state.stores = stores;
        state.products = products;
        state.investments = investments;
        
        renderAll();
        showToast('Данные загружены', 'success');
    } catch (error) {
        console.error('Load error:', error);
        showToast('Ошибка загрузки данных', 'error');
    }
}

async function loadTransactions() {
    const params = {};
    
    const type = document.getElementById('filterType')?.value;
    const account = document.getElementById('filterAccount')?.value;
    const category = document.getElementById('filterCategory')?.value;
    const startDate = document.getElementById('filterStartDate')?.value;
    const endDate = document.getElementById('filterEndDate')?.value;
    const search = document.getElementById('filterSearch')?.value;
    
    if (type) params.type = type;
    if (account) params.account_id = account;
    if (category) params.category_id = category;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (search) params.search = search;
    
    try {
        const result = await API.transactions.getAll(params);
        state.transactions = result.transactions;
        renderTransactions();
    } catch (error) {
        showToast('Ошибка загрузки операций', 'error');
    }
}

async function loadAnalytics() {
    const period = document.getElementById('analyticsPeriod')?.value || 'month';
    
    let startDate, endDate;
    const today = new Date();
    endDate = today.toISOString().split('T')[0];
    
    switch (period) {
        case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            break;
        case 'quarter':
            startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().split('T')[0];
            break;
        case 'year':
            startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
            break;
        case 'all':
            startDate = '2020-01-01';
            break;
    }
    
    try {
        const [expenseStats, incomeStats, storeStats] = await Promise.all([
            API.stats.byCategory({ type: 'expense', start_date: startDate, end_date: endDate }),
            API.stats.byCategory({ type: 'income', start_date: startDate, end_date: endDate }),
            API.stats.byStore({ start_date: startDate, end_date: endDate })
        ]);
        
        renderChart('expenseChart', expenseStats);
        renderChart('incomeChart', incomeStats);
        renderStoreChart('storeChart', storeStats);
    } catch (error) {
        showToast('Ошибка загрузки аналитики', 'error');
    }
}

async function loadAchievements() {
    try {
        state.achievements = await API.achievements.getAll();
        renderAchievements();
    } catch (error) {
        showToast('Ошибка загрузки достижений', 'error');
    }
}

// ==================== РЕНДЕРИНГ ====================
function renderAll() {
    renderDashboard();
    renderAccounts();
    renderCreditCards();
    renderCategories();
    renderTransactions();
    renderGoals();
    renderCredits();
    renderMortgages();
    renderInvestments();
    renderStores();
    renderProducts();
    renderTaxes();
    updateFilters();
}

// ----- ДАШБОРД -----
function renderDashboard() {
    const d = state.dashboard;
    if (!d) return;
    
    // Баланс
    document.getElementById('totalBalance').textContent = formatMoney(d.balance.total);
    document.getElementById('netWorth').textContent = formatMoney(d.balance.net_worth);
    
    // Месячные показатели
    document.getElementById('monthlyIncome').textContent = formatMoney(d.monthly.income);
    document.getElementById('monthlyExpense').textContent = formatMoney(d.monthly.expense);
    document.getElementById('monthlySavings').textContent = formatMoney(d.monthly.savings);
    document.getElementById('savingsRate').textContent = `${d.monthly.savings_rate}%`;
    
    // Изменения
    renderChange('incomeChange', d.monthly.income_change, true);
    renderChange('expenseChange', d.monthly.expense_change, false);
    
    // Ближайшие платежи
    renderUpcomingPayments(d.upcoming_payments);
    
    // Превышение бюджета
    renderOverBudget(d.over_budget_categories);
    
    // Тренды
    renderTrendsChart(d.trends);
    
    // Долги
    document.getElementById('creditsDebt').textContent = formatMoney(d.debts.credits_remaining);
    document.getElementById('mortgageDebt').textContent = formatMoney(d.debts.mortgage_remaining);
    document.getElementById('cardsDebt').textContent = formatMoney(d.debts.credit_cards_debt);
    document.getElementById('totalDebt').textContent = formatMoney(d.debts.total_debt);
    
    // Инвестиции
    document.getElementById('investmentValue').textContent = formatMoney(d.investments.current_value);
    const profitEl = document.getElementById('investmentProfit');
    const profit = d.investments.profit;
    profitEl.textContent = `${profit >= 0 ? '+' : ''}${formatMoney(profit)} (${d.investments.profit_percent}%)`;
    profitEl.className = `investment-profit ${profit >= 0 ? '' : 'negative'}`;
    
    // Мини-списки
    renderGoalsMini();
    renderTransactionsMini();
}

function renderChange(elementId, value, positiveIsGood) {
    const el = document.getElementById(elementId);
    const isPositive = value >= 0;
    const isGood = positiveIsGood ? isPositive : !isPositive;
    
    el.innerHTML = `
        <span>${isPositive ? '↑' : '↓'} ${Math.abs(value).toFixed(1)}%</span>
        <span>vs прошлый месяц</span>
    `;
    el.className = `card-change ${isGood ? 'positive' : 'negative'}`;
}

function renderUpcomingPayments(payments) {
    const container = document.getElementById('upcomingPayments');
    
    if (!payments || payments.length === 0) {
        container.innerHTML = '<div class="empty-state small">Нет предстоящих платежей 🎉</div>';
        return;
    }
    
    const icons = { mortgage: '🏠', credit_card: '💳', credit: '📋' };
    
    container.innerHTML = payments.map(p => `
        <div class="upcoming-item ${p.days_left <= 3 ? 'urgent' : ''}">
            <span class="upcoming-icon">${icons[p.type] || '💰'}</span>
            <div class="upcoming-info">
                <div class="upcoming-name">${p.name}</div>
                <div class="upcoming-date">${p.days_left === 0 ? 'Сегодня!' : p.days_left === 1 ? 'Завтра' : `Через ${p.days_left} дн.`}</div>
            </div>
            <div class="upcoming-amount">${formatMoney(p.amount)}</div>
        </div>
    `).join('');
}

function renderOverBudget(categories) {
    const container = document.getElementById('overBudgetList');
    
    if (!categories || categories.length === 0) {
        container.innerHTML = '<div class="empty-state small">Всё под контролем! 👍</div>';
        return;
    }
    
    container.innerHTML = categories.map(c => `
        <div class="over-budget-item">
            <span class="over-budget-icon">${c.icon}</span>
            <div class="over-budget-info">
                <div class="over-budget-name">${c.name}</div>
                <div class="over-budget-amount">+${formatMoney(c.over)} сверх бюджета</div>
            </div>
        </div>
    `).join('');
}

function renderTrendsChart(trends) {
    const container = document.getElementById('trendsChart');
    
    if (!trends || trends.length === 0) {
        container.innerHTML = '<div class="empty-state small">Нет данных для отображения</div>';
        return;
    }
    
    const maxValue = Math.max(...trends.flatMap(t => [t.income, t.expense])) || 1;
    
    container.innerHTML = `
        <div class="trends-chart">
            ${trends.map(t => {
                const incomeHeight = (t.income / maxValue) * 140;
                const expenseHeight = (t.expense / maxValue) * 140;
                const monthName = new Date(t.month + '-01').toLocaleDateString('ru-RU', { month: 'short' });
                
                return `
                    <div class="trend-bar-group">
                        <div class="trend-bars">
                            <div class="trend-bar income" style="height: ${incomeHeight}px" title="Доходы: ${formatMoney(t.income)}"></div>
                            <div class="trend-bar expense" style="height: ${expenseHeight}px" title="Расходы: ${formatMoney(t.expense)}"></div>
                        </div>
                        <div class="trend-label">${monthName}</div>
                    </div>
                `;
            }).join('')}
        </div>
        <div style="display: flex; justify-content: center; gap: 24px; margin-top: 16px; font-size: 13px;">
            <span style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 12px; height: 12px; background: var(--success); border-radius: 2px;"></span>
                Доходы
            </span>
            <span style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 12px; height: 12px; background: var(--danger); border-radius: 2px;"></span>
                Расходы
            </span>
        </div>
    `;
}

function renderGoalsMini() {
    const container = document.getElementById('goalsMini');
    const goals = state.goals.slice(0, 3);
    
    if (goals.length === 0) {
        container.innerHTML = '<div class="empty-state small">Добавьте первую цель 🎯</div>';
        return;
    }
    
    container.innerHTML = goals.map(g => `
        <div class="goal-mini-item">
            <div class="goal-mini-header">
                <span class="goal-mini-icon">${g.icon}</span>
                <span class="goal-mini-name">${g.name}</span>
                <span class="goal-mini-percent">${g.progress}%</span>
            </div>
            <div class="goal-mini-progress">
                <div class="goal-mini-progress-fill" style="width: ${g.progress}%; background: ${g.color}"></div>
            </div>
        </div>
    `).join('');
}

function renderTransactionsMini() {
    const container = document.getElementById('transactionsMini');
    const transactions = state.transactions.slice(0, 5);
    
    if (transactions.length === 0) {
        container.innerHTML = '<div class="empty-state small">Нет операций</div>';
        return;
    }
    
    container.innerHTML = transactions.map(t => `
        <div class="transaction-mini-item">
            <div class="transaction-mini-icon" style="background: ${t.category_color || '#667eea'}20">
                ${t.category_icon || (t.type === 'transfer' ? '↔️' : '💰')}
            </div>
            <div class="transaction-mini-info">
                <div class="transaction-mini-category">${t.category_name || t.description || 'Операция'}</div>
                <div class="transaction-mini-date">${formatDate(t.date)}</div>
            </div>
            <div class="transaction-mini-amount ${t.type}">
                ${t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}${formatMoney(t.amount)}
            </div>
        </div>
    `).join('');
}

// ----- СЧЕТА -----
function renderAccounts() {
    const types = {
        'debitAccountsGrid': a => a.account_type === 'debit' || a.account_type === 'savings',
        'cashAccountsGrid': a => a.account_type === 'cash',
        'businessAccountsGrid': a => a.is_business,
        'investmentAccountsGrid': a => a.is_investment
    };
    
    Object.entries(types).forEach(([containerId, filter]) => {
        const accounts = state.accounts.filter(filter);
        renderAccountsGrid(containerId, accounts);
    });
}

function renderAccountsGrid(containerId, accounts) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (accounts.length === 0) {
        container.innerHTML = '<div class="empty-state small">Нет счетов в этой категории</div>';
        return;
    }
    
    container.innerHTML = accounts.map(a => {
        let extraInfo = '';
        
        if (a.is_business && a.pending_tax) {
            extraInfo = `
                <div class="account-details">
                    <div class="account-detail">
                        <span>Ставка налога</span>
                        <span>${a.tax_rate}%</span>
                    </div>
                    <div class="account-detail">
                        <span>К уплате</span>
                        <span style="color: var(--warning); font-weight: 600;">${formatMoney(a.pending_tax)}</span>
                    </div>
                </div>
            `;
        }
        
        if (a.is_investment && a.total_invested) {
            const profitColor = a.total_profit >= 0 ? 'var(--success)' : 'var(--danger)';
            extraInfo = `
                <div class="account-details">
                    <div class="account-detail">
                        <span>Вложено</span>
                        <span>${formatMoney(a.total_invested)}</span>
                    </div>
                    <div class="account-detail">
                        <span>Прибыль</span>
                        <span style="color: ${profitColor}; font-weight: 600;">
                            ${a.total_profit >= 0 ? '+' : ''}${formatMoney(a.total_profit)} (${a.total_profit_percent}%)
                        </span>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="account-card">
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: ${a.color}; border-radius: var(--radius) var(--radius) 0 0;"></div>
                <div class="account-header">
                    <div class="account-icon" style="background: ${a.color}20">${a.icon}</div>
                    <div class="account-info">
                        <div class="account-name">${a.name}</div>
                        <div class="account-bank">${a.bank_name || ''}</div>
                    </div>
                </div>
                <div class="account-balance" style="color: ${a.balance >= 0 ? 'var(--gray-900)' : 'var(--danger)'}">
                    ${formatMoney(a.balance)}
                </div>
                ${extraInfo}
                <div class="account-actions">
                    <button class="btn btn-sm btn-secondary" onclick="showAccountModal(${a.id})">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAccount(${a.id})">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

// ----- КРЕДИТНЫЕ КАРТЫ -----
function renderCreditCards() {
    const container = document.getElementById('creditCardsGrid');
    
    if (state.creditCards.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💳</div>
                <div class="empty-state-text">Добавьте кредитную карту</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.creditCards.map(card => {
        const utilization = card.utilization || 0;
        const progressClass = utilization > 80 ? 'danger' : utilization > 50 ? 'warning' : '';
        
        return `
            <div class="credit-card-item">
                <div class="credit-card-header">
                    <div>
                        <div class="credit-card-name">${card.name}</div>
                        <div class="credit-card-bank">${card.bank_name || ''}</div>
                    </div>
                    <div class="credit-card-chip"></div>
                </div>
                
                <div class="credit-card-balance">
                    <div class="credit-card-label">Текущий долг</div>
                    <div class="credit-card-debt">${formatMoney(card.current_debt)}</div>
                    <div class="credit-card-limit">Лимит: ${formatMoney(card.credit_limit)}</div>
                </div>
                
                <div class="credit-card-progress">
                    <div class="credit-card-progress-fill ${progressClass}" style="width: ${Math.min(100, utilization)}%"></div>
                </div>
                
                <div class="credit-card-info">
                    <div class="credit-card-info-item">
                        <div class="credit-card-info-value">${formatMoney(card.available_limit)}</div>
                        <div class="credit-card-info-label">Доступно</div>
                    </div>
                    <div class="credit-card-info-item">
                        <div class="credit-card-info-value">${formatMoney(card.min_payment)}</div>
                        <div class="credit-card-info-label">Мин. платёж</div>
                    </div>
                    <div class="credit-card-info-item">
                        <div class="credit-card-info-value">${card.days_until_payment}</div>
                        <div class="credit-card-info-label">Дней до платежа</div>
                    </div>
                </div>
                
                <div class="credit-card-actions">
                    <button class="btn btn-sm" onclick="showPayCreditCardModal(${card.id})">💳 Погасить</button>
                    <button class="btn btn-sm" onclick="showUpdateLimitModal(${card.id})">📝 Лимит</button>
                </div>
            </div>
        `;
    }).join('');
}

// ----- КАТЕГОРИИ -----
function renderCategories() {
    const container = document.getElementById('categoriesGrid');
    const filtered = state.categories.filter(c => c.type === state.currentCategoryType);
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏷️</div>
                <div class="empty-state-text">Нет категорий</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(cat => {
        const hasbudget = cat.budget_limit > 0;
        const progressColor = cat.budget_percent > 100 ? 'var(--danger)' : cat.budget_percent > 80 ? 'var(--warning)' : cat.color;
        
        return `
            <div class="category-card" onclick="showCategoryModal(${cat.id})">
                <button class="category-delete" onclick="event.stopPropagation(); deleteCategory(${cat.id})">×</button>
                <div class="category-icon">${cat.icon}</div>
                <div class="category-name">${cat.name}</div>
                ${hasbudget ? `
                    <div class="category-budget">
                        ${formatMoney(cat.spent_this_month)} / ${formatMoney(cat.budget_limit)}
                    </div>
                    <div class="category-progress">
                        <div class="category-progress-fill" style="width: ${Math.min(100, cat.budget_percent)}%; background: ${progressColor}"></div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// ----- ТРАНЗАКЦИИ -----
function renderTransactions() {
    const container = document.getElementById('transactionsList');
    
    if (state.transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💳</div>
                <div class="empty-state-text">Нет операций</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.transactions.map(t => `
        <div class="transaction-item">
            <div class="transaction-icon" style="background: ${t.category_color || '#667eea'}20">
                ${t.category_icon || (t.type === 'transfer' ? '↔️' : '💰')}
            </div>
            <div class="transaction-info">
                <div class="transaction-category">
                    ${t.type === 'transfer' 
                        ? `${t.account_name} → ${t.to_account_name}` 
                        : (t.category_name || 'Без категории')}
                </div>
                ${t.description ? `<div class="transaction-description">${t.description}</div>` : ''}
                <div class="transaction-meta">
                    ${formatDate(t.date)} • ${t.account_name}${t.store_name ? ` • ${t.store_name}` : ''}
                </div>
            </div>
            <div class="transaction-amount ${t.type}">
                ${t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}${formatMoney(t.amount)}
            </div>
            <button class="transaction-delete" onclick="deleteTransaction(${t.id})">🗑️</button>
        </div>
    `).join('');
}

// ----- ЦЕЛИ -----
function renderGoals() {
    const container = document.getElementById('goalsGrid');
    
    // Статистика
    const totalProgress = state.goals.length > 0 
        ? Math.round(state.goals.reduce((sum, g) => sum + g.progress, 0) / state.goals.length) 
        : 0;
    
    document.getElementById('goalsProgress').textContent = `${totalProgress}%`;
    document.getElementById('goalsCount').textContent = state.goals.length;
    document.getElementById('goalsCompleted').textContent = state.dashboard?.goals?.completed_this_month || 0;
    
    if (state.goals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎯</div>
                <div class="empty-state-text">Добавьте первую цель</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.goals.map(g => `
        <div class="goal-card">
            <div class="goal-header">
                <div class="goal-icon" style="background: ${g.color}20">${g.icon}</div>
                <div class="goal-info">
                    <div class="goal-name">${g.name}</div>
                    ${g.deadline ? `
                        <div class="goal-deadline" style="color: ${g.days_left < 30 ? 'var(--warning)' : 'var(--gray-500)'}">
                            ${g.days_left > 0 ? `Осталось ${g.days_left} дн.` : g.days_left === 0 ? 'Сегодня!' : 'Срок истёк'}
                        </div>
                    ` : ''}
                </div>
                <div class="goal-priority">
                    ${[1,2,3,4,5].map(i => `<span class="goal-priority-star ${i <= g.priority ? '' : 'empty'}">★</span>`).join('')}
                </div>
            </div>
            
            <div class="goal-progress-section">
                <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${g.progress}%; background: ${g.color}"></div>
                </div>
                <div class="goal-progress-text">
                    <span>${g.progress}%</span>
                    <span>${formatMoney(g.remaining_amount)} осталось</span>
                </div>
            </div>
            
            <div class="goal-amounts">
                <span class="goal-current" style="color: ${g.color}">${formatMoney(g.current_amount)}</span>
                <span class="goal-target">из ${formatMoney(g.target_amount)}</span>
            </div>
            
            <div class="goal-stats">
                <div class="goal-stat">
                    <div class="goal-stat-value">${formatMoney(g.monthly_needed)}</div>
                    <div class="goal-stat-label">в месяц</div>
                </div>
                <div class="goal-stat">
                    <div class="goal-stat-value">${formatMoney(g.weekly_needed)}</div>
                    <div class="goal-stat-label">в неделю</div>
                </div>
            </div>
            
            <div class="goal-actions">
                <button class="btn btn-sm btn-primary" onclick="addToGoal(${g.id})">+ Добавить</button>
                <button class="btn btn-sm btn-secondary" onclick="showGoalModal(${g.id})">✏️</button>
                <button class="btn btn-sm btn-danger" onclick="deleteGoal(${g.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

// ----- КРЕДИТЫ -----
function renderCredits() {
    const container = document.getElementById('creditsGrid');
    
    // Сводка
    const totalDebt = state.credits.reduce((sum, c) => sum + c.remaining_amount, 0);
    const monthlyPayment = state.credits.reduce((sum, c) => sum + c.monthly_payment, 0);
    
    document.getElementById('totalCreditsDebt').textContent = formatMoney(totalDebt);
    document.getElementById('monthlyCreditsPayment').textContent = formatMoney(monthlyPayment);
    
    if (state.credits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-text">Нет кредитов — отлично! 🎉</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.credits.map(c => `
        <div class="credit-item">
            <div class="credit-header">
                <div>
                    <div class="credit-name">${c.name}</div>
                    <div class="credit-bank">${c.bank_name || ''}</div>
                </div>
                <div class="credit-rate">${c.interest_rate}%</div>
            </div>
            
            <div class="credit-amounts">
                <div class="credit-remaining">${formatMoney(c.remaining_amount)}</div>
                <div class="credit-original">из ${formatMoney(c.original_amount)}</div>
            </div>
            
            <div class="credit-progress">
                <div class="credit-progress-fill" style="width: ${c.progress}%"></div>
            </div>
            
            <div class="credit-details">
                <div class="credit-detail">
                    <div class="credit-detail-label">Ежемесячный платёж</div>
                    <div class="credit-detail-value">${formatMoney(c.monthly_payment)}</div>
                </div>
                <div class="credit-detail">
                    <div class="credit-detail-label">Осталось месяцев</div>
                    <div class="credit-detail-value">${c.remaining_months}</div>
                </div>
                <div class="credit-detail">
                    <div class="credit-detail-label">Следующий платёж</div>
                    <div class="credit-detail-value">${c.next_payment_date ? formatDate(c.next_payment_date) : '—'}</div>
                </div>
                <div class="credit-detail">
                    <div class="credit-detail-label">Досрочно погашено</div>
                    <div class="credit-detail-value">${formatMoney(c.extra_payments_total)}</div>
                </div>
            </div>
            
            <div class="credit-actions">
                <button class="btn btn-sm btn-primary" onclick="showPayCreditModal(${c.id})">💳 Платёж</button>
                <button class="btn btn-sm btn-success" onclick="showPayCreditModal(${c.id}, true)">🚀 Досрочно</button>
                <button class="btn btn-sm btn-danger" onclick="deleteCredit(${c.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

// ----- ИПОТЕКА -----
function renderMortgages() {
    const summaryContainer = document.getElementById('mortgagesSummary');
    const container = document.getElementById('mortgagesGrid');
    
    if (state.mortgages.length === 0) {
        summaryContainer.innerHTML = '';
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏠</div>
                <div class="empty-state-text">Нет ипотеки</div>
            </div>
        `;
        return;
    }
    
    // Сводка
    const totalRemaining = state.mortgages.reduce((sum, m) => sum + m.remaining_amount, 0);
    const totalMonthly = state.mortgages.reduce((sum, m) => sum + m.total_monthly_cost, 0);
    const totalEquity = state.mortgages.reduce((sum, m) => sum + m.equity, 0);
    const totalOverpayment = state.mortgages.reduce((sum, m) => sum + m.overpayment, 0);
    
    summaryContainer.innerHTML = `
        <div class="mortgages-summary-grid">
            <div class="mortgage-summary-item">
                <div class="mortgage-summary-value">${formatMoney(totalRemaining)}</div>
                <div class="mortgage-summary-label">Остаток долга</div>
            </div>
            <div class="mortgage-summary-item">
                <div class="mortgage-summary-value">${formatMoney(totalMonthly)}</div>
                <div class="mortgage-summary-label">Ежемесячно</div>
            </div>
            <div class="mortgage-summary-item">
                <div class="mortgage-summary-value">${formatMoney(totalEquity)}</div>
                <div class="mortgage-summary-label">Собственный капитал</div>
            </div>
            <div class="mortgage-summary-item">
                <div class="mortgage-summary-value">${formatMoney(totalOverpayment)}</div>
                <div class="mortgage-summary-label">Переплата</div>
            </div>
        </div>
    `;
    
    container.innerHTML = state.mortgages.map(m => `
        <div class="mortgage-card">
            <div class="mortgage-header">
                <div class="mortgage-name">${m.name}</div>
                <div class="mortgage-address">${m.property_address || m.bank_name || ''}</div>
            </div>
            
            <div class="mortgage-body">
                <div class="mortgage-amounts">
                    <div>
                        <div class="mortgage-remaining">${formatMoney(m.remaining_amount)}</div>
                        <div class="mortgage-original">из ${formatMoney(m.original_amount)}</div>
                    </div>
                    <div class="mortgage-equity">
                        <div class="mortgage-equity-value">${formatMoney(m.equity)}</div>
                        <div class="mortgage-equity-label">Ваш капитал</div>
                    </div>
                </div>
                
                <div class="mortgage-progress">
                    <div class="mortgage-progress-fill" style="width: ${m.progress}%"></div>
                </div>
                
                <div class="mortgage-details">
                    <div class="mortgage-detail">
                        <div class="mortgage-detail-value">${formatMoney(m.monthly_payment)}</div>
                        <div class="mortgage-detail-label">Платёж</div>
                    </div>
                    <div class="mortgage-detail">
                        <div class="mortgage-detail-value">${m.interest_rate}%</div>
                        <div class="mortgage-detail-label">Ставка</div>
                    </div>
                    <div class="mortgage-detail">
                        <div class="mortgage-detail-value">${m.remaining_months} мес.</div>
                        <div class="mortgage-detail-label">Осталось</div>
                    </div>
                </div>
                
                ${m.insurance_yearly || m.property_tax_yearly ? `
                    <div style="font-size: 13px; color: var(--gray-500); margin-top: 12px;">
                        Доп. расходы: ${formatMoney(m.monthly_extra_costs)}/мес.
                        (страховка + налог)
                    </div>
                ` : ''}
                
                <div class="mortgage-actions">
                    <button class="btn btn-sm btn-primary" onclick="showPayMortgageModal(${m.id})">💳 Платёж</button>
                    <button class="btn btn-sm btn-success" onclick="showPayMortgageModal(${m.id}, true)">🚀 Досрочно</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMortgage(${m.id})">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

// ----- ИНВЕСТИЦИИ -----
function renderInvestments() {
    const summaryCards = document.querySelector('.investments-summary-cards');
    const container = document.getElementById('investmentsAccounts');
    
    const totalInvested = state.investments.reduce((sum, i) => sum + i.invested, 0);
    const totalValue = state.investments.reduce((sum, i) => sum + i.current_value, 0);
    const totalProfit = totalValue - totalInvested;
    const profitPercent = totalInvested > 0 ? ((totalProfit / totalInvested) * 100).toFixed(2) : 0;
    
    document.getElementById('totalInvested').textContent = formatMoney(totalInvested);
    document.getElementById('totalInvestmentValue').textContent = formatMoney(totalValue);
    
    const profitEl = document.getElementById('totalInvestmentProfit');
    profitEl.textContent = `${totalProfit >= 0 ? '+' : ''}${formatMoney(totalProfit)} (${profitPercent}%)`;
    
    if (state.investments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📈</div>
                <div class="empty-state-text">Нет инвестиций</div>
            </div>
        `;
        return;
    }
    
    // Группируем по счетам
    const investmentAccounts = state.accounts.filter(a => a.is_investment);
    
    container.innerHTML = investmentAccounts.map(account => {
        const accountInvestments = state.investments.filter(i => i.account_id === account.id);
        if (accountInvestments.length === 0) return '';
        
        const accountValue = accountInvestments.reduce((sum, i) => sum + i.current_value, 0);
        const accountInvested = accountInvestments.reduce((sum, i) => sum + i.invested, 0);
        const accountProfit = accountValue - accountInvested;
        
        return `
            <div class="investment-account">
                <div class="investment-account-header">
                    <div>
                        <div class="investment-account-name">${account.icon} ${account.name}</div>
                        <div class="investment-account-profit" style="color: ${accountProfit >= 0 ? 'rgba(255,255,255,0.9)' : '#fca5a5'}">
                            ${accountProfit >= 0 ? '+' : ''}${formatMoney(accountProfit)}
                        </div>
                    </div>
                    <div class="investment-account-value">${formatMoney(accountValue)}</div>
                </div>
                
                <table class="investments-table">
                    <thead>
                        <tr>
                            <th>Актив</th>
                            <th>Кол-во</th>
                            <th>Цена</th>
                            <th>Стоимость</th>
                            <th>Прибыль</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${accountInvestments.map(inv => `
                            <tr>
                                <td>
                                    <div class="investment-ticker">${inv.ticker}</div>
                                    <div class="investment-name">${inv.name}</div>
                                </td>
                                <td>${inv.quantity}</td>
                                <td>${formatMoney(inv.current_price)}</td>
                                <td><strong>${formatMoney(inv.current_value)}</strong></td>
                                <td>
                                    <span class="investment-profit ${inv.profit >= 0 ? 'positive' : 'negative'}">
                                        ${inv.profit >= 0 ? '+' : ''}${formatMoney(inv.profit)}
                                        <br>
                                        <small>(${inv.profit_percent}%)</small>
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-secondary" onclick="showInvestmentModal(${inv.id})">✏️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }).join('');
}

// ----- МАГАЗИНЫ И ТОВАРЫ -----
function renderStores() {
    const container = document.getElementById('storesGrid');
    if (!container) return;
    
    if (state.stores.length === 0) {
        container.innerHTML = '<div class="empty-state small">Добавьте магазины для сравнения цен</div>';
        return;
    }
    
    container.innerHTML = state.stores.map(s => `
        <div class="store-card">
            <div class="store-icon">${s.icon}</div>
            <div class="store-name">${s.name}</div>
            <div class="store-rating">
                ${[1,2,3,4,5].map(i => `<span class="store-rating-star" style="opacity: ${i <= Math.round(s.price_rating) ? 1 : 0.3}">★</span>`).join('')}
            </div>
            <div style="font-size: 12px; color: var(--gray-500); margin-top: 8px;">
                ${s.products_count} товаров
            </div>
        </div>
    `).join('');
}

function renderProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) return;
    
    if (state.products.length === 0) {
        container.innerHTML = '<div class="empty-state small">Добавьте товары для отслеживания цен</div>';
        return;
    }
    
    container.innerHTML = state.products.map(p => `
        <div class="product-card">
            <div class="product-header">
                <div class="product-icon">${p.icon}</div>
                <div>
                    <div class="product-name">${p.name}</div>
                    <div class="product-unit">за ${p.unit}</div>
                </div>
                ${p.price_diff_percent > 0 ? `
                    <div style="margin-left: auto; text-align: right;">
                        <div style="font-size: 13px; color: var(--success); font-weight: 600;">
                            Экономия до ${p.price_diff_percent}%
                        </div>
                        <div style="font-size: 12px; color: var(--gray-500);">
                            ${formatMoney(p.price_diff)}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="product-prices">
                ${p.prices.map(price => `
                    <div class="product-price-item ${price.price === p.min_price ? 'best' : ''}">
                        <div class="product-price-store">${price.store_icon} ${price.store_name}</div>
                        <div class="product-price-value">${formatMoney(price.price)}</div>
                        ${price.is_sale ? '<div style="font-size: 11px; color: var(--danger);">🔥 Акция</div>' : ''}
                    </div>
                `).join('')}
                <div class="product-price-item" style="cursor: pointer; border: 2px dashed var(--gray-300);" onclick="showAddPriceModal(${p.id})">
                    <div style="font-size: 24px;">+</div>
                    <div style="font-size: 12px; color: var(--gray-500);">Добавить цену</div>
                </div>
            </div>
        </div>
    `).join('');
}

// ----- НАЛОГИ -----
function renderTaxes() {
    // Будет реализовано при загрузке вкладки налогов
}

// ----- АНАЛИТИКА -----
function renderChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state small">Нет данных</div>';
        return;
    }
    
    const total = data.reduce((sum, item) => sum + item.total, 0);
    const maxValue = Math.max(...data.map(item => item.total));
    
    container.innerHTML = data.map(item => `
        <div class="chart-bar">
            <div class="chart-label">
                <span>${item.icon}</span>
                <span>${item.name}</span>
            </div>
            <div class="chart-bar-track">
                <div class="chart-bar-fill" style="width: ${(item.total / maxValue) * 100}%; background: ${item.color}">
                    ${item.percent}%
                </div>
            </div>
            <div class="chart-value">${formatMoney(item.total)}</div>
        </div>
    `).join('');
}

function renderStoreChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state small">Нет данных о покупках в магазинах</div>';
        return;
    }
    
    const maxValue = Math.max(...data.map(item => item.total));
    
    container.innerHTML = data.map(item => `
        <div class="chart-bar">
            <div class="chart-label">
                <span>${item.icon}</span>
                <span>${item.name}</span>
            </div>
            <div class="chart-bar-track">
                <div class="chart-bar-fill" style="width: ${(item.total / maxValue) * 100}%; background: ${item.color}"></div>
            </div>
            <div class="chart-value">
                ${formatMoney(item.total)}
                <br>
                <small style="color: var(--gray-500)">${item.count} покупок</small>
            </div>
        </div>
    `).join('');
}

// ----- ДОСТИЖЕНИЯ -----
function renderAchievements() {
    const container = document.getElementById('achievementsGrid');
    
    const totalPoints = state.achievements
        .filter(a => a.unlocked)
        .reduce((sum, a) => sum + a.points, 0);
    
    document.getElementById('totalPoints').textContent = totalPoints;
    
    container.innerHTML = state.achievements.map(a => `
        <div class="achievement-card ${a.unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-icon">${a.icon}</div>
            <div class="achievement-name">${a.name}</div>
            <div class="achievement-description">${a.description}</div>
            <div class="achievement-points">
                <span>⭐</span>
                <span>${a.points} очков</span>
            </div>
            ${a.unlocked && a.unlocked_at ? `
                <div class="achievement-date">Получено ${formatDate(a.unlocked_at)}</div>
            ` : ''}
        </div>
    `).join('');
}

// ==================== МОДАЛЬНЫЕ ФОРМЫ ====================

// ----- ТРАНЗАКЦИЯ -----
function showTransactionModal() {
    const today = getCurrentDate();
    
    openModal('Новая операция', `
        <form id="transactionForm">
            <div class="type-tabs">
                <button type="button" class="type-tab expense active" data-type="expense">📉 Расход</button>
                <button type="button" class="type-tab income" data-type="income">📈 Доход</button>
                <button type="button" class="type-tab transfer" data-type="transfer">↔️ Перевод</button>
            </div>
            <input type="hidden" name="type" value="expense">
            
            <div class="form-group">
                <label class="form-label">Сумма *</label>
                <input type="number" class="form-input" name="amount" step="0.01" min="0.01" required placeholder="0.00">
            </div>
            
            <div class="form-group">
                <label class="form-label">Счёт *</label>
                <select class="form-select" name="account_id" required>
                    ${state.accounts.map(a => `<option value="${a.id}">${a.icon} ${a.name} (${formatMoney(a.balance)})</option>`).join('')}
                </select>
            </div>
            
            <div class="form-group" id="categoryGroup">
                <label class="form-label">Категория</label>
                <select class="form-select" name="category_id">
                    <option value="">Без категории</option>
                    ${state.categories.filter(c => c.type === 'expense').map(c => 
                        `<option value="${c.id}">${c.icon} ${c.name}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group" id="toAccountGroup" style="display: none;">
                <label class="form-label">На счёт *</label>
                <select class="form-select" name="to_account_id">
                    ${state.accounts.map(a => `<option value="${a.id}">${a.icon} ${a.name}</option>`).join('')}
                </select>
            </div>
            
            <div class="form-group" id="storeGroup">
                <label class="form-label">Магазин</label>
                <select class="form-select" name="store_id">
                    <option value="">Не указан</option>
                    ${state.stores.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Описание</label>
                <input type="text" class="form-input" name="description" placeholder="Комментарий к операции">
            </div>
            
            <div class="form-group">
                <label class="form-label">Дата</label>
                <input type="date" class="form-input" name="date" value="${today}">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Добавить</button>
            </div>
        </form>
    `);
    
    // Переключение типов
    document.querySelectorAll('.type-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const type = tab.dataset.type;
            document.querySelector('input[name="type"]').value = type;
            
            const categoryGroup = document.getElementById('categoryGroup');
            const toAccountGroup = document.getElementById('toAccountGroup');
            const storeGroup = document.getElementById('storeGroup');
            const categorySelect = document.querySelector('select[name="category_id"]');
            
            if (type === 'transfer') {
                categoryGroup.style.display = 'none';
                toAccountGroup.style.display = 'block';
                storeGroup.style.display = 'none';
            } else {
                categoryGroup.style.display = 'block';
                toAccountGroup.style.display = 'none';
                storeGroup.style.display = type === 'expense' ? 'block' : 'none';
                
                categorySelect.innerHTML = '<option value="">Без категории</option>' +
                    state.categories
                        .filter(c => c.type === type)
                        .map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`)
                        .join('');
            }
        });
    });
    
    // Отправка формы
    document.getElementById('transactionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        data.amount = parseFloat(data.amount);
        data.account_id = parseInt(data.account_id);
        
        if (data.category_id) data.category_id = parseInt(data.category_id);
        else delete data.category_id;
        
        if (data.to_account_id && data.type === 'transfer') {
            data.to_account_id = parseInt(data.to_account_id);
        } else {
            delete data.to_account_id;
        }
        
        if (data.store_id) data.store_id = parseInt(data.store_id);
        else delete data.store_id;
        
        try {
            await API.transactions.create(data);
            closeModal();
            showToast('Операция добавлена', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка добавления операции', 'error');
        }
    });
}

// ----- СЧЁТ -----
function showAccountModal(id = null) {
    const account = id ? state.accounts.find(a => a.id === id) : null;
    const title = account ? 'Редактировать счёт' : 'Новый счёт';
    
    openModal(title, `
        <form id="accountForm">
            <div class="form-group">
                <label class="form-label">Название *</label>
                <input type="text" class="form-input" name="name" value="${account?.name || ''}" required placeholder="Например: Сбербанк">
            </div>
            
            <div class="form-group">
                <label class="form-label">Тип счёта</label>
                <select class="form-select" name="account_type" id="accountTypeSelect">
                    ${Object.entries(ACCOUNT_TYPES).map(([key, val]) => 
                        `<option value="${key}" ${account?.account_type === key ? 'selected' : ''}>${val.icon} ${val.name}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Банк / Брокер</label>
                <input type="text" class="form-input" name="bank_name" value="${account?.bank_name || ''}" placeholder="Название банка">
            </div>
            
            <div class="form-group">
                <label class="form-label">Текущий баланс</label>
                <input type="number" class="form-input" name="balance" step="0.01" value="${account?.balance || 0}">
            </div>
            
            <div class="form-group" id="creditLimitGroup" style="display: none;">
                <label class="form-label">Кредитный лимит</label>
                <input type="number" class="form-input" name="credit_limit" step="0.01" value="${account?.credit_limit || 0}">
            </div>
            
            <div class="form-group" id="businessGroup" style="display: none;">
                <label class="form-label">
                    <input type="checkbox" name="is_business" ${account?.is_business ? 'checked' : ''}> 
                    Это бизнес-счёт (ИП)
                </label>
            </div>
            
            <div class="form-group" id="taxRateGroup" style="display: none;">
                <label class="form-label">Ставка налога (%)</label>
                <input type="number" class="form-input" name="tax_rate" step="0.1" value="${account?.tax_rate || 6}" placeholder="6">
            </div>
            
            <div class="form-group" id="taxAccountGroup" style="display: none;">
                <label class="form-label">Счёт для налогов</label>
                <select class="form-select" name="linked_tax_account_id">
                    <option value="">Не выбран</option>
                    ${state.accounts.filter(a => a.id !== id).map(a => 
                        `<option value="${a.id}" ${account?.linked_tax_account_id === a.id ? 'selected' : ''}>${a.icon} ${a.name}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Иконка</label>
                <div class="icon-picker" id="iconPicker">
                    ${ICONS.slice(0, 40).map(icon => 
                        `<div class="icon-option ${account?.icon === icon ? 'selected' : ''}" data-icon="${icon}">${icon}</div>`
                    ).join('')}
                </div>
                <input type="hidden" name="icon" value="${account?.icon || '💳'}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Цвет</label>
                <div class="color-picker" id="colorPicker">
                    ${COLORS.map(color => 
                        `<div class="color-option ${account?.color === color ? 'selected' : ''}" data-color="${color}" style="background: ${color}"></div>`
                    ).join('')}
                </div>
                <input type="hidden" name="color" value="${account?.color || '#667eea'}">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">${account ? 'Сохранить' : 'Создать'}</button>
            </div>
        </form>
    `);
    
    // Логика показа/скрытия полей
    const accountTypeSelect = document.getElementById('accountTypeSelect');
    const updateFields = () => {
        const type = accountTypeSelect.value;
        document.getElementById('creditLimitGroup').style.display = type === 'credit_card' ? 'block' : 'none';
        document.getElementById('businessGroup').style.display = ['debit', 'business'].includes(type) ? 'block' : 'none';
        
        const isBusinessChecked = document.querySelector('input[name="is_business"]').checked;
        document.getElementById('taxRateGroup').style.display = isBusinessChecked ? 'block' : 'none';
        document.getElementById('taxAccountGroup').style.display = isBusinessChecked ? 'block' : 'none';
    };
    
    accountTypeSelect.addEventListener('change', updateFields);
    document.querySelector('input[name="is_business"]')?.addEventListener('change', updateFields);
    updateFields();
    
    initPickers();
    
    document.getElementById('accountForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        data.balance = parseFloat(data.balance) || 0;
        data.credit_limit = parseFloat(data.credit_limit) || 0;
        data.tax_rate = parseFloat(data.tax_rate) || 0;
        data.is_business = formData.has('is_business');
        
        if (data.linked_tax_account_id) {
            data.linked_tax_account_id = parseInt(data.linked_tax_account_id);
        } else {
            delete data.linked_tax_account_id;
        }
        
        try {
            if (account) {
                await API.accounts.update(account.id, data);
                showToast('Счёт обновлён', 'success');
            } else {
                await API.accounts.create(data);
                showToast('Счёт создан', 'success');
            }
            closeModal();
            loadAllData();
        } catch (error) {
            showToast('Ошибка сохранения', 'error');
        }
    });
}

// ----- КРЕДИТНАЯ КАРТА -----
function showCreditCardModal() {
    openModal('Новая кредитная карта', `
        <form id="creditCardForm">
            <div class="form-group">
                <label class="form-label">Название карты *</label>
                <input type="text" class="form-input" name="name" required placeholder="Например: Тинькофф Платинум">
            </div>
            
            <div class="form-group">
                <label class="form-label">Банк</label>
                <input type="text" class="form-input" name="bank_name" placeholder="Название банка">
            </div>
            
            <div class="form-group">
                <label class="form-label">Кредитный лимит *</label>
                <input type="number" class="form-input" name="credit_limit" step="0.01" required placeholder="235000">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Мин. платёж (%)</label>
                    <input type="number" class="form-input" name="min_payment_percent" step="0.1" value="5">
                </div>
                <div class="form-group">
                    <label class="form-label">Льготный период (дн.)</label>
                    <input type="number" class="form-input" name="grace_period_days" value="55">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">День выписки</label>
                    <input type="number" class="form-input" name="statement_day" min="1" max="31" value="1">
                </div>
                <div class="form-group">
                    <label class="form-label">День платежа</label>
                    <input type="number" class="form-input" name="payment_due_day" min="1" max="31" value="20">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Ставка после льготного (%)</label>
                    <input type="number" class="form-input" name="interest_rate" step="0.1" value="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Кэшбэк (%)</label>
                    <input type="number" class="form-input" name="cashback_percent" step="0.1" value="0">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Иконка</label>
                <div class="icon-picker">
                    ${['💳', '🏦', '💰', '💵', '🔥', '⭐', '💎', '🎯'].map(icon => 
                        `<div class="icon-option" data-icon="${icon}">${icon}</div>`
                    ).join('')}
                </div>
                <input type="hidden" name="icon" value="💳">
            </div>
            
            <div class="form-group">
                <label class="form-label">Цвет</label>
                <div class="color-picker">
                    ${COLORS.slice(0, 10).map(color => 
                        `<div class="color-option" data-color="${color}" style="background: ${color}"></div>`
                    ).join('')}
                </div>
                <input type="hidden" name="color" value="#667eea">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Создать</button>
            </div>
        </form>
    `);
    
    initPickers();
    
    document.getElementById('creditCardForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        data.account_type = 'credit_card';
        data.credit_limit = parseFloat(data.credit_limit);
        data.min_payment_percent = parseFloat(data.min_payment_percent) || 5;
        data.grace_period_days = parseInt(data.grace_period_days) || 55;
        data.statement_day = parseInt(data.statement_day) || 1;
        data.payment_due_day = parseInt(data.payment_due_day) || 20;
        data.interest_rate = parseFloat(data.interest_rate) || 0;
        data.cashback_percent = parseFloat(data.cashback_percent) || 0;
        data.balance = 0;
        
        try {
            await API.accounts.create(data);
            closeModal();
            showToast('Кредитная карта добавлена', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка создания карты', 'error');
        }
    });
}

function showPayCreditCardModal(cardId) {
    const card = state.creditCards.find(c => c.id === cardId);
    if (!card) return;
    
    openModal('Погашение кредитной карты', `
        <form id="payCreditCardForm">
            <div style="background: var(--gray-100); padding: 20px; border-radius: var(--radius); margin-bottom: 20px;">
                <div style="font-size: 14px; color: var(--gray-500); margin-bottom: 8px;">Текущий долг</div>
                <div style="font-size: 28px; font-weight: 800; color: var(--danger);">${formatMoney(card.current_debt)}</div>
                <div style="font-size: 13px; color: var(--gray-500); margin-top: 8px;">
                    Минимальный платёж: ${formatMoney(card.min_payment)}
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Сумма погашения *</label>
                <input type="number" class="form-input" name="amount" step="0.01" required 
                       value="${card.current_debt}" max="${card.current_debt}">
                <div class="form-hint">
                    <button type="button" class="btn btn-sm btn-secondary" onclick="document.querySelector('input[name=amount]').value=${card.min_payment}">
                        Мин. платёж
                    </button>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="document.querySelector('input[name=amount]').value=${card.current_debt}">
                        Весь долг
                    </button>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Списать со счёта *</label>
                <select class="form-select" name="from_account_id" required>
                    ${state.accounts.filter(a => a.account_type !== 'credit_card' && a.balance > 0).map(a => 
                        `<option value="${a.id}">${a.icon} ${a.name} (${formatMoney(a.balance)})</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Погасить</button>
            </div>
        </form>
    `);
    
    document.getElementById('payCreditCardForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            amount: parseFloat(formData.get('amount')),
            from_account_id: parseInt(formData.get('from_account_id'))
        };
        
        try {
            await API.creditCards.pay(cardId, data);
            closeModal();
            showToast('Платёж внесён', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка платежа', 'error');
        }
    });
}

function showUpdateLimitModal(cardId) {
    const card = state.creditCards.find(c => c.id === cardId);
    if (!card) return;
    
    openModal('Изменить лимит', `
        <form id="updateLimitForm">
            <div class="form-group">
                <label class="form-label">Текущий лимит</label>
                <div style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">${formatMoney(card.credit_limit)}</div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Новый лимит *</label>
                <input type="number" class="form-input" name="credit_limit" step="0.01" required value="${card.credit_limit}">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Сохранить</button>
            </div>
        </form>
    `);
    
    document.getElementById('updateLimitForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            credit_limit: parseFloat(formData.get('credit_limit'))
        };
        
        try {
            await API.creditCards.updateLimit(cardId, data);
            closeModal();
            showToast('Лимит обновлён', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка обновления', 'error');
        }
    });
}

// ----- КАТЕГОРИЯ -----
function showCategoryModal(id = null) {
    const category = id ? state.categories.find(c => c.id === id) : null;
    const title = category ? 'Редактировать категорию' : 'Новая категория';
    
    openModal(title, `
        <form id="categoryForm">
            <div class="form-group">
                <label class="form-label">Название *</label>
                <input type="text" class="form-input" name="name" value="${category?.name || ''}" required>
            </div>
            
            ${!category ? `
                <div class="form-group">
                    <label class="form-label">Тип</label>
                    <select class="form-select" name="type">
                        <option value="expense">📉 Расход</option>
                        <option value="income">📈 Доход</option>
                    </select>
                </div>
            ` : ''}
            
            <div class="form-group">
                <label class="form-label">Лимит бюджета (в месяц)</label>
                <input type="number" class="form-input" name="budget_limit" step="0.01" value="${category?.budget_limit || 0}">
                <div class="form-hint">Оставьте 0, если лимит не нужен</div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Иконка</label>
                <div class="icon-picker">
                    ${ICONS.map(icon => 
                        `<div class="icon-option ${category?.icon === icon ? 'selected' : ''}" data-icon="${icon}">${icon}</div>`
                    ).join('')}
                </div>
                <input type="hidden" name="icon" value="${category?.icon || '📦'}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Цвет</label>
                <div class="color-picker">
                    ${COLORS.map(color => 
                        `<div class="color-option ${category?.color === color ? 'selected' : ''}" data-color="${color}" style="background: ${color}"></div>`
                    ).join('')}
                </div>
                <input type="hidden" name="color" value="${category?.color || '#667eea'}">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">${category ? 'Сохранить' : 'Создать'}</button>
            </div>
        </form>
    `);
    
    initPickers();
    
    document.getElementById('categoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.budget_limit = parseFloat(data.budget_limit) || 0;
        
        if (category) {
            data.type = category.type;
        }
        
        try {
            if (category) {
                await API.categories.update(category.id, data);
                showToast('Категория обновлена', 'success');
            } else {
                await API.categories.create(data);
                showToast('Категория создана', 'success');
            }
            closeModal();
            loadAllData();
        } catch (error) {
            showToast('Ошибка сохранения', 'error');
        }
    });
}

// ----- ЦЕЛЬ -----
function showGoalModal(id = null) {
    const goal = id ? state.goals.find(g => g.id === id) : null;
    const title = goal ? 'Редактировать цель' : 'Новая цель';
    
    openModal(title, `
        <form id="goalForm">
            <div class="form-group">
                <label class="form-label">Название *</label>
                <input type="text" class="form-input" name="name" value="${goal?.name || ''}" required placeholder="Например: Отпуск в Турции">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Целевая сумма *</label>
                    <input type="number" class="form-input" name="target_amount" step="0.01" value="${goal?.target_amount || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Уже накоплено</label>
                    <input type="number" class="form-input" name="current_amount" step="0.01" value="${goal?.current_amount || 0}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Дедлайн</label>
                    <input type="date" class="form-input" name="deadline" value="${goal?.deadline || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Приоритет</label>
                    <select class="form-select" name="priority">
                        ${[1,2,3,4,5].map(p => `<option value="${p}" ${goal?.priority === p ? 'selected' : ''}>${'★'.repeat(p)}</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Иконка</label>
                <div class="icon-picker">
                    ${['🎯', '🏠', '🚗', '✈️', '💻', '📱', '👶', '💍', '🎓', '💪', '🏖️', '🎁', '💎', '🚀', '⭐', '🔥'].map(icon => 
                        `<div class="icon-option ${goal?.icon === icon ? 'selected' : ''}" data-icon="${icon}">${icon}</div>`
                    ).join('')}
                </div>
                <input type="hidden" name="icon" value="${goal?.icon || '🎯'}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Цвет</label>
                <div class="color-picker">
                    ${COLORS.map(color => 
                        `<div class="color-option ${goal?.color === color ? 'selected' : ''}" data-color="${color}" style="background: ${color}"></div>`
                    ).join('')}
                </div>
                <input type="hidden" name="color" value="${goal?.color || '#667eea'}">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">${goal ? 'Сохранить' : 'Создать'}</button>
            </div>
        </form>
    `);
    
    initPickers();
    
    document.getElementById('goalForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        data.target_amount = parseFloat(data.target_amount);
        data.current_amount = parseFloat(data.current_amount) || 0;
        data.priority = parseInt(data.priority);
        
        try {
            if (goal) {
                await API.goals.update(goal.id, data);
                showToast('Цель обновлена', 'success');
            } else {
                await API.goals.create(data);
                showToast('Цель создана', 'success');
            }
            closeModal();
            loadAllData();
        } catch (error) {
            showToast('Ошибка сохранения', 'error');
        }
    });
}

async function addToGoal(goalId) {
    const goal = state.goals.find(g => g.id === goalId);
    if (!goal) return;
    
    const amount = prompt(`Добавить к цели "${goal.name}":\nОсталось: ${formatMoney(goal.remaining_amount)}`);
    
    if (amount && !isNaN(parseFloat(amount))) {
        try {
            await API.goals.addAmount(goalId, parseFloat(amount));
            showToast('Сумма добавлена к цели', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка', 'error');
        }
    }
}

// ----- КРЕДИТ -----
function showCreditModal() {
    const today = getCurrentDate();
    
    openModal('Новый кредит', `
        <form id="creditForm">
            <div class="form-group">
                <label class="form-label">Название *</label>
                <input type="text" class="form-input" name="name" required placeholder="Например: Кредит на ремонт">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Тип кредита</label>
                    <select class="form-select" name="credit_type">
                        ${Object.entries(CREDIT_TYPES).map(([key, val]) => 
                            `<option value="${key}">${val.icon} ${val.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Банк</label>
                    <input type="text" class="form-input" name="bank_name" placeholder="Название банка">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Сумма кредита *</label>
                    <input type="number" class="form-input" name="original_amount" step="0.01" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Остаток долга</label>
                    <input type="number" class="form-input" name="remaining_amount" step="0.01" placeholder="= сумме кредита">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Ставка (%) *</label>
                    <input type="number" class="form-input" name="interest_rate" step="0.1" required value="15">
                </div>
                <div class="form-group">
                    <label class="form-label">Срок (мес.) *</label>
                    <input type="number" class="form-input" name="term_months" required value="36">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Ежемесячный платёж *</label>
                    <input type="number" class="form-input" name="monthly_payment" step="0.01" required>
                </div>
                <div class="form-group">
                    <label class="form-label">День платежа</label>
                    <input type="number" class="form-input" name="payment_day" min="1" max="31" value="1">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Дата начала</label>
                <input type="date" class="form-input" name="start_date" value="${today}">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Добавить</button>
            </div>
        </form>
    `);
    
    document.getElementById('creditForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        data.original_amount = parseFloat(data.original_amount);
        data.remaining_amount = parseFloat(data.remaining_amount) || data.original_amount;
        data.interest_rate = parseFloat(data.interest_rate);
        data.term_months = parseInt(data.term_months);
        data.remaining_months = data.term_months;
        data.monthly_payment = parseFloat(data.monthly_payment);
        data.payment_day = parseInt(data.payment_day) || 1;
        
        try {
            await API.credits.create(data);
            closeModal();
            showToast('Кредит добавлен', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка добавления', 'error');
        }
    });
}

function showPayCreditModal(creditId, isExtra = false) {
    const credit = state.credits.find(c => c.id === creditId);
    if (!credit) return;
    
    const title = isExtra ? 'Досрочное погашение' : 'Внести платёж';
    
    openModal(title, `
        <form id="payCreditForm">
            <div style="background: var(--gray-100); padding: 20px; border-radius: var(--radius); margin-bottom: 20px;">
                <div style="font-size: 14px; color: var(--gray-500);">Остаток долга</div>
                <div style="font-size: 28px; font-weight: 800; color: var(--danger);">${formatMoney(credit.remaining_amount)}</div>
                <div style="font-size: 13px; color: var(--gray-500); margin-top: 8px;">
                    Ежемесячный платёж: ${formatMoney(credit.monthly_payment)}
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Сумма платежа *</label>
                <input type="number" class="form-input" name="amount" step="0.01" required 
                       value="${isExtra ? '' : credit.monthly_payment}">
            </div>
            
            ${isExtra ? `
                <div class="form-group">
                    <label class="form-label">Что уменьшить?</label>
                    <div class="type-tabs">
                        <button type="button" class="type-tab active" data-reduce="term">📅 Срок</button>
                        <button type="button" class="type-tab" data-reduce="payment">💰 Платёж</button>
                    </div>
                    <input type="hidden" name="reduce_type" value="term">
                    <div class="form-hint" style="margin-top: 12px;">
                        <strong>Срок:</strong> быстрее погасите, больше сэкономите<br>
                        <strong>Платёж:</strong> меньше ежемесячная нагрузка
                    </div>
                </div>
            ` : ''}
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Внести платёж</button>
            </div>
        </form>
    `);
    
    if (isExtra) {
        document.querySelectorAll('.type-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelector('input[name="reduce_type"]').value = tab.dataset.reduce;
            });
        });
    }
    
    document.getElementById('payCreditForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            amount: parseFloat(formData.get('amount')),
            is_extra: isExtra,
            reduce_type: formData.get('reduce_type') || 'term'
        };
        
        try {
            await API.credits.pay(creditId, data);
            closeModal();
            showToast('Платёж внесён', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка платежа', 'error');
        }
    });
}

// ----- ИПОТЕКА -----
function showMortgageModal() {
    const today = getCurrentDate();
    
    openModal('Новая ипотека', `
        <form id="mortgageForm">
            <div class="form-group">
                <label class="form-label">Название *</label>
                <input type="text" class="form-input" name="name" required placeholder="Например: Квартира на Ленина">
            </div>
            
            <div class="form-group">
                <label class="form-label">Адрес недвижимости</label>
                <input type="text" class="form-input" name="property_address" placeholder="Город, улица, дом">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Стоимость недвижимости *</label>
                    <input type="number" class="form-input" name="property_value" step="0.01" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Первоначальный взнос</label>
                    <input type="number" class="form-input" name="down_payment" step="0.01" value="0">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Сумма кредита *</label>
                    <input type="number" class="form-input" name="original_amount" step="0.01" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Остаток долга</label>
                    <input type="number" class="form-input" name="remaining_amount" step="0.01">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Ставка (%) *</label>
                    <input type="number" class="form-input" name="interest_rate" step="0.1" required value="8">
                </div>
                <div class="form-group">
                    <label class="form-label">Срок (мес.) *</label>
                    <input type="number" class="form-input" name="term_months" required value="240">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Ежемесячный платёж</label>
                    <input type="number" class="form-input" name="monthly_payment" step="0.01" placeholder="Рассчитается автоматически">
                </div>
                <div class="form-group">
                    <label class="form-label">День платежа</label>
                    <input type="number" class="form-input" name="payment_day" min="1" max="31" value="1">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Страховка (в год)</label>
                    <input type="number" class="form-input" name="insurance_yearly" step="0.01" value="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Налог на имущество (в год)</label>
                    <input type="number" class="form-input" name="property_tax_yearly" step="0.01" value="0">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Банк</label>
                    <input type="text" class="form-input" name="bank_name" placeholder="Название банка">
                </div>
                <div class="form-group">
                    <label class="form-label">Дата начала</label>
                    <input type="date" class="form-input" name="start_date" value="${today}">
                </div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Добавить</button>
            </div>
        </form>
    `);
    
    document.getElementById('mortgageForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        data.property_value = parseFloat(data.property_value);
        data.down_payment = parseFloat(data.down_payment) || 0;
        data.original_amount = parseFloat(data.original_amount);
        data.remaining_amount = parseFloat(data.remaining_amount) || data.original_amount;
        data.interest_rate = parseFloat(data.interest_rate);
        data.term_months = parseInt(data.term_months);
        data.monthly_payment = parseFloat(data.monthly_payment) || 0;
        data.payment_day = parseInt(data.payment_day) || 1;
        data.insurance_yearly = parseFloat(data.insurance_yearly) || 0;
        data.property_tax_yearly = parseFloat(data.property_tax_yearly) || 0;
        
        try {
            await API.mortgages.create(data);
            closeModal();
            showToast('Ипотека добавлена', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка добавления', 'error');
        }
    });
}

function showPayMortgageModal(mortgageId, isExtra = false) {
    const mortgage = state.mortgages.find(m => m.id === mortgageId);
    if (!mortgage) return;
    
    const title = isExtra ? 'Досрочное погашение ипотеки' : 'Внести платёж по ипотеке';
    
    openModal(title, `
        <form id="payMortgageForm">
            <div style="background: var(--gradient-primary); padding: 20px; border-radius: var(--radius); margin-bottom: 20px; color: white;">
                <div style="font-size: 14px; opacity: 0.8;">Остаток долга</div>
                <div style="font-size: 28px; font-weight: 800;">${formatMoney(mortgage.remaining_amount)}</div>
                <div style="font-size: 13px; opacity: 0.8; margin-top: 8px;">
                    Ежемесячный платёж: ${formatMoney(mortgage.monthly_payment)}
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Сумма платежа *</label>
                <input type="number" class="form-input" name="amount" step="0.01" required 
                       value="${isExtra ? '' : mortgage.monthly_payment}">
            </div>
            
            ${isExtra ? `
                <div class="form-group">
                    <label class="form-label">Что уменьшить?</label>
                    <div class="type-tabs">
                        <button type="button" class="type-tab active" data-reduce="term">📅 Срок (рекомендуется)</button>
                        <button type="button" class="type-tab" data-reduce="payment">💰 Платёж</button>
                    </div>
                    <input type="hidden" name="reduce_type" value="term">
                </div>
            ` : ''}
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Внести платёж</button>
            </div>
        </form>
    `);
    
    if (isExtra) {
        document.querySelectorAll('.type-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelector('input[name="reduce_type"]').value = tab.dataset.reduce;
            });
        });
    }
    
    document.getElementById('payMortgageForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            amount: parseFloat(formData.get('amount')),
            is_extra: isExtra,
            reduce_type: formData.get('reduce_type') || 'term'
        };
        
        try {
            await API.mortgages.pay(mortgageId, data);
            closeModal();
            showToast('Платёж внесён', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка платежа', 'error');
        }
    });
}

// ----- ИНВЕСТИЦИЯ -----
function showInvestmentModal(id = null) {
    const investment = id ? state.investments.find(i => i.id === id) : null;
    const title = investment ? 'Редактировать инвестицию' : 'Новая инвестиция';
    
    const investmentAccounts = state.accounts.filter(a => a.is_investment);
    
    if (investmentAccounts.length === 0) {
        showToast('Сначала создайте инвестиционный счёт', 'warning');
        return;
    }
    
    openModal(title, `
        <form id="investmentForm">
            <div class="form-group">
                <label class="form-label">Брокерский счёт *</label>
                <select class="form-select" name="account_id" required ${investment ? 'disabled' : ''}>
                    ${investmentAccounts.map(a => 
                        `<option value="${a.id}" ${investment?.account_id === a.id ? 'selected' : ''}>${a.icon} ${a.name}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Тикер *</label>
                    <input type="text" class="form-input" name="ticker" value="${investment?.ticker || ''}" 
                           required placeholder="SBER" style="text-transform: uppercase;" ${investment ? 'disabled' : ''}>
                </div>
                <div class="form-group">
                    <label class="form-label">Тип актива</label>
                    <select class="form-select" name="asset_type">
                        ${Object.entries(ASSET_TYPES).map(([key, val]) => 
                            `<option value="${key}" ${investment?.asset_type === key ? 'selected' : ''}>${val.icon} ${val.name}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Название *</label>
                <input type="text" class="form-input" name="name" value="${investment?.name || ''}" required placeholder="Сбербанк">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Количество *</label>
                    <input type="number" class="form-input" name="quantity" step="0.0001" value="${investment?.quantity || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">${investment ? 'Средняя цена покупки' : 'Цена покупки'} *</label>
                    <input type="number" class="form-input" name="avg_buy_price" step="0.01" value="${investment?.avg_buy_price || ''}" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Текущая цена</label>
                    <input type="number" class="form-input" name="current_price" step="0.01" value="${investment?.current_price || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Валюта</label>
                    <select class="form-select" name="currency">
                        <option value="RUB" ${investment?.currency === 'RUB' ? 'selected' : ''}>🇷🇺 RUB</option>
                        <option value="USD" ${investment?.currency === 'USD' ? 'selected' : ''}>🇺🇸 USD</option>
                        <option value="EUR" ${investment?.currency === 'EUR' ? 'selected' : ''}>🇪🇺 EUR</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Сектор</label>
                <input type="text" class="form-input" name="sector" value="${investment?.sector || ''}" placeholder="Финансы, IT, Энергетика...">
            </div>
            
            ${investment ? `
                <div class="form-group">
                    <label class="form-label">Получено дивидендов</label>
                    <input type="number" class="form-input" name="dividends_received" step="0.01" value="${investment?.dividends_received || 0}">
                </div>
            ` : ''}
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">${investment ? 'Сохранить' : 'Добавить'}</button>
            </div>
        </form>
    `);
    
    document.getElementById('investmentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        data.account_id = parseInt(data.account_id);
        data.ticker = data.ticker.toUpperCase();
        data.quantity = parseFloat(data.quantity);
        data.avg_buy_price = parseFloat(data.avg_buy_price);
        data.current_price = parseFloat(data.current_price) || data.avg_buy_price;
        data.dividends_received = parseFloat(data.dividends_received) || 0;
        
        try {
            if (investment) {
                await API.investments.update(investment.id, data);
                showToast('Инвестиция обновлена', 'success');
            } else {
                await API.investments.create(data);
                showToast('Инвестиция добавлена', 'success');
            }
            closeModal();
            loadAllData();
        } catch (error) {
            showToast('Ошибка сохранения', 'error');
        }
    });
}

// ----- МАГАЗИН -----
function showStoreModal() {
    openModal('Новый магазин', `
        <form id="storeForm">
            <div class="form-group">
                <label class="form-label">Название *</label>
                <input type="text" class="form-input" name="name" required placeholder="Например: Пятёрочка">
            </div>
            
            <div class="form-group">
                <label class="form-label">Тип магазина</label>
                <select class="form-select" name="store_type">
                    ${Object.entries(STORE_TYPES).map(([key, val]) => 
                        `<option value="${key}">${val.icon} ${val.name}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Адрес</label>
                <input type="text" class="form-input" name="address" placeholder="Улица, дом">
            </div>
            
            <div class="form-group">
                <label class="form-label">Иконка</label>
                <div class="icon-picker">
                    ${['🏪', '🛒', '🏬', '🏢', '🏥', '⛽', '🍞', '🥬', '🥩', '🧀'].map(icon => 
                        `<div class="icon-option" data-icon="${icon}">${icon}</div>`
                    ).join('')}
                </div>
                <input type="hidden" name="icon" value="🏪">
            </div>
            
            <div class="form-group">
                <label class="form-label">Цвет</label>
                <div class="color-picker">
                    ${COLORS.slice(0, 10).map(color => 
                        `<div class="color-option" data-color="${color}" style="background: ${color}"></div>`
                    ).join('')}
                </div>
                <input type="hidden" name="color" value="#667eea">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Добавить</button>
            </div>
        </form>
    `);
    
    initPickers();
    
    document.getElementById('storeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        try {
            await API.stores.create(data);
            closeModal();
            showToast('Магазин добавлен', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка добавления', 'error');
        }
    });
}

// ----- ТОВАР -----
function showProductModal() {
    openModal('Новый товар', `
        <form id="productForm">
            <div class="form-group">
                <label class="form-label">Название *</label>
                <input type="text" class="form-input" name="name" required placeholder="Например: Молоко 3.2%">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Категория</label>
                    <select class="form-select" name="category">
                        <option value="dairy">🥛 Молочные</option>
                        <option value="meat">🥩 Мясо</option>
                        <option value="bread">🍞 Хлеб</option>
                        <option value="vegetables">🥬 Овощи</option>
                        <option value="fruits">🍎 Фрукты</option>
                        <option value="drinks">🥤 Напитки</option>
                        <option value="other">📦 Другое</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Единица измерения</label>
                    <select class="form-select" name="unit">
                        ${UNITS.map(u => `<option value="${u}">${u}</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Иконка</label>
                <div class="icon-picker">
                    ${['🥛', '🧀', '🥩', '🍗', '🥚', '🍞', '🥬', '🥕', '🍎', '🍌', '🥤', '☕', '🍺', '📦'].map(icon => 
                        `<div class="icon-option" data-icon="${icon}">${icon}</div>`
                    ).join('')}
                </div>
                <input type="hidden" name="icon" value="📦">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Добавить</button>
            </div>
        </form>
    `);
    
    initPickers();
    
    document.getElementById('productForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        try {
            await API.products.create(data);
            closeModal();
            showToast('Товар добавлен', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка добавления', 'error');
        }
    });
}

function showAddPriceModal(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    const today = getCurrentDate();
    
    openModal(`Добавить цену: ${product.name}`, `
        <form id="addPriceForm">
            <div class="form-group">
                <label class="form-label">Магазин *</label>
                <select class="form-select" name="store_id" required>
                    ${state.stores.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('')}
                </select>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Цена за ${product.unit} *</label>
                    <input type="number" class="form-input" name="price" step="0.01" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Дата</label>
                    <input type="date" class="form-input" name="date" value="${today}">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" name="is_sale"> 🔥 Акционная цена
                </label>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Добавить</button>
            </div>
        </form>
    `);
    
    document.getElementById('addPriceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            store_id: parseInt(formData.get('store_id')),
            price: parseFloat(formData.get('price')),
            date: formData.get('date'),
            is_sale: formData.has('is_sale')
        };
        
        try {
            await API.products.addPrice(productId, data);
            closeModal();
            showToast('Цена добавлена', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка добавления', 'error');
        }
    });
}

// ----- НАЛОГ -----
function showTaxModal() {
    const today = new Date();
    const year = today.getFullYear();
    const quarter = Math.floor(today.getMonth() / 3);
    
    openModal('Новый налоговый платёж', `
        <form id="taxForm">
            <div class="form-group">
                <label class="form-label">Тип налога *</label>
                <select class="form-select" name="tax_type" required>
                    ${Object.entries(TAX_TYPES).map(([key, val]) => 
                        `<option value="${key}">${val.icon} ${val.name}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Сумма *</label>
                <input type="number" class="form-input" name="amount" step="0.01" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Период с *</label>
                    <input type="date" class="form-input" name="period_start" required value="${year}-${String((quarter * 3) + 1).padStart(2, '0')}-01">
                </div>
                <div class="form-group">
                    <label class="form-label">Период по *</label>
                    <input type="date" class="form-input" name="period_end" required>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Срок уплаты *</label>
                <input type="date" class="form-input" name="due_date" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Описание</label>
                <input type="text" class="form-input" name="description" placeholder="Комментарий">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Добавить</button>
            </div>
        </form>
    `);
    
    document.getElementById('taxForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.amount = parseFloat(data.amount);
        
        try {
            await API.taxes.create(data);
            closeModal();
            showToast('Налог добавлен', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка добавления', 'error');
        }
    });
}

// ==================== УДАЛЕНИЕ ====================
async function deleteAccount(id) {
    if (!confirm('Удалить счёт? Все операции по этому счёту также будут удалены.')) return;
    
    try {
        await API.accounts.delete(id);
        showToast('Счёт удалён', 'success');
        loadAllData();
    } catch (error) {
        showToast('Ошибка удаления', 'error');
    }
}

async function deleteCategory(id) {
    if (!confirm('Удалить категорию?')) return;
    
    try {
        await API.categories.delete(id);
        showToast('Категория удалена', 'success');
        loadAllData();
    } catch (error) {
        showToast('Ошибка удаления', 'error');
    }
}

async function deleteTransaction(id) {
    if (!confirm('Удалить операцию?')) return;
    
    try {
        await API.transactions.delete(id);
        showToast('Операция удалена', 'success');
        loadAllData();
    } catch (error) {
        showToast('Ошибка удаления', 'error');
    }
}

async function deleteGoal(id) {
    if (!confirm('Удалить цель?')) return;
    
    try {
        await API.goals.delete(id);
        showToast('Цель удалена', 'success');
        loadAllData();
    } catch (error) {
        showToast('Ошибка удаления', 'error');
    }
}

async function deleteCredit(id) {
    if (!confirm('Удалить кредит?')) return;
    
    try {
        await API.credits.delete(id);
        showToast('Кредит удалён', 'success');
        loadAllData();
    } catch (error) {
        showToast('Ошибка удаления', 'error');
    }
}

async function deleteMortgage(id) {
    if (!confirm('Удалить ипотеку?')) return;
    
    try {
        await API.mortgages.delete(id);
        showToast('Ипотека удалена', 'success');
        loadAllData();
    } catch (error) {
        showToast('Ошибка удаления', 'error');
    }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function initPickers() {
    // Icon picker
    document.querySelectorAll('.icon-option').forEach(option => {
        option.addEventListener('click', () => {
            const picker = option.closest('.icon-picker') || option.closest('.form-group');
            picker.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            
            const input = picker.parentElement.querySelector('input[name="icon"]') || 
                         document.querySelector('input[name="icon"]');
            if (input) input.value = option.dataset.icon;
        });
    });
    
    // Color picker
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            const picker = option.closest('.color-picker') || option.closest('.form-group');
            picker.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            
            const input = picker.parentElement.querySelector('input[name="color"]') || 
                         document.querySelector('input[name="color"]');
            if (input) input.value = option.dataset.color;
        });
    });
    
    // Выбираем первые если ничего не выбрано
    const iconPicker = document.querySelector('.icon-picker');
    if (iconPicker && !iconPicker.querySelector('.selected')) {
        iconPicker.querySelector('.icon-option')?.click();
    }
    
    const colorPicker = document.querySelector('.color-picker');
    if (colorPicker && !colorPicker.querySelector('.selected')) {
        colorPicker.querySelector('.color-option')?.click();
    }
}

// ==================== ЭКСПОРТ ДЛЯ HTML ====================
// Все функции доступны глобально для onclick обработчиков