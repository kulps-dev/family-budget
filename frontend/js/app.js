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
    bonusCards: [],
    taxes: null,
    dashboard: null,
    aiTips: [],
    charts: {}
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initModals();
    initFilters();
    initCalculator();
    loadAllData();
    
    // Загружаем Chart.js если доступен
    if (typeof Chart !== 'undefined') {
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.plugins.legend.display = false;
    }
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
    document.getElementById('menuBtn')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('open');
    });
    
    document.getElementById('sidebarClose')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
    });
    
    // Закрытие сайдбара при клике вне его
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const menuBtn = document.getElementById('menuBtn');
        if (sidebar?.classList.contains('open') && 
            !sidebar.contains(e.target) && 
            !menuBtn?.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
    
    // Кнопки добавления
    document.getElementById('addBtn')?.addEventListener('click', showTransactionModal);
    document.getElementById('fab')?.addEventListener('click', showTransactionModal);
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
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
        'addTaxBtn': () => showTaxModal(),
        'addBonusCardBtn': () => showBonusCardModal(),
        'analyzeAIBtn': () => runAIAnalysis()
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
        'bonus-cards': 'Бонусные карты',
        'achievements': 'Достижения'
    };
    document.getElementById('pageTitle').textContent = titles[tab] || tab;
    
    // Закрываем сайдбар на мобильных
    document.getElementById('sidebar')?.classList.remove('open');
    
    // Загружаем данные для вкладки
    if (tab === 'analytics') loadAnalytics();
    if (tab === 'achievements') loadAchievements();
    if (tab === 'transactions') loadTransactions();
    if (tab === 'taxes') loadTaxes();
    if (tab === 'bonus-cards') loadBonusCards();
}

// ==================== МОДАЛЬНЫЕ ОКНА ====================
function initModals() {
    const overlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('modalClose');
    
    closeBtn?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
    
    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function openModal(title, content, size = 'normal') {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    
    const modal = document.getElementById('modal');
    modal.className = `modal ${size === 'large' ? 'modal-large' : ''} ${size === 'fullscreen' ? 'modal-fullscreen' : ''}`;
    
    document.getElementById('modalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Фокус на первом input
    setTimeout(() => {
        const firstInput = document.querySelector('.modal-body input, .modal-body select');
        if (firstInput) firstInput.focus();
    }, 100);
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
    
    // Кастомные даты аналитики
    const analyticsStartDate = document.getElementById('analyticsStartDate');
    const analyticsEndDate = document.getElementById('analyticsEndDate');
    if (analyticsStartDate) {
        analyticsStartDate.addEventListener('change', () => {
            if (document.getElementById('analyticsPeriod')?.value === 'custom') {
                loadAnalytics();
            }
        });
    }
    if (analyticsEndDate) {
        analyticsEndDate.addEventListener('change', () => {
            if (document.getElementById('analyticsPeriod')?.value === 'custom') {
                loadAnalytics();
            }
        });
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
        loadAITips();
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
    const customStartDate = document.getElementById('analyticsStartDate')?.value;
    const customEndDate = document.getElementById('analyticsEndDate')?.value;
    
    let startDate, endDate;
    const today = new Date();
    endDate = today.toISOString().split('T')[0];
    
    // Показываем/скрываем поля кастомных дат
    const customDatesContainer = document.getElementById('analyticsCustomDates');
    if (customDatesContainer) {
        if (period === 'custom') {
            customDatesContainer.style.display = 'flex';
        } else {
            customDatesContainer.style.display = 'none';
        }
    }
    
    // Если выбран кастомный период
    if (period === 'custom') {
        // Проверяем что обе даты заполнены
        if (!customStartDate || !customEndDate) {
            // Не загружаем данные пока даты не выбраны
            return;
        }
        
        // Валидация дат
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            showToast('Неверный формат даты', 'error');
            return;
        }
        
        if (start > end) {
            showToast('Дата начала должна быть раньше даты окончания', 'error');
            return;
        }
        
        startDate = customStartDate;
        endDate = customEndDate;
    } else {
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
            default:
                startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        }
    }
    
    try {
        const [expenseStats, incomeStats, storeStats, trends] = await Promise.all([
            API.stats.byCategory({ type: 'expense', start_date: startDate, end_date: endDate }),
            API.stats.byCategory({ type: 'income', start_date: startDate, end_date: endDate }),
            API.stats.byStore({ start_date: startDate, end_date: endDate }),
            API.stats.trends(12)
        ]);
        
        renderAnalyticsCharts(expenseStats, incomeStats, storeStats, trends);
    } catch (error) {
        console.error('Analytics error:', error);
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

async function loadTaxes() {
    try {
        state.taxes = await API.taxes.getAll();
        renderTaxes();
    } catch (error) {
        showToast('Ошибка загрузки налогов', 'error');
    }
}

async function loadBonusCards() {
    try {
        state.bonusCards = await API.bonusCards.getAll();
        renderBonusCards();
    } catch (error) {
        showToast('Ошибка загрузки бонусных карт', 'error');
    }
}

async function loadAITips() {
    try {
        state.aiTips = await API.ai.getTips();
        renderAITips();
    } catch (error) {
        console.log('AI tips not available');
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
    updateFilters();
}

// ==================== ДАШБОРД ====================
function renderDashboard() {
    const d = state.dashboard;
    if (!d) return;
    
    // Баланс
    document.getElementById('totalBalance').textContent = formatMoney(d.balance.total);
    document.getElementById('netWorth').textContent = formatMoney(d.balance.net_worth);
    
    // Налоговый резерв
    const taxReserveEl = document.getElementById('taxReserveBalance');
    if (taxReserveEl) {
        taxReserveEl.textContent = formatMoney(d.balance.tax_reserve || 0);
    }
    
    // Месячные показатели
    document.getElementById('monthlyIncome').textContent = formatMoney(d.monthly.income);
    document.getElementById('monthlyExpense').textContent = formatMoney(d.monthly.expense);
    document.getElementById('monthlySavings').textContent = formatMoney(d.monthly.savings);
    document.getElementById('savingsRate').textContent = `${d.monthly.savings_rate}%`;
    
    // Разбивка расходов
    const expensePersonalEl = document.getElementById('expensePersonal');
    const expenseBusinessEl = document.getElementById('expenseBusiness');
    const creditCardPaymentsEl = document.getElementById('creditCardPayments');
    const creditPaymentsEl = document.getElementById('creditPayments');
    const mortgagePaymentsEl = document.getElementById('mortgagePayments');
    
    if (expensePersonalEl) {
        expensePersonalEl.textContent = formatMoney(d.monthly.expense_personal || 0);
    }
    if (expenseBusinessEl) {
        expenseBusinessEl.textContent = formatMoney(d.monthly.expense_business || 0);
    }
    if (creditCardPaymentsEl) {
        creditCardPaymentsEl.textContent = formatMoney(d.monthly.credit_card_payments || 0);
    }
    if (creditPaymentsEl) {
        creditPaymentsEl.textContent = formatMoney(d.monthly.credit_payments || 0);
    }
    if (mortgagePaymentsEl) {
        mortgagePaymentsEl.textContent = formatMoney(d.monthly.mortgage_payments || 0);
    }
    
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
    if (!el) return;
    
    const isPositive = value >= 0;
    const isGood = positiveIsGood ? isPositive : !isPositive;
    
    el.innerHTML = `
        <span>${isPositive ? svgIcon('arrow-up') : svgIcon('arrow-down')} ${Math.abs(value).toFixed(1)}%</span>
        <span>vs прошлый месяц</span>
    `;
    el.className = `card-change ${isGood ? 'positive' : 'negative'}`;
}

function renderUpcomingPayments(payments) {
    const container = document.getElementById('upcomingPayments');
    if (!container) return;
    
    if (!payments || payments.length === 0) {
        container.innerHTML = `<div class="empty-state small">Нет предстоящих платежей ${svgIcon('party')}</div>`;
        return;
    }
    
    const icons = {
        mortgage: svgIcon('home'),
        credit_card: svgIcon('credit-card'),
        credit: svgIcon('file-text')
    };
    
    container.innerHTML = payments.map(p => {
        // Форматируем дату платежа
        const paymentDate = p.date ? formatDate(p.date) : '';
        
        // Определяем срочность
        let urgencyClass = '';
        let daysText = '';
        if (p.days_left === 0) {
            urgencyClass = 'urgent';
            daysText = 'Сегодня!';
        } else if (p.days_left === 1) {
            urgencyClass = 'urgent';
            daysText = 'Завтра';
        } else if (p.days_left <= 3) {
            urgencyClass = 'warning';
            daysText = `Через ${p.days_left} дн.`;
        } else {
            daysText = `${paymentDate} (${p.days_left} дн.)`;
        }
        
        // Для кредитных карт показываем долг если есть
        let amountInfo = formatMoney(p.amount);
        if (p.type === 'credit_card' && p.current_debt > 0) {
            amountInfo = `<span style="font-size: 12px; color: var(--gray-500);">мин.</span> ${formatMoney(p.amount)}`;
        } else if (p.type === 'credit_card' && p.current_debt === 0) {
            amountInfo = `<span style="color: var(--success); display:inline-flex; align-items:center; gap:6px;">${svgIcon('check')} Нет долга</span>`;
        }
        
        return `
            <div class="upcoming-item ${urgencyClass}">
                <span class="upcoming-icon">${icons[p.type] || svgIcon('money')}</span>
                <div class="upcoming-info">
                    <div class="upcoming-name">${p.name}</div>
                    <div class="upcoming-date">${daysText}</div>
                </div>
                <div class="upcoming-amount">${amountInfo}</div>
            </div>
        `;
    }).join('');
}

function renderOverBudget(categories) {
    const container = document.getElementById('overBudgetList');
    if (!container) return;
    
    if (!categories || categories.length === 0) {
        container.innerHTML = `<div class="empty-state small">Всё под контролем! ${svgIcon('thumbs-up','icon-sm')}</div>`;
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
    if (!container) return;
    
    if (!trends || trends.length === 0) {
        container.innerHTML = '<div class="empty-state small">Нет данных для отображения</div>';
        return;
    }
    
    // Проверяем есть ли бизнес-расходы
    const hasBusiness = trends.some(t => t.expense_business > 0);
    // Проверяем есть ли погашение долгов
    const hasDebtPayments = trends.some(t => t.debt_payments > 0);
    
    // Если Chart.js доступен, используем его
    if (typeof Chart !== 'undefined') {
        container.innerHTML = '<canvas id="trendsCanvas"></canvas>';
        const ctx = document.getElementById('trendsCanvas').getContext('2d');
        
        // Уничтожаем старый график если есть
        if (state.charts.trends) {
            state.charts.trends.destroy();
        }
        
        // Формируем datasets
        const datasets = [
            {
                label: 'Доходы',
                data: trends.map(t => t.income),
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderRadius: 4
            }
        ];
        
        if (hasBusiness) {
            // Если есть бизнес-расходы - показываем раздельно
            datasets.push({
                label: 'Семейные расходы',
                data: trends.map(t => t.expense_personal || 0),
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderRadius: 4
            });
            datasets.push({
                label: 'Бизнес расходы',
                data: trends.map(t => t.expense_business || 0),
                backgroundColor: 'rgba(156, 39, 176, 0.8)',
                borderRadius: 4
            });
        } else {
            // Если нет бизнес-расходов - просто "Расходы"
            datasets.push({
                label: 'Расходы',
                data: trends.map(t => t.expense_direct || 0),
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderRadius: 4
            });
        }
        
        // Добавляем погашение долгов отдельным столбцом если есть
        if (hasDebtPayments) {
            datasets.push({
                label: 'Погашение долгов',
                data: trends.map(t => t.debt_payments || 0),
                backgroundColor: 'rgba(249, 115, 22, 0.8)',
                borderRadius: 4
            });
        }
        
        state.charts.trends = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: trends.map(t => {
                    const date = new Date(t.month + '-01');
                    return date.toLocaleDateString('ru-RU', { month: 'short' });
                }),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 8,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${formatMoney(context.raw)}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => formatLargeNumber(value)
                        }
                    }
                }
            }
        });
        return;
    }
    
    // Fallback без Chart.js
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
    if (!container) return;
    
    const goals = state.goals.slice(0, 3);
    
    if (goals.length === 0) {
        container.innerHTML = `<div class="empty-state small">Добавьте первую цель ${svgIcon('target')}</div>`;
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
    if (!container) return;
    
    const transactions = state.transactions.slice(0, 5);
    
    if (transactions.length === 0) {
        container.innerHTML = '<div class="empty-state small">Нет операций</div>';
        return;
    }
    
    container.innerHTML = transactions.map(t => `
        <div class="transaction-mini-item">
            <div class="transaction-mini-icon" style="background: ${t.category_color || '#667eea'}20">
                ${t.category_icon || (t.type === 'transfer' ? svgIcon('repeat') : svgIcon('money'))}
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

function renderAITips() {
    const container = document.getElementById('aiTipsContainer');
    if (!container || !state.aiTips.length) return;
    
    container.innerHTML = state.aiTips.map(tip => createAITip(tip)).join('');
    container.style.display = 'block';
}

// ==================== СЧЕТА ====================
function renderAccounts() {
    // Группируем счета по типам
    const debitAccounts = state.accounts.filter(a => 
        (a.account_type === 'debit' || a.account_type === 'savings') && !a.is_business && !a.is_investment && !a.is_tax_reserve
    );
    const cashAccounts = state.accounts.filter(a => a.account_type === 'cash');
    const businessAccounts = state.accounts.filter(a => a.is_business);
    const taxReserveAccounts = state.accounts.filter(a => a.is_tax_reserve || a.account_type === 'tax_reserve');
    const investmentAccounts = state.accounts.filter(a => a.is_investment || a.account_type === 'investment');
    const creditCardAccounts = state.accounts.filter(a => a.account_type === 'credit_card');
    
    renderAccountsGrid('debitAccountsGrid', debitAccounts);
    renderAccountsGrid('cashAccountsGrid', cashAccounts);
    renderAccountsGrid('businessAccountsGrid', businessAccounts);
    renderAccountsGrid('taxReserveAccountsGrid', taxReserveAccounts);
    renderAccountsGrid('investmentAccountsGrid', investmentAccounts);
    
    // Кредитные карты в счетах (краткий вид)
    if (creditCardAccounts.length > 0) {
        const creditCardsSection = document.getElementById('creditCardsAccountsGrid');
        if (creditCardsSection) {
            renderAccountsGrid('creditCardsAccountsGrid', creditCardAccounts);
        }
    }
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
        let balanceColor = a.balance >= 0 ? 'var(--gray-900)' : 'var(--danger)';
        let displayBalance = a.balance;
        
        // Для кредитных карт показываем долг
        if (a.account_type === 'credit_card') {
            displayBalance = -(a.current_debt || 0);
            balanceColor = a.current_debt > 0 ? 'var(--danger)' : 'var(--success)';
            extraInfo = `
                <div class="account-details">
                    <div class="account-detail">
                        <span>Лимит</span>
                        <span>${formatMoney(a.credit_limit)}</span>
                    </div>
                    <div class="account-detail">
                        <span>Доступно</span>
                        <span style="color: var(--success);">${formatMoney(a.available_limit || (a.credit_limit - (a.current_debt || 0)))}</span>
                    </div>
                    ${a.current_debt > 0 ? `
                        <div class="account-detail">
                            <span>Мин. платёж</span>
                            <span style="color: var(--warning);">${formatMoney(a.min_payment || 0)}</span>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        // Для бизнес-счетов
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
        
        // Для налогового резерва
        if (a.is_tax_reserve) {
            extraInfo = `
                <div class="account-details">
                    <div class="account-detail">
                        <span>Накоплено на налоги</span>
                        <span style="color: var(--warning); font-weight: 600;">${formatMoney(a.balance)}</span>
                    </div>
                </div>
            `;
        }
        
        // Для инвестиционных счетов
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
            <div class="account-card" data-id="${a.id}">
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: ${a.color}; border-radius: var(--radius) var(--radius) 0 0;"></div>
                <div class="account-header">
                    <div class="account-icon" style="background: ${a.color}20">${a.icon}</div>
                    <div class="account-info">
                        <div class="account-name">${a.name}</div>
                        <div class="account-bank">${a.bank_name || ''}</div>
                    </div>
                </div>
                <div class="account-balance" style="color: ${balanceColor}">
                    ${formatMoney(displayBalance)}
                </div>
                ${extraInfo}
                <div class="account-actions">
                    <button class="btn btn-sm btn-secondary" onclick="showAccountModal(${a.id})">${svgIcon('edit','icon-sm')} Изменить</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAccount(${a.id})">${svgIcon('trash', 'icon-sm')}</button>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== КРЕДИТНЫЕ КАРТЫ ====================
function renderCreditCards() {
    const container = document.getElementById('creditCardsGrid');
    if (!container) return;
    
    if (state.creditCards.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${svgIcon('credit-card')}</div>
                <div class="empty-state-text">Добавьте кредитную карту</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.creditCards.map(card => {
        const utilization = card.utilization || 0;
        const progressClass = utilization > 80 ? 'danger' : utilization > 50 ? 'warning' : '';
        
        return `
            <div class="credit-card-item" data-id="${card.id}">
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
                    <button class="btn btn-sm" onclick="showPayCreditCardModal(${card.id})">${svgIcon('credit-card','icon-sm')} Погасить</button>
                    <button class="btn btn-sm" onclick="showEditCreditCardModal(${card.id})">${svgIcon('edit','icon-sm')} Изменить</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCreditCard(${card.id})">${svgIcon('trash','icon-sm')}</button>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== КАТЕГОРИИ ====================
function renderCategories() {
    const container = document.getElementById('categoriesGrid');
    if (!container) return;
    
    const filtered = state.categories.filter(c => c.type === state.currentCategoryType);
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${svgIcon('tag')}</div>
                <div class="empty-state-text">Нет категорий</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(cat => {
        const hasBudget = cat.budget_limit > 0;
        const progressColor = cat.budget_percent > 100 ? 'var(--danger)' : cat.budget_percent > 80 ? 'var(--warning)' : cat.color;
        
        return `
            <div class="category-card" data-id="${cat.id}">
                <button class="category-delete" onclick="event.stopPropagation(); deleteCategory(${cat.id})">×</button>
                <button class="category-edit" onclick="event.stopPropagation(); showCategoryModal(${cat.id})">${svgIcon('edit','icon-sm')}</button>
                <div class="category-icon" style="background: ${cat.color}20">${cat.icon}</div>
                <div class="category-name">${cat.name}</div>
                ${hasBudget ? `
                    <div class="category-budget">
                        ${formatMoney(cat.spent_this_month)} / ${formatMoney(cat.budget_limit)}
                    </div>
                    <div class="category-progress">
                        <div class="category-progress-fill" style="width: ${Math.min(100, cat.budget_percent)}%; background: ${progressColor}"></div>
                    </div>
                ` : `
                    <div class="category-spent">
                        ${state.currentCategoryType === 'expense' ? 'Потрачено' : 'Получено'}: ${formatMoney(state.currentCategoryType === 'expense' ? cat.spent_this_month : cat.earned_this_month)}
                    </div>
                `}
            </div>
        `;
    }).join('');
}

// ==================== ТРАНЗАКЦИИ ====================
function renderTransactions() {
    const container = document.getElementById('transactionsList');
    if (!container) return;
    
    if (state.transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${svgIcon('credit-card')}</div>
                <div class="empty-state-text">Нет операций</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.transactions.map(t => `
        <div class="transaction-item" data-id="${t.id}">
            <div class="transaction-icon" style="background: ${t.category_color || '#667eea'}20">
                ${t.category_icon || (t.type === 'transfer' ? svgIcon('repeat') : svgIcon('money'))}
            </div>
            <div class="transaction-info">
                <div class="transaction-category">
                    ${t.type === 'transfer' 
                        ? `${t.account_name} → ${t.to_account_name}` 
                        : (t.category_name || 'Без категории')}
                    ${t.is_business_expense ? `<span style="background: #9C27B0; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 6px;">${svgIcon('building','icon-sm')} Бизнес</span>` : ''}
                </div>
                ${t.description ? `<div class="transaction-description">${t.description}</div>` : ''}
                <div class="transaction-meta">
                    ${formatDate(t.date)} • ${t.account_name}${t.store_name ? ` • ${t.store_name}` : ''}
                </div>
            </div>
            <div class="transaction-amount ${t.type}">
                ${t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}${formatMoney(t.amount)}
            </div>
            <div class="transaction-actions">
                <button class="btn-icon-sm" onclick="showEditTransactionModal(${t.id})" title="Редактировать">${svgIcon('edit','icon-sm')}</button>
                <button class="btn-icon-sm danger" onclick="deleteTransaction(${t.id})" title="Удалить">${svgIcon('trash','icon-sm')}</button>
            </div>
        </div>
    `).join('');
}

// ==================== ЦЕЛИ ====================
function renderGoals() {
    const container = document.getElementById('goalsGrid');
    if (!container) return;
    
    // Статистика
    const totalProgress = state.goals.length > 0 
        ? Math.round(state.goals.reduce((sum, g) => sum + g.progress, 0) / state.goals.length) 
        : 0;
    
    const goalsProgressEl = document.getElementById('goalsProgress');
    const goalsCountEl = document.getElementById('goalsCount');
    const goalsCompletedEl = document.getElementById('goalsCompleted');
    
    if (goalsProgressEl) goalsProgressEl.textContent = `${totalProgress}%`;
    if (goalsCountEl) goalsCountEl.textContent = state.goals.length;
    if (goalsCompletedEl) goalsCompletedEl.textContent = state.dashboard?.goals?.completed_this_month || 0;
    
    if (state.goals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${svgIcon('target')}</div>
                <div class="empty-state-text">Добавьте первую цель</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.goals.map(g => `
        <div class="goal-card" data-id="${g.id}">
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
                <button class="btn btn-sm btn-secondary" onclick="showGoalModal(${g.id})">${svgIcon('edit','icon-sm')}</button>
                <button class="btn btn-sm btn-danger" onclick="deleteGoal(${g.id})">${svgIcon('trash','icon-sm')}</button>
            </div>
        </div>
    `).join('');
}

// ==================== КРЕДИТЫ ====================
function renderCredits() {
    const container = document.getElementById('creditsGrid');
    if (!container) return;
    
    // Сводка
    const totalDebt = state.credits.reduce((sum, c) => sum + c.remaining_amount, 0);
    const monthlyPayment = state.credits.reduce((sum, c) => sum + c.monthly_payment, 0);
    
    const totalCreditsDebtEl = document.getElementById('totalCreditsDebt');
    const monthlyCreditsPaymentEl = document.getElementById('monthlyCreditsPayment');
    
    if (totalCreditsDebtEl) totalCreditsDebtEl.textContent = formatMoney(totalDebt);
    if (monthlyCreditsPaymentEl) monthlyCreditsPaymentEl.textContent = formatMoney(monthlyPayment);
    
    if (state.credits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${svgIcon('clipboard')}</div>
                <div class="empty-state-text">Нет кредитов — отлично! ${svgIcon('party')}</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.credits.map(c => {
        // Форматируем ставку (поддержка дробных типа 43,22%)
        const rateDisplay = c.interest_rate % 1 === 0 
            ? c.interest_rate + '%' 
            : c.interest_rate.toFixed(2).replace('.', ',') + '%';
        
        // Считаем статистику из истории платежей
        const regularPayments = (c.payments_history || []).filter(p => !p.is_extra);
        const extraPayments = (c.payments_history || []).filter(p => p.is_extra);
        const totalPaid = (c.payments_history || []).reduce((sum, p) => sum + p.amount, 0);
        const totalInterestPaid = (c.payments_history || []).reduce((sum, p) => sum + (p.interest || 0), 0);
        const totalExtraPaid = extraPayments.reduce((sum, p) => sum + p.amount, 0);
        
        return `
            <div class="credit-card-new" data-id="${c.id}">
                <!-- Шапка -->
                <div class="credit-card-header">
                    <div class="credit-card-title">
                        <div class="credit-card-name-credit">${c.name}</div>
                        <div class="credit-card-bank">${c.bank_name || 'Банк не указан'}</div>
                    </div>
                    <div class="credit-card-rate">${rateDisplay}</div>
                </div>
                
                <!-- Основные суммы -->
                <div class="credit-card-amounts">
                    <div class="credit-amount-remaining">
                        <span class="amount-label">Остаток</span>
                        <span class="amount-value">${formatMoney(c.remaining_amount)}</span>
                    </div>
                    <div class="credit-amount-original">
                        <span class="amount-label">Сумма кредита</span>
                        <span class="amount-value">${formatMoney(c.original_amount)}</span>
                    </div>
                </div>
                
                <!-- Прогресс -->
                <div class="credit-card-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${c.progress || 0}%"></div>
                    </div>
                    <div class="progress-text">${c.progress || 0}% погашено</div>
                </div>
                
                <!-- Информационные плашки -->
                <div class="credit-info-cards">
                    <div class="info-card">
                        <span class="info-icon">${svgIcon('calendar','icon-sm')}</span>
                        <span class="info-label">Взят</span>
                        <span class="info-value">${c.start_date ? formatDate(c.start_date) : '—'}</span>
                    </div>
                    <div class="info-card">
                        <span class="info-icon">${svgIcon('money','icon-sm')}</span>
                        <span class="info-label">Платёж</span>
                        <span class="info-value">${formatMoney(c.monthly_payment)}</span>
                    </div>
                    <div class="info-card">
                        <span class="info-icon">${svgIcon('check-circle','icon-sm')}</span>
                        <span class="info-label">Внесено</span>
                        <span class="info-value">${regularPayments.length} из ${c.term_months}</span>
                    </div>
                    <div class="info-card">
                        <span class="info-icon">${svgIcon('clock','icon-sm')}</span>
                        <span class="info-label">Осталось</span>
                        <span class="info-value">${c.remaining_months} мес.</span>
                    </div>
                </div>
                
                <!-- Детали -->
                <div class="credit-details-list">
                    <div class="detail-row">
                        <span>Следующий платёж</span>
                        <span class="${c.days_until_payment <= 5 ? 'text-warning' : ''}">${c.next_payment_date ? formatDate(c.next_payment_date) : '—'}</span>
                    </div>
                    <div class="detail-row">
                        <span>Всего уплачено</span>
                        <span class="text-success">${formatMoney(totalPaid)}</span>
                    </div>
                    <div class="detail-row">
                        <span>Из них проценты</span>
                        <span class="text-danger">${formatMoney(totalInterestPaid)}</span>
                    </div>
                </div>
                
                <!-- Досрочные платежи -->
                ${extraPayments.length > 0 ? `
                    <div class="credit-extra-badge">
                        <span>${svgIcon('rocket','icon-sm')} Досрочно: ${extraPayments.length} платежей на ${formatMoney(totalExtraPaid)}</span>
                    </div>
                ` : ''}
                
                <!-- История платежей -->
                <div class="credit-history-section">
                    <div class="history-header" onclick="toggleCreditHistory(${c.id})">
                        <span>${svgIcon('clipboard','icon-sm')} История платежей (${(c.payments_history || []).length})</span>
                        <span class="history-toggle" id="history-toggle-${c.id}">${svgIcon('chevron-down','icon-sm')}</span>
                    </div>
                    <div class="history-content" id="history-content-${c.id}" style="display: none;">
                        ${(c.payments_history || []).length > 0 ? `
                            <div class="history-list">
                                ${(c.payments_history || []).slice().reverse().slice(0, 10).map(p => `
                                    <div class="history-item ${p.is_extra ? 'extra' : ''}">
                                        <div class="history-item-left">
                                            <span class="history-icon">${p.is_extra ? svgIcon('rocket','icon-sm') : svgIcon('calendar','icon-sm')}</span>
                                            <span class="history-date">${formatDate(p.date)}</span>
                                            ${p.payment_number ? `<span class="history-num">#${p.payment_number}</span>` : ''}
                                        </div>
                                        <div class="history-item-right">
                                            <span class="history-amount">${formatMoney(p.amount)}</span>
                                            ${!p.is_extra && p.principal ? `
                                                <span class="history-breakdown">${formatMoney(p.principal)} + ${formatMoney(p.interest)} %</span>
                                            ` : ''}
                                        </div>
                                        <button class="btn-icon-tiny" onclick="deleteCreditPayment(${c.id}, ${p.id})" title="Удалить">×</button>
                                    </div>
                                `).join('')}
                            </div>
                            ${(c.payments_history || []).length > 10 ? `
                                <button class="btn btn-sm btn-link" onclick="showAllCreditPayments(${c.id})">
                                    Показать все ${(c.payments_history || []).length} платежей →
                                </button>
                            ` : ''}
                        ` : `
                            <div class="history-empty">Нет записей о платежах</div>
                        `}
                        
                        <!-- Кнопка добавления платежа в историю -->
                        <button class="btn btn-sm btn-secondary btn-block" onclick="showAddHistoryPaymentModal(${c.id})" style="margin-top: 12px;">
                            + Добавить платёж в историю
                        </button>
                    </div>
                </div>
                
                <!-- Кнопки действий -->
                <div class="credit-card-actions">
                    <button class="btn btn-sm btn-primary" onclick="showPayCreditModal(${c.id})">${svgIcon('credit-card','icon-sm')} Платёж</button>
                    <button class="btn btn-sm btn-success" onclick="showPayCreditModal(${c.id}, true)">${svgIcon('rocket','icon-sm')} Досрочно</button>
                    <button class="btn btn-sm btn-secondary" onclick="showEditCreditModal(${c.id})">${svgIcon('edit','icon-sm')}</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCredit(${c.id})">${svgIcon('trash','icon-sm')}</button>
                </div>
            </div>
        `;
    }).join('');
}

// Переключение истории платежей
function toggleCreditHistory(creditId) {
    const content = document.getElementById(`history-content-${creditId}`);
    const toggle = document.getElementById(`history-toggle-${creditId}`);
    if (content) {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
        if (toggle) toggle.innerHTML = isHidden ? svgIcon('chevron-up','icon-sm') : svgIcon('chevron-down','icon-sm');
    }
}

// Модальное окно добавления платежа в историю (без привязки к счетам)
function showAddHistoryPaymentModal(creditId) {
    const credit = state.credits.find(c => c.id === creditId);
    if (!credit) return;
    
    const today = getCurrentDate();
    
    // Рассчитываем примерную разбивку платежа
    const rate = credit.interest_rate / 100 / 12;
    const estimatedInterest = credit.remaining_amount * rate;
    const estimatedPrincipal = credit.monthly_payment - estimatedInterest;
    
    openModal(`${svgIcon('edit','icon-sm')} Добавить платёж в историю`, `
        <form id="addHistoryPaymentForm">
            <div class="form-hint-box">
                <p>${svgIcon('info','icon-sm')} Здесь можно занести старые платежи, которые вы уже вносили ранее. Это не влияет на ваши счета — просто запись для истории.</p>
            </div>
            
            <div class="form-group">
                <label class="form-label">Тип платежа</label>
                <div class="payment-type-selector">
                    <label class="payment-type-option active">
                        <input type="radio" name="payment_type" value="regular" checked>
                        <span class="option-icon">${svgIcon('calendar','icon-sm')}</span>
                        <span class="option-text">Обязательный</span>
                    </label>
                    <label class="payment-type-option">
                        <input type="radio" name="payment_type" value="extra">
                        <span class="option-icon">${svgIcon('rocket','icon-sm')}</span>
                        <span class="option-text">Досрочный</span>
                    </label>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Дата платежа *</label>
                <input type="date" class="form-input" name="date" value="${today}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Сумма платежа *</label>
                <input type="number" class="form-input" name="amount" step="0.01" required 
                       value="${credit.monthly_payment}" id="historyAmount">
            </div>
            
            <div id="regularPaymentFields">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Основной долг</label>
                        <input type="number" class="form-input" name="principal" step="0.01" 
                               value="${Math.round(estimatedPrincipal * 100) / 100}" id="historyPrincipal">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Проценты</label>
                        <input type="number" class="form-input" name="interest" step="0.01" 
                               value="${Math.round(estimatedInterest * 100) / 100}" id="historyInterest">
                    </div>
                </div>
                <div class="form-hint">Если не знаете точную разбивку — оставьте как есть или введите 0</div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Номер платежа</label>
                <input type="number" class="form-input" name="payment_number" min="1" 
                       placeholder="Например: 5" id="historyPaymentNumber">
                <div class="form-hint">Какой это платёж по счёту (1, 2, 3...)</div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Остаток после платежа</label>
                <input type="number" class="form-input" name="remaining_after" step="0.01" 
                       placeholder="Если знаете">
            </div>
            
            <div class="form-group">
                <label class="form-label">Комментарий</label>
                <input type="text" class="form-input" name="notes" placeholder="Необязательно">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Добавить в историю</button>
            </div>
        </form>
    `);
    
    // Переключение типа платежа
    document.querySelectorAll('.payment-type-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.payment-type-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            option.querySelector('input').checked = true;
            
            const isExtra = option.querySelector('input').value === 'extra';
            document.getElementById('regularPaymentFields').style.display = isExtra ? 'none' : 'block';
        });
    });
    
    document.getElementById('addHistoryPaymentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const isExtra = formData.get('payment_type') === 'extra';
        
        const data = {
            date: formData.get('date'),
            amount: parseFloat(formData.get('amount')),
            principal: isExtra ? parseFloat(formData.get('amount')) : (parseFloat(formData.get('principal')) || 0),
            interest: isExtra ? 0 : (parseFloat(formData.get('interest')) || 0),
            is_extra: isExtra,
            is_regular: !isExtra,
            payment_number: parseInt(formData.get('payment_number')) || 0,
            remaining_after: parseFloat(formData.get('remaining_after')) || null,
            notes: formData.get('notes') || '',
            is_manual: true  // Флаг что это ручной ввод
        };
        
        try {
            await API.credits.addPayment(creditId, data);
            closeModal();
            showToast('Платёж добавлен в историю', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка добавления', 'error');
        }
    });
}

// Показать все платежи
async function showAllCreditPayments(creditId) {
    const credit = state.credits.find(c => c.id === creditId);
    if (!credit) return;
    
    try {
        const payments = await API.credits.getPayments(creditId);
        
        openModal(`${svgIcon('clipboard','icon-sm')} Все платежи: ${credit.name}`, `
            <div class="payments-modal">
                <div class="payments-stats">
                    <div class="stat-item">
                        <span class="stat-label">Всего платежей</span>
                        <span class="stat-value">${payments.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Обязательных</span>
                        <span class="stat-value">${payments.filter(p => !p.is_extra).length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Досрочных</span>
                        <span class="stat-value">${payments.filter(p => p.is_extra).length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Всего уплачено</span>
                        <span class="stat-value">${formatMoney(payments.reduce((s, p) => s + p.amount, 0))}</span>
                    </div>
                </div>
                
                <div class="payments-list-full">
                    ${payments.length > 0 ? payments.map(p => `
                        <div class="payment-row ${p.is_extra ? 'extra' : ''}">
                            <div class="payment-col date">
                                <span class="payment-icon">${p.is_extra ? svgIcon('rocket','icon-sm') : svgIcon('calendar','icon-sm')}</span>
                                <span>${formatDate(p.date)}</span>
                                ${p.payment_number ? `<span class="payment-num">#${p.payment_number}</span>` : ''}
                            </div>
                            <div class="payment-col amount">
                                <strong>${formatMoney(p.amount)}</strong>
                            </div>
                            <div class="payment-col breakdown">
                                ${!p.is_extra ? `
                                    <span class="principal">${formatMoney(p.principal)}</span>
                                    <span class="separator">+</span>
                                    <span class="interest">${formatMoney(p.interest)}</span>
                                ` : '<span class="extra-label">досрочно</span>'}
                            </div>
                            <div class="payment-col remaining">
                                ${p.remaining_after !== null ? `Остаток: ${formatMoney(p.remaining_after)}` : ''}
                            </div>
                            <div class="payment-col actions">
                                <button class="btn-icon-sm danger" onclick="deleteCreditPaymentFromModal(${creditId}, ${p.id})" title="Удалить">${svgIcon('trash','icon-sm')}</button>
                            </div>
                        </div>
                    `).join('') : '<div class="empty-state small">Нет платежей</div>'}
                </div>
                
                <div class="modal-footer-actions">
                    <button class="btn btn-secondary" onclick="showAddHistoryPaymentModal(${creditId})">
                        + Добавить платёж
                    </button>
                </div>
            </div>
        `, 'large');
    } catch (error) {
        showToast('Ошибка загрузки', 'error');
    }
}

// Удаление платежа из модального окна
async function deleteCreditPaymentFromModal(creditId, paymentId) {
    if (!confirm('Удалить этот платёж из истории?')) return;
    
    try {
        await API.credits.deletePayment(creditId, paymentId);
        showToast('Платёж удалён', 'success');
        // Перезагружаем модальное окно
        showAllCreditPayments(creditId);
        loadAllData();
    } catch (error) {
        showToast('Ошибка удаления', 'error');
    }
}

// Удаление платежа из карточки
async function deleteCreditPayment(creditId, paymentId) {
    if (!confirm('Удалить этот платёж из истории?')) return;
    
    try {
        await API.credits.deletePayment(creditId, paymentId);
        showToast('Платёж удалён', 'success');
        loadAllData();
    } catch (error) {
        showToast('Ошибка удаления', 'error');
    }
}

// ==================== ИПОТЕКА ====================
function renderMortgages() {
    const summaryContainer = document.getElementById('mortgagesSummary');
    const container = document.getElementById('mortgagesGrid');
    if (!container) return;
    
    if (state.mortgages.length === 0) {
        if (summaryContainer) summaryContainer.innerHTML = '';
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${svgIcon('home')}</div>
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
    
    if (summaryContainer) {
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
    }
    
    container.innerHTML = state.mortgages.map(m => `
        <div class="mortgage-card" data-id="${m.id}">
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
                    <button class="btn btn-sm btn-primary" onclick="showPayMortgageModal(${m.id})">${svgIcon('credit-card','icon-sm')} Платёж</button>
                    <button class="btn btn-sm btn-success" onclick="showPayMortgageModal(${m.id}, true)">${svgIcon('rocket','icon-sm')} Досрочно</button>
                    <button class="btn btn-sm btn-secondary" onclick="showEditMortgageModal(${m.id})">${svgIcon('edit','icon-sm')}</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMortgage(${m.id})">${svgIcon('trash','icon-sm')}</button>
                </div>
            </div>
        </div>
    `).join('');
}

// ==================== ИНВЕСТИЦИИ ====================
function renderInvestments() {
    const container = document.getElementById('investmentsAccounts');
    if (!container) return;
    
    const totalInvested = state.investments.reduce((sum, i) => sum + i.invested, 0);
    const totalValue = state.investments.reduce((sum, i) => sum + i.current_value, 0);
    const totalProfit = totalValue - totalInvested;
    const totalDividends = state.investments.reduce((sum, i) => sum + (i.dividends_received || 0), 0);
    const profitPercent = totalInvested > 0 ? ((totalProfit / totalInvested) * 100).toFixed(2) : 0;
    
    const totalInvestedEl = document.getElementById('totalInvested');
    const totalInvestmentValueEl = document.getElementById('totalInvestmentValue');
    const totalInvestmentProfitEl = document.getElementById('totalInvestmentProfit');
    const totalDividendsEl = document.getElementById('totalDividends');
    
    if (totalInvestedEl) totalInvestedEl.textContent = formatMoney(totalInvested);
    if (totalInvestmentValueEl) totalInvestmentValueEl.textContent = formatMoney(totalValue);
    if (totalInvestmentProfitEl) {
        totalInvestmentProfitEl.textContent = `${totalProfit >= 0 ? '+' : ''}${formatMoney(totalProfit)} (${profitPercent}%)`;
        totalInvestmentProfitEl.style.color = totalProfit >= 0 ? 'var(--success)' : 'var(--danger)';
    }
    if (totalDividendsEl) totalDividendsEl.textContent = formatMoney(totalDividends);
    
    if (state.investments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${svgIcon('trending-up')}</div>
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
                
                <div class="investments-list">
                    ${accountInvestments.map(inv => `
                        <div class="investment-card" data-id="${inv.id}">
                            <div class="investment-card-header" onclick="toggleInvestmentDetails(${inv.id})">
                                <div class="investment-main-info">
                                    <div class="investment-ticker-block">
                                        <span class="investment-ticker">${inv.ticker}</span>
                                        <span class="investment-type-badge">${ASSET_TYPES[inv.asset_type]?.icon || svgIcon('bar-chart')}
                                    </div>
                                    <div class="investment-name">${inv.name}</div>
                                    ${inv.sector ? `<div class="investment-sector">${inv.sector}</div>` : ''}
                                </div>
                                <div class="investment-numbers">
                                    <div class="investment-value">${formatMoney(inv.current_value)}</div>
                                    <div class="investment-profit ${inv.profit >= 0 ? 'positive' : 'negative'}">
                                        ${inv.profit >= 0 ? '+' : ''}${formatMoney(inv.profit)} (${inv.profit_percent}%)
                                    </div>
                                </div>
                                <div class="investment-expand-icon">${svgIcon('chevron-down','icon-sm')}</div>
                            </div>
                            
                            <div class="investment-details" id="investment-details-${inv.id}" style="display: none;">
                                <div class="investment-stats-grid">
                                    <div class="investment-stat">
                                        <div class="investment-stat-label">Количество</div>
                                        <div class="investment-stat-value">${inv.quantity} шт.</div>
                                    </div>
                                    <div class="investment-stat">
                                        <div class="investment-stat-label">Средняя цена</div>
                                        <div class="investment-stat-value">${formatMoney(inv.avg_buy_price)}</div>
                                    </div>
                                    <div class="investment-stat">
                                        <div class="investment-stat-label">Текущая цена</div>
                                        <div class="investment-stat-value">${formatMoney(inv.current_price)}</div>
                                    </div>
                                    <div class="investment-stat">
                                        <div class="investment-stat-label">Вложено</div>
                                        <div class="investment-stat-value">${formatMoney(inv.invested)}</div>
                                    </div>
                                    <div class="investment-stat">
                                        <div class="investment-stat-label">Дивиденды</div>
                                        <div class="investment-stat-value" style="color: var(--success)">${formatMoney(inv.dividends_received || 0)}</div>
                                    </div>
                                    <div class="investment-stat">
                                        <div class="investment-stat-label">Полный доход</div>
                                        <div class="investment-stat-value" style="color: ${inv.total_return >= 0 ? 'var(--success)' : 'var(--danger)'}">
                                            ${inv.total_return >= 0 ? '+' : ''}${formatMoney(inv.total_return)}
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="investment-actions-row">
                                    <button class="btn btn-sm btn-success" onclick="showBuyInvestmentModal(${inv.id})">${svgIcon('trending-up','icon-sm')} Купить</button>
                                    <button class="btn btn-sm btn-warning" onclick="showSellInvestmentModal(${inv.id})">${svgIcon('trending-down','icon-sm')} Продать</button>
                                    <button class="btn btn-sm btn-info" onclick="showDividendModal(${inv.id})">${svgIcon('money','icon-sm')} Дивиденд</button>
                                    <button class="btn btn-sm btn-secondary" onclick="showInvestmentModal(${inv.id})">${svgIcon('edit','icon-sm')}</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteInvestment(${inv.id})">${svgIcon('trash','icon-sm')}</button>
                                </div>
                                
                                <div class="investment-history">
                                    <div class="investment-history-header">
                                        <span>${svgIcon('clipboard','icon-sm')} История операций (${inv.transactions_count || 0})</span>
                                        <button class="btn btn-sm btn-link" onclick="toggleTransactionHistory(${inv.id})">
                                            Показать
                                        </button>
                                    </div>
                                    <div class="investment-transactions" id="investment-trans-${inv.id}" style="display: none;">
                                        ${renderInvestmentTransactions(inv.transactions || [])}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function renderInvestmentTransactions(transactions) {
    if (!transactions || transactions.length === 0) {
        return '<div class="empty-state small">Нет операций</div>';
    }
    
    const typeLabels = {
        'buy': { label: 'Покупка', icon: svgIcon('trending-up','icon-sm'), color: 'var(--success)' },
        'sell': { label: 'Продажа', icon: svgIcon('trending-down','icon-sm'), color: 'var(--danger)' },
        'dividend': { label: 'Дивиденд', icon: svgIcon('money','icon-sm'), color: 'var(--warning)' }
    };
    
    return transactions.map(t => {
        const type = typeLabels[t.type] || { label: t.type, icon: svgIcon('clipboard','icon-sm'), color: 'var(--gray-500)' };
        return `
            <div class="investment-trans-item">
                <div class="investment-trans-icon" style="color: ${type.color}">${type.icon}</div>
                <div class="investment-trans-info">
                    <div class="investment-trans-type">${type.label}</div>
                    <div class="investment-trans-date">${formatDate(t.date)}</div>
                </div>
                <div class="investment-trans-details">
                    ${t.type !== 'dividend' ? `
                        <div>${t.quantity} шт. × ${formatMoney(t.price)}</div>
                    ` : ''}
                    <div style="font-weight: 600; color: ${type.color}">${formatMoney(t.total_amount)}</div>
                    ${t.commission > 0 ? `<div style="font-size: 11px; color: var(--gray-500)">Комиссия: ${formatMoney(t.commission)}</div>` : ''}
                </div>
                <button class="btn-icon-sm danger" onclick="deleteInvestmentTransaction(${t.id})" title="Удалить">${svgIcon('trash','icon-sm')}</button>
            </div>
        `;
    }).join('');
}

function toggleInvestmentDetails(id) {
    const details = document.getElementById(`investment-details-${id}`);
    const card = details?.closest('.investment-card');
    const icon = card?.querySelector('.investment-expand-icon');
    
    if (details) {
        const isHidden = details.style.display === 'none';
        details.style.display = isHidden ? 'block' : 'none';
        if (icon) icon.innerHTML = isHidden ? svgIcon('chevron-up','icon-sm') : svgIcon('chevron-down','icon-sm');
        if (card) card.classList.toggle('expanded', isHidden);
    }
}

function toggleTransactionHistory(id) {
    const container = document.getElementById(`investment-trans-${id}`);
    if (container) {
        container.style.display = container.style.display === 'none' ? 'block' : 'none';
    }
}

// ==================== МАГАЗИНЫ И ТОВАРЫ ====================
function renderStores() {
    const container = document.getElementById('storesGrid');
    if (!container) return;
    
    if (state.stores.length === 0) {
        container.innerHTML = `
            <div class="empty-hint">
                <span>${svgIcon('store')}</span>
                <span>Добавьте магазины</span>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="stores-chips">
            ${state.stores.map(s => `
                <div class="store-chip" data-id="${s.id}">
                    <span class="store-chip-icon">${s.icon}</span>
                    <span class="store-chip-name">${s.name}</span>
                    <span class="store-chip-count">${s.products_count}</span>
                    <button class="store-chip-delete" onclick="event.stopPropagation(); deleteStore(${s.id})">×</button>
                </div>
            `).join('')}
        </div>
    `;
}

function renderProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) return;
    
    if (state.products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${svgIcon('box')}</div>
                <div class="empty-state-text">Добавьте товары для сравнения цен</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.products.map(p => {
        const hasPrices = p.prices && p.prices.length > 0;
        const bestPrice = p.min_price;
        const worstPrice = p.max_price;
        
        return `
            <div class="price-compare-row">
                <div class="price-compare-product">
                    <span class="product-emoji">${svgIcon(p.icon, 'icon-sm')}</span>
                    <div class="product-details">
                        <div class="product-title">${p.name}</div>
                        <div class="product-meta">${p.unit}${p.price_diff_percent > 0 ? ` • <span class="text-success">−${p.price_diff_percent}%</span>` : ''}</div>
                    </div>
                    <div class="product-quick-actions">
                        <button class="btn-micro" onclick="showAddPriceModal(${p.id})" title="Добавить цену">+</button>
                        <button class="btn-micro" onclick="showEditProductModal(${p.id})" title="Редактировать">${svgIcon('edit','icon-sm')}</button>
                        <button class="btn-micro danger" onclick="deleteProduct(${p.id})" title="Удалить">×</button>
                    </div>
                </div>
                
                <div class="price-compare-prices">
                    ${hasPrices ? p.prices.map(price => {
                        const isBest = price.price === bestPrice;
                        const isWorst = price.price === worstPrice && p.prices.length > 1;
                        
                        return `
                            <div class="price-chip ${isBest ? 'best' : ''} ${isWorst ? 'worst' : ''} ${price.is_sale ? 'sale' : ''}">
                                <div class="price-chip-store">${price.store_icon}</div>
                                <div class="price-chip-value">${price.price.toLocaleString('ru-RU')} ₽</div>
                                ${isBest ? `<div class="price-chip-badge">${svgIcon('thumbs-up','icon-sm')}</div>` : ''}
                                ${price.is_sale ? `<div class="price-chip-badge">${svgIcon('flame','icon-sm')}</div>` : ''}
                            </div>
                        `;
                    }).join('') : '<div class="no-prices-hint">Нет цен</div>'}
                </div>
            </div>
        `;
    }).join('');
}

// ==================== НАЛОГИ ====================
function renderTaxes() {
    if (!state.taxes) return;
    
    const summaryContainer = document.getElementById('taxesSummary');
    const reservesContainer = document.getElementById('taxesReserves');
    const paymentsContainer = document.getElementById('taxesPayments');
    
    // Сводка
    if (summaryContainer) {
        summaryContainer.innerHTML = `
            <div class="taxes-summary-grid">
                <div class="tax-summary-item">
                    <div class="tax-summary-value">${formatMoney(state.taxes.summary.total_paid)}</div>
                    <div class="tax-summary-label">Уплачено</div>
                </div>
                <div class="tax-summary-item">
                    <div class="tax-summary-value">${formatMoney(state.taxes.summary.total_pending)}</div>
                    <div class="tax-summary-label">К уплате</div>
                </div>
                <div class="tax-summary-item">
                    <div class="tax-summary-value">${formatMoney(state.taxes.summary.total_in_reserve_accounts || state.taxes.summary.total_reserves)}</div>
                    <div class="tax-summary-label">В резерве</div>
                </div>
            </div>
        `;
    }
    
    // Резервы
    if (reservesContainer) {
        if (state.taxes.reserves.length === 0 && (!state.taxes.tax_reserve_accounts || state.taxes.tax_reserve_accounts.length === 0)) {
            reservesContainer.innerHTML = '<p style="color: var(--gray-500); text-align: center;">Нет резервов на налоги</p>';
        } else {
            reservesContainer.innerHTML = `
                <h3>${svgIcon('money','icon-sm')} Резервы на налоги</h3>
                ${state.taxes.tax_reserve_accounts ? state.taxes.tax_reserve_accounts.map(a => `
                    <div class="tax-reserve-item">
                        <div class="tax-reserve-info">
                            <div class="tax-reserve-account">${a.icon} ${a.name}</div>
                            <div class="tax-reserve-details">Резервный счёт</div>
                        </div>
                        <div class="tax-reserve-amount">${formatMoney(a.balance)}</div>
                    </div>
                `).join('') : ''}
                ${state.taxes.reserves.map(r => `
                    <div class="tax-reserve-item">
                        <div class="tax-reserve-info">
                            <div class="tax-reserve-account">${r.account_name}</div>
                            <div class="tax-reserve-details">Доход: ${formatMoney(r.total_income)} • Налог: ${formatMoney(r.total_tax)}</div>
                        </div>
                        <div class="tax-reserve-amount">${formatMoney(r.pending_tax)}</div>
                        ${r.pending_tax > 0 ? `
                            <button class="btn btn-sm btn-primary" onclick="transferTaxReserve(${r.account_id})">Перевести</button>
                        ` : ''}
                    </div>
                `).join('')}
            `;
        }
    }
    
    // Платежи
    if (paymentsContainer) {
        if (state.taxes.payments.length === 0) {
            paymentsContainer.innerHTML = `<h3>${svgIcon('clipboard','icon-sm')} Налоговые платежи</h3><p style="color: var(--gray-500); text-align: center;">Нет запланированных платежей</p>`;
        } else {
            paymentsContainer.innerHTML = `
                <h3>${svgIcon('clipboard','icon-sm')} Налоговые платежи</h3>
                ${state.taxes.payments.map(p => `
                    <div class="tax-payment-item ${p.is_overdue ? 'overdue' : ''} ${p.is_paid ? 'paid' : ''}">
                        <div class="tax-payment-icon">${TAX_TYPES[p.tax_type]?.icon || svgIcon('receipt')}
                        <div class="tax-payment-info">
                            <div class="tax-payment-type">${TAX_TYPES[p.tax_type]?.name || p.tax_type}</div>
                            <div class="tax-payment-period">${formatDate(p.period_start)} — ${formatDate(p.period_end)}</div>
                        </div>
                        <div class="tax-payment-amount">
                            ${formatMoney(p.amount)}
                            <div class="tax-payment-due">
                                ${p.is_paid ? `${svgIcon('check-circle','icon-sm')} Оплачено ${formatDate(p.paid_date)}` : `До ${formatDate(p.due_date)}`}
                            </div>
                        </div>
                        <div class="tax-payment-actions">
                            ${!p.is_paid ? `
                                <button class="btn btn-sm btn-success" onclick="payTax(${p.id})">Оплатить</button>
                            ` : ''}
                            <button class="btn btn-sm btn-secondary" onclick="showEditTaxModal(${p.id})">${svgIcon('edit','icon-sm')}</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteTax(${p.id})">${svgIcon('trash','icon-sm')}</button>
                        </div>
                    </div>
                `).join('')}
            `;
        }
    }
}

// ==================== БОНУСНЫЕ КАРТЫ ====================
function renderBonusCards() {
    const container = document.getElementById('bonusCardsGrid');
    if (!container) return;
    
    if (state.bonusCards.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${svgIcon('ticket')}</div>
                <div class="empty-state-text">Добавьте бонусные карты магазинов</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.bonusCards.map(card => `
        <div class="bonus-card-wrapper" data-id="${card.id}">
            <div class="bonus-card-display" style="background: linear-gradient(135deg, ${card.color} 0%, ${card.color}cc 100%);">
                <div class="bonus-card-header">
                    <div class="bonus-card-icon">${card.icon}</div>
                    <div class="bonus-card-info">
                        <div class="bonus-card-name">${card.name}</div>
                        <div class="bonus-card-store">${card.store_name}</div>
                    </div>
                </div>
                
                <div class="bonus-card-barcode" onclick="showBarcodeFullscreen('${card.card_number}', '${card.barcode_type}', '${card.name}')">
                    <div class="barcode-placeholder" data-number="${card.card_number}" data-type="${card.barcode_type}">
                        <div class="barcode-number-display">${card.card_number}</div>
                        <div class="barcode-hint">Нажмите для показа штрихкода</div>
                    </div>
                </div>
                
                ${card.bonus_balance > 0 ? `
                    <div class="bonus-card-balance">
                        <span class="bonus-label">Бонусы:</span>
                        <span class="bonus-value">${card.bonus_balance}</span>
                    </div>
                ` : ''}
                
                ${card.notes ? `<div class="bonus-card-notes">${card.notes}</div>` : ''}
            </div>
            
            <div class="bonus-card-actions">
                <button class="btn btn-sm btn-secondary" onclick="showEditBonusCardModal(${card.id})">${svgIcon('edit','icon-sm')} Изменить</button>
                <button class="btn btn-sm btn-danger" onclick="deleteBonusCard(${card.id})">${svgIcon('trash','icon-sm')}</button>
            </div>
        </div>
    `).join('');
    
    // Инициализируем штрихкоды если библиотека доступна
    initBarcodes();
}

function initBarcodes() {
    // Если есть JsBarcode, генерируем штрихкоды
    if (typeof JsBarcode !== 'undefined') {
        document.querySelectorAll('.barcode-placeholder').forEach(el => {
            const number = el.dataset.number;
            const type = el.dataset.type;
            
            if (type === 'QR' && typeof QRCode !== 'undefined') {
                el.innerHTML = '<div class="qr-container"></div>';
                new QRCode(el.querySelector('.qr-container'), {
                    text: number,
                    width: 128,
                    height: 128
                });
            } else {
                el.innerHTML = '<svg class="barcode-svg"></svg><div class="barcode-number-display">' + number + '</div>';
                try {
                    JsBarcode(el.querySelector('.barcode-svg'), number, {
                        format: type === 'EAN13' ? 'EAN13' : type === 'EAN8' ? 'EAN8' : 'CODE128',
                        width: 2,
                        height: 60,
                        displayValue: false
                    });
                } catch (e) {
                    console.log('Barcode error:', e);
                }
            }
        });
    }
}

function showBarcodeFullscreen(number, type, name) {
    openModal(name, `
        <div class="barcode-fullscreen">
            <div class="barcode-fullscreen-container" id="barcodeFullscreen" data-number="${number}" data-type="${type}">
                <div class="barcode-loading">Генерация штрихкода...</div>
            </div>
            <div class="barcode-fullscreen-number">${number}</div>
            <p style="text-align: center; color: var(--gray-500); margin-top: 16px;">Покажите этот код на кассе</p>
        </div>
    `, 'normal');
    
    setTimeout(() => {
        const container = document.getElementById('barcodeFullscreen');
        if (typeof JsBarcode !== 'undefined' && type !== 'QR') {
            container.innerHTML = '<svg class="barcode-svg-large"></svg>';
            try {
                JsBarcode(container.querySelector('.barcode-svg-large'), number, {
                    format: type === 'EAN13' ? 'EAN13' : type === 'EAN8' ? 'EAN8' : 'CODE128',
                    width: 3,
                    height: 100,
                    displayValue: false
                });
            } catch (e) {
                container.innerHTML = `<div class="barcode-number-large">${number}</div>`;
            }
        } else if (typeof QRCode !== 'undefined' && type === 'QR') {
            container.innerHTML = '';
            new QRCode(container, {
                text: number,
                width: 200,
                height: 200
            });
        } else {
            container.innerHTML = `<div class="barcode-number-large">${number}</div>`;
        }
    }, 100);
}

// ==================== АНАЛИТИКА ====================
function renderAnalyticsCharts(expenseStats, incomeStats, storeStats, trends) {
    renderPieChart('expenseChart', expenseStats, 'Расходы по категориям');
    renderPieChart('incomeChart', incomeStats, 'Доходы по категориям');
    renderBarChart('storeChart', storeStats, 'Расходы по магазинам');
    renderTrendsLineChart('trendsLineChart', trends);
}

function renderPieChart(containerId, data, title) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state small">Нет данных</div>';
        return;
    }
    
    const total = data.reduce((sum, item) => sum + item.total, 0);
    
    // Если Chart.js доступен
    if (typeof Chart !== 'undefined') {
        container.innerHTML = `<canvas id="${containerId}Canvas"></canvas>`;
        const ctx = document.getElementById(`${containerId}Canvas`).getContext('2d');
        
        if (state.charts[containerId]) {
            state.charts[containerId].destroy();
        }
        
        state.charts[containerId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => `${d.icon} ${d.name}`),
                datasets: [{
                    data: data.map(d => d.total),
                    backgroundColor: data.map(d => d.color),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            padding: 8,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                const percent = ((value / total) * 100).toFixed(1);
                                return `${formatMoney(value)} (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
        return;
    }
    
    // Fallback без Chart.js
    const maxValue = Math.max(...data.map(item => item.total));
    
    container.innerHTML = `
        <div class="chart-bars">
            ${data.map(item => `
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
            `).join('')}
        </div>
    `;
}

function renderBarChart(containerId, data, title) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state small">Нет данных о покупках в магазинах</div>';
        return;
    }
    
    if (typeof Chart !== 'undefined') {
        container.innerHTML = `<canvas id="${containerId}Canvas"></canvas>`;
        const ctx = document.getElementById(`${containerId}Canvas`).getContext('2d');
        
        if (state.charts[containerId]) {
            state.charts[containerId].destroy();
        }
        
        state.charts[containerId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => `${d.icon} ${d.name}`),
                datasets: [{
                    data: data.map(d => d.total),
                    backgroundColor: data.map(d => d.color || '#667eea'),
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${formatMoney(context.raw)} (${data[context.dataIndex].count} покупок)`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            callback: (value) => formatLargeNumber(value)
                        }
                    }
                }
            }
        });
        return;
    }
    
    // Fallback
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

function renderTrendsLineChart(containerId, trends) {
    const container = document.getElementById(containerId);
    if (!container || !trends || trends.length === 0) return;
    
    if (typeof Chart !== 'undefined') {
        container.innerHTML = `<canvas id="${containerId}Canvas"></canvas>`;
        const ctx = document.getElementById(`${containerId}Canvas`).getContext('2d');
        
        if (state.charts[containerId]) {
            state.charts[containerId].destroy();
        }
        
        state.charts[containerId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trends.map(t => t.month_name),
                datasets: [
                    {
                        label: 'Доходы',
                        data: trends.map(t => t.income),
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Расходы',
                        data: trends.map(t => t.expense),
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Накопления',
                        data: trends.map(t => t.savings),
                        borderColor: 'rgb(99, 102, 241)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${formatMoney(context.raw)}`
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: (value) => formatLargeNumber(value)
                        }
                    }
                }
            }
        });
    }
}

// ==================== AI АНАЛИТИКА ====================
async function runAIAnalysis() {
    const period = document.getElementById('analyticsPeriod')?.value || 'month';
    
    openModal(`${svgIcon('bot','icon-sm')} AI-анализ расходов`, `
        <div class="ai-analysis-loading">
            <div class="spinner"></div>
            <p>Анализирую ваши расходы...</p>
            <p style="font-size: 13px; color: var(--gray-500);">Это может занять несколько секунд</p>
        </div>
    `);
    
    try {
        const result = await API.ai.analyze({ period });
        
        document.getElementById('modalBody').innerHTML = `
            <div class="ai-analysis-result">
                <div class="ai-stats-summary">
                    <div class="ai-stat">
                        <div class="ai-stat-value" style="color: var(--success)">${formatMoney(result.stats.income)}</div>
                        <div class="ai-stat-label">Доходы</div>
                    </div>
                    <div class="ai-stat">
                        <div class="ai-stat-value" style="color: var(--danger)">${formatMoney(result.stats.expense)}</div>
                        <div class="ai-stat-label">Расходы</div>
                    </div>
                    <div class="ai-stat">
                        <div class="ai-stat-value" style="color: ${result.stats.savings >= 0 ? 'var(--primary)' : 'var(--danger)'}">${formatMoney(result.stats.savings)}</div>
                        <div class="ai-stat-label">Накоплено</div>
                    </div>
                    <div class="ai-stat">
                        <div class="ai-stat-value">${result.stats.savings_rate}%</div>
                        <div class="ai-stat-label">Норма сбережений</div>
                    </div>
                </div>
                
                <div class="ai-analysis-content">
                    ${formatAIResponse(result.analysis)}
                </div>
            </div>
        `;
    } catch (error) {
        document.getElementById('modalBody').innerHTML = `
            <div class="ai-analysis-error">
                <div class="error-icon">${svgIcon('help-circle')}</div>
                <p>Не удалось получить AI-анализ</p>
                <p style="font-size: 13px; color: var(--gray-500);">${error.message || 'Попробуйте позже'}</p>
            </div>
        `;
    }
}

function formatAIResponse(text) {
    // Преобразуем markdown-подобный текст в HTML
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
}

// ==================== ДОСТИЖЕНИЯ ====================
function renderAchievements() {
    const container = document.getElementById('achievementsGrid');
    if (!container) return;
    
    const totalPoints = state.achievements
        .filter(a => a.unlocked)
        .reduce((sum, a) => sum + a.points, 0);
    
    const totalPointsEl = document.getElementById('totalPoints');
    if (totalPointsEl) totalPointsEl.textContent = totalPoints;
    
    container.innerHTML = state.achievements.map(a => `
        <div class="achievement-card ${a.unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-icon">${a.icon}</div>
            <div class="achievement-name">${a.name}</div>
            <div class="achievement-description">${a.description}</div>
            <div class="achievement-points">
                <span>${svgIcon('star','icon-sm')}</span>
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
function showTransactionModal(editId = null) {
    const transaction = editId ? state.transactions.find(t => t.id === editId) : null;
    const title = transaction ? 'Редактировать операцию' : 'Новая операция';
    const today = getCurrentDate();
    
    openModal(title, `
        <form id="transactionForm">
            <input type="hidden" name="id" value="${transaction?.id || ''}">
            
            <div class="type-tabs">
                <button type="button" class="type-tab expense ${(!transaction || transaction.type === 'expense') ? 'active' : ''}" data-type="expense">${svgIcon('trending-down','icon-sm')} Расход</button>
                <button type="button" class="type-tab income ${transaction?.type === 'income' ? 'active' : ''}" data-type="income">${svgIcon('trending-up','icon-sm')} Доход</button>
                <button type="button" class="type-tab transfer ${transaction?.type === 'transfer' ? 'active' : ''}" data-type="transfer">${svgIcon('repeat','icon-sm')} Перевод</button>
            </div>
            <input type="hidden" name="type" value="${transaction?.type || 'expense'}">
            
            <div class="form-group">
                <label class="form-label">Сумма *</label>
                <input type="number" class="form-input" name="amount" step="0.01" min="0.01" required 
                       placeholder="0.00" value="${transaction?.amount || ''}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Счёт *</label>
                <select class="form-select" name="account_id" required>
                    ${state.accounts.map(a => `
                        <option value="${a.id}" ${transaction?.account_id === a.id ? 'selected' : ''}>
                            ${a.icon} ${a.name} (${formatMoney(a.balance)})
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="form-group" id="categoryGroup" style="${transaction?.type === 'transfer' ? 'display:none' : ''}">
                <label class="form-label">Категория</label>
                <select class="form-select" name="category_id">
                    <option value="">Без категории</option>
                    ${state.categories
                        .filter(c => c.type === (transaction?.type || 'expense'))
                        .map(c => `<option value="${c.id}" ${transaction?.category_id === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`)
                        .join('')}
                </select>
            </div>
            
            <div class="form-group" id="toAccountGroup" style="${transaction?.type === 'transfer' ? '' : 'display:none'}">
                <label class="form-label">На счёт *</label>
                <select class="form-select" name="to_account_id">
                    ${state.accounts.map(a => `
                        <option value="${a.id}" ${transaction?.to_account_id === a.id ? 'selected' : ''}>
                            ${a.icon} ${a.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="form-group" id="storeGroup" style="${transaction?.type === 'expense' ? '' : 'display:none'}">
                <label class="form-label">Магазин</label>
                <select class="form-select" name="store_id">
                    <option value="">Не указан</option>
                    ${state.stores.map(s => `
                        <option value="${s.id}" ${transaction?.store_id === s.id ? 'selected' : ''}>
                            ${s.icon} ${s.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <!-- ✅ НОВОЕ: Чекбокс бизнес-расхода -->
            <div class="form-group" id="businessExpenseGroup" style="${transaction?.type === 'expense' ? '' : 'display:none'}">
                <label class="form-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" name="is_business_expense" ${transaction?.is_business_expense ? 'checked' : ''}> 
                    ${svgIcon('building','icon-sm')} Это бизнес-расход
                </label>
                <div class="form-hint">Отметьте, если это расход для бизнеса/ИП</div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Описание</label>
                <input type="text" class="form-input" name="description" 
                       placeholder="Комментарий к операции" value="${transaction?.description || ''}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Дата</label>
                <input type="date" class="form-input" name="date" value="${transaction?.date || today}">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">${transaction ? 'Сохранить' : 'Добавить'}</button>
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
            const businessExpenseGroup = document.getElementById('businessExpenseGroup');  // ✅ НОВОЕ
            const categorySelect = document.querySelector('select[name="category_id"]');
            
            if (type === 'transfer') {
                categoryGroup.style.display = 'none';
                toAccountGroup.style.display = 'block';
                storeGroup.style.display = 'none';
                businessExpenseGroup.style.display = 'none';  // ✅ НОВОЕ
            } else {
                categoryGroup.style.display = 'block';
                toAccountGroup.style.display = 'none';
                storeGroup.style.display = type === 'expense' ? 'block' : 'none';
                businessExpenseGroup.style.display = type === 'expense' ? 'block' : 'none';  // ✅ НОВОЕ
                
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
        const id = data.id;
        delete data.id;
        
        data.amount = parseFloat(data.amount);
        data.account_id = parseInt(data.account_id);
        data.is_business_expense = formData.has('is_business_expense');  // ✅ НОВОЕ
        
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
            if (id) {
                await API.transactions.update(parseInt(id), data);
                showToast('Операция обновлена', 'success');
            } else {
                await API.transactions.create(data);
                showToast('Операция добавлена', 'success');
            }
            closeModal();
            loadAllData();
        } catch (error) {
            showToast('Ошибка сохранения операции', 'error');
        }
    });
}

function showEditTransactionModal(id) {
    showTransactionModal(id);
}

// ----- СЧЁТ -----
function showAccountModal(id = null) {
    const account = id ? state.accounts.find(a => a.id === id) : null;
    const title = account ? 'Редактировать счёт' : 'Новый счёт';
    
    // Получаем налоговые резервные счета для выбора
    const taxReserveAccounts = state.accounts.filter(a => a.is_tax_reserve || a.account_type === 'tax_reserve');
    
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
            
            <div class="form-group" id="creditLimitGroup" style="display: ${account?.account_type === 'credit_card' ? 'block' : 'none'};">
                <label class="form-label">Кредитный лимит</label>
                <input type="number" class="form-input" name="credit_limit" step="0.01" value="${account?.credit_limit || 0}">
            </div>
            
            <div class="form-group" id="currentDebtGroup" style="display: ${account?.account_type === 'credit_card' ? 'block' : 'none'};">
                <label class="form-label">Текущий долг</label>
                <input type="number" class="form-input" name="current_debt" step="0.01" value="${account?.current_debt || 0}">
            </div>
            
            <div class="form-group" id="businessGroup" style="display: ${['debit', 'business'].includes(account?.account_type) ? 'block' : 'none'};">
                <label class="form-label">
                    <input type="checkbox" name="is_business" ${account?.is_business ? 'checked' : ''}> 
                    Это бизнес-счёт (ИП)
                </label>
            </div>
            
            <div class="form-group" id="taxRateGroup" style="display: ${account?.is_business ? 'block' : 'none'};">
                <label class="form-label">Ставка налога (%)</label>
                <input type="number" class="form-input" name="tax_rate" step="0.1" value="${account?.tax_rate || 6}" placeholder="6">
            </div>
            
            <div class="form-group" id="taxAccountGroup" style="display: ${account?.is_business ? 'block' : 'none'};">
                <label class="form-label">Счёт для налогов</label>
                <select class="form-select" name="linked_tax_account_id">
                    <option value="">Не выбран</option>
                    ${taxReserveAccounts.map(a => 
                        `<option value="${a.id}" ${account?.linked_tax_account_id === a.id ? 'selected' : ''}>${a.icon} ${a.name}</option>`
                    ).join('')}
                </select>
                <div class="form-hint">Выберите резервный счёт для автоматического расчёта налогов</div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Иконка</label>
                <div class="icon-picker" id="iconPicker">
                    ${ICONS.slice(0, 40).map(icon => 
                        `<div class="icon-option ${account?.icon === icon ? 'selected' : ''}" data-icon="${icon}">${icon}</div>`
                    ).join('')}
                </div>
                <input type="hidden" name="icon" value="${account?.icon || 'credit-card'}">
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
        document.getElementById('currentDebtGroup').style.display = type === 'credit_card' ? 'block' : 'none';
        document.getElementById('businessGroup').style.display = ['debit', 'business'].includes(type) ? 'block' : 'none';
        
        const isBusinessChecked = document.querySelector('input[name="is_business"]')?.checked;
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
        data.current_debt = parseFloat(data.current_debt) || 0;
        data.tax_rate = parseFloat(data.tax_rate) || 0;
        data.is_business = formData.has('is_business');
        data.is_investment = data.account_type === 'investment';
        data.is_tax_reserve = data.account_type === 'tax_reserve';
        
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
            
            <div class="form-group">
                <label class="form-label">Текущий долг</label>
                <input type="number" class="form-input" name="current_debt" step="0.01" value="0" placeholder="0">
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
                    ${CREDIT_CARD_ICON_KEYS.map(key =>
                    `<div class="icon-option ${key === 'credit-card' ? 'selected' : ''}" data-icon="${key}">
                        ${svgIcon(key,'icon-sm')}
                    </div>`
                    ).join('')}
                </div>
                <input type="hidden" name="icon" value="credit-card">
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
        data.current_debt = parseFloat(data.current_debt) || 0;
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

function showEditCreditCardModal(id) {
    const card = state.creditCards.find(c => c.id === id);
    if (!card) return;
    
    openModal('Редактировать кредитную карту', `
        <form id="editCreditCardForm">
            <div class="form-group">
                <label class="form-label">Название карты *</label>
                <input type="text" class="form-input" name="name" required value="${card.name}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Банк</label>
                <input type="text" class="form-input" name="bank_name" value="${card.bank_name || ''}">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Кредитный лимит *</label>
                    <input type="number" class="form-input" name="credit_limit" step="0.01" required value="${card.credit_limit}">
                </div>
                <div class="form-group">
                    <label class="form-label">Текущий долг</label>
                    <input type="number" class="form-input" name="current_debt" step="0.01" value="${card.current_debt}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Мин. платёж (%)</label>
                    <input type="number" class="form-input" name="min_payment_percent" step="0.1" value="${card.min_payment_percent}">
                </div>
                <div class="form-group">
                    <label class="form-label">Льготный период (дн.)</label>
                    <input type="number" class="form-input" name="grace_period_days" value="${card.grace_period_days}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">День выписки</label>
                    <input type="number" class="form-input" name="statement_day" min="1" max="31" value="${card.statement_day}">
                </div>
                <div class="form-group">
                    <label class="form-label">День платежа</label>
                    <input type="number" class="form-input" name="payment_due_day" min="1" max="31" value="${card.payment_due_day}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Ставка (%)</label>
                    <input type="number" class="form-input" name="interest_rate" step="0.1" value="${card.interest_rate}">
                </div>
                <div class="form-group">
                    <label class="form-label">Кэшбэк (%)</label>
                    <input type="number" class="form-input" name="cashback_percent" step="0.1" value="${card.cashback_percent}">
                </div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Сохранить</button>
            </div>
        </form>
    `);
    
    document.getElementById('editCreditCardForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        data.credit_limit = parseFloat(data.credit_limit);
        data.current_debt = parseFloat(data.current_debt) || 0;
        data.min_payment_percent = parseFloat(data.min_payment_percent) || 5;
        data.grace_period_days = parseInt(data.grace_period_days) || 55;
        data.statement_day = parseInt(data.statement_day) || 1;
        data.payment_due_day = parseInt(data.payment_due_day) || 20;
        data.interest_rate = parseFloat(data.interest_rate) || 0;
        data.cashback_percent = parseFloat(data.cashback_percent) || 0;
        
        try {
            await API.creditCards.update(id, data);
            closeModal();
            showToast('Кредитная карта обновлена', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка обновления', 'error');
        }
    });
}

function showPayCreditCardModal(cardId) {
    const card = state.creditCards.find(c => c.id === cardId);
    if (!card) return;
    
    const payableAccounts = state.accounts.filter(a => 
        a.account_type !== 'credit_card' && a.balance > 0
    );
    
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
                <div class="form-hint" style="margin-top: 8px;">
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
                    ${payableAccounts.map(a => 
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
                        <option value="expense" ${state.currentCategoryType === 'expense' ? 'selected' : ''}>${svgIcon('trending-down','icon-sm')} Расход</option>
                        <option value="income" ${state.currentCategoryType === 'income' ? 'selected' : ''}>${svgIcon('trending-up','icon-sm')} Доход</option>
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
                <input type="hidden" name="icon" value="${category?.icon || 'box'}">
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
                    ${GOAL_ICON_KEYS.map(key =>
                    `<div class="icon-option ${goal?.icon === key ? 'selected' : ''}" data-icon="${key}">${svgIcon(key,'icon-sm')}</div>`
                    ).join('')}
                </div>
                <input type="hidden" name="icon" value="${goal?.icon || 'target'}">
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
        
        if (!data.deadline) delete data.deadline;
        
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
                    <input type="number" class="form-input" name="original_amount" step="0.01" required 
                           placeholder="500000" id="creditOriginalAmount">
                </div>
                <div class="form-group">
                    <label class="form-label">Ставка (%) *</label>
                    <input type="number" class="form-input" name="interest_rate" step="0.1" required 
                           value="15" id="creditInterestRate">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Срок (мес.) *</label>
                    <input type="number" class="form-input" name="term_months" required 
                           value="36" id="creditTermMonths">
                </div>
                <div class="form-group">
                    <label class="form-label">День платежа</label>
                    <input type="number" class="form-input" name="payment_day" min="1" max="31" value="1">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">${svgIcon('calendar','icon-sm')} Дата взятия кредита *</label>
                <input type="date" class="form-input" name="start_date" value="${today}" id="creditStartDate">
                <div class="form-hint">Укажите когда взяли кредит — система рассчитает уже оплаченные платежи</div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Ежемесячный платёж</label>
                <input type="number" class="form-input" name="monthly_payment" step="0.01" 
                       placeholder="Рассчитается автоматически" id="creditMonthlyPayment">
                <div class="form-hint">Оставьте пустым для автоматического расчёта</div>
            </div>
            
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" id="manualRemainingCheckbox"> 
                    Указать остаток вручную
                </label>
            </div>
            
            <div class="form-group" id="remainingAmountGroup" style="display: none;">
                <label class="form-label">Текущий остаток долга</label>
                <input type="number" class="form-input" name="remaining_amount" step="0.01" 
                       placeholder="Если знаете точный остаток" id="creditRemainingAmount">
            </div>
            
            <!-- Блок предварительного расчёта -->
            <div id="creditPreview" style="background: var(--gray-100); padding: 16px; border-radius: var(--radius); margin: 16px 0; display: none;">
                <div style="font-weight: 600; margin-bottom: 12px;">${svgIcon('bar-chart','icon-sm')} Предварительный расчёт</div>
                <div class="credit-preview-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div>
                        <div style="font-size: 12px; color: var(--gray-500);">Ежемесячный платёж</div>
                        <div style="font-size: 18px; font-weight: 600;" id="previewPayment">—</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--gray-500);">Переплата</div>
                        <div style="font-size: 18px; font-weight: 600; color: var(--danger);" id="previewOverpayment">—</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--gray-500);">Уже оплачено месяцев</div>
                        <div style="font-size: 18px; font-weight: 600; color: var(--success);" id="previewPaidMonths">—</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--gray-500);">Текущий остаток</div>
                        <div style="font-size: 18px; font-weight: 600;" id="previewRemaining">—</div>
                    </div>
                </div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="button" class="btn btn-info" onclick="previewCredit()">${svgIcon('refresh-cw','icon-sm')} Рассчитать</button>
                <button type="submit" class="btn btn-primary">Добавить</button>
            </div>
        </form>
    `);
    
    // Показ/скрытие поля остатка
    document.getElementById('manualRemainingCheckbox').addEventListener('change', (e) => {
        document.getElementById('remainingAmountGroup').style.display = e.target.checked ? 'block' : 'none';
    });
    
    // Автоматический предпросмотр при изменении полей
    const fieldsToWatch = ['creditOriginalAmount', 'creditInterestRate', 'creditTermMonths', 'creditStartDate'];
    fieldsToWatch.forEach(id => {
        document.getElementById(id)?.addEventListener('change', debounce(previewCredit, 500));
        document.getElementById(id)?.addEventListener('input', debounce(previewCredit, 500));
    });
    
    document.getElementById('creditForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        data.original_amount = parseFloat(data.original_amount);
        data.interest_rate = parseFloat(data.interest_rate);
        data.term_months = parseInt(data.term_months);
        data.payment_day = parseInt(data.payment_day) || 1;
        
        if (data.monthly_payment) {
            data.monthly_payment = parseFloat(data.monthly_payment);
        } else {
            delete data.monthly_payment;
        }
        
        if (data.remaining_amount && document.getElementById('manualRemainingCheckbox').checked) {
            data.remaining_amount = parseFloat(data.remaining_amount);
        } else {
            delete data.remaining_amount;
        }
        
        try {
            const result = await API.credits.create(data);
            closeModal();
            showToast(`Кредит добавлен. Оплачено месяцев: ${result.calculated?.months_passed || 0}`, 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка добавления', 'error');
        }
    });
}

// Функция предпросмотра расчёта кредита
async function previewCredit() {
    const amount = parseFloat(document.getElementById('creditOriginalAmount')?.value) || 0;
    const rate = parseFloat(document.getElementById('creditInterestRate')?.value) || 0;
    const term = parseInt(document.getElementById('creditTermMonths')?.value) || 0;
    const startDate = document.getElementById('creditStartDate')?.value;
    
    if (!amount || !term) {
        document.getElementById('creditPreview').style.display = 'none';
        return;
    }
    
    try {
        const result = await API.calculator.credit({
            amount,
            interest_rate: rate,
            term_months: term,
            start_date: startDate,
            payment_day: parseInt(document.querySelector('input[name="payment_day"]')?.value) || 1
        });
        
        document.getElementById('creditPreview').style.display = 'block';
        document.getElementById('previewPayment').textContent = formatMoney(result.monthly_payment);
        document.getElementById('previewOverpayment').textContent = formatMoney(result.overpayment);
        document.getElementById('previewPaidMonths').textContent = `${result.months_passed} из ${term}`;
        document.getElementById('previewRemaining').textContent = formatMoney(result.current_remaining);
        
        // Автозаполнение платежа если пусто
        const paymentInput = document.getElementById('creditMonthlyPayment');
        if (paymentInput && !paymentInput.value) {
            paymentInput.placeholder = formatMoney(result.monthly_payment);
        }
        
    } catch (error) {
        console.error('Preview error:', error);
    }
}

function showEditCreditModal(id) {
    const credit = state.credits.find(c => c.id === id);
    if (!credit) return;
    
    openModal('Редактировать кредит', `
        <form id="editCreditForm">
            <div class="form-group">
                <label class="form-label">Название *</label>
                <input type="text" class="form-input" name="name" required value="${credit.name}">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Тип кредита</label>
                    <select class="form-select" name="credit_type">
                        ${Object.entries(CREDIT_TYPES).map(([key, val]) => 
                            `<option value="${key}" ${credit.credit_type === key ? 'selected' : ''}>${val.icon} ${val.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Банк</label>
                    <input type="text" class="form-input" name="bank_name" value="${credit.bank_name || ''}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Сумма кредита</label>
                    <input type="number" class="form-input" name="original_amount" step="0.01" value="${credit.original_amount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Остаток долга</label>
                    <input type="number" class="form-input" name="remaining_amount" step="0.01" value="${credit.remaining_amount}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Ставка (%)</label>
                    <input type="number" class="form-input" name="interest_rate" step="0.1" value="${credit.interest_rate}">
                </div>
                <div class="form-group">
                    <label class="form-label">Ежемесячный платёж</label>
                    <input type="number" class="form-input" name="monthly_payment" step="0.01" value="${credit.monthly_payment}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Осталось месяцев</label>
                    <input type="number" class="form-input" name="remaining_months" value="${credit.remaining_months}">
                </div>
                <div class="form-group">
                    <label class="form-label">День платежа</label>
                    <input type="number" class="form-input" name="payment_day" min="1" max="31" value="${credit.payment_day}">
                </div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Сохранить</button>
            </div>
        </form>
    `);
    
    document.getElementById('editCreditForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        data.original_amount = parseFloat(data.original_amount);
        data.remaining_amount = parseFloat(data.remaining_amount);
        data.interest_rate = parseFloat(data.interest_rate);
        data.monthly_payment = parseFloat(data.monthly_payment);
        data.remaining_months = parseInt(data.remaining_months);
        data.payment_day = parseInt(data.payment_day);
        
        try {
            await API.credits.update(id, data);
            closeModal();
            showToast('Кредит обновлён', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка обновления', 'error');
        }
    });
}

function showPayCreditModal(creditId, isExtra = false) {
    const credit = state.credits.find(c => c.id === creditId);
    if (!credit) return;
    
    const title = isExtra ? `${svgIcon('rocket','icon-sm')} Досрочное погашение` : `${svgIcon('credit-card','icon-sm')} Внести платёж`;
    const today = getCurrentDate();
    
    // Форматируем ставку
    const rateDisplay = credit.interest_rate % 1 === 0 
        ? credit.interest_rate + '%' 
        : credit.interest_rate.toFixed(2).replace('.', ',') + '%';
    
    openModal(title, `
        <form id="payCreditForm">
            <!-- Информация о кредите -->
            <div class="credit-pay-info">
                <div class="credit-pay-header">
                    <div class="credit-pay-name">${credit.name}</div>
                    <div class="credit-pay-rate">${rateDisplay}</div>
                </div>
                
                <div class="credit-pay-stats">
                    <div class="pay-stat">
                        <div class="pay-stat-label">Остаток долга</div>
                        <div class="pay-stat-value danger">${formatMoney(credit.remaining_amount)}</div>
                    </div>
                    <div class="pay-stat">
                        <div class="pay-stat-label">Ежемесячный платёж</div>
                        <div class="pay-stat-value">${formatMoney(credit.monthly_payment)}</div>
                    </div>
                    <div class="pay-stat">
                        <div class="pay-stat-label">Осталось месяцев</div>
                        <div class="pay-stat-value">${credit.remaining_months}</div>
                    </div>
                    <div class="pay-stat">
                        <div class="pay-stat-label">Платежей внесено</div>
                        <div class="pay-stat-value success">${credit.payments_made} из ${credit.term_months}</div>
                    </div>
                </div>
            </div>
            
            <!-- Форма платежа -->
            <div class="form-group">
                <label class="form-label">Сумма платежа *</label>
                <input type="number" class="form-input" name="amount" step="0.01" required 
                       value="${isExtra ? '' : credit.monthly_payment}" id="payAmount">
                ${!isExtra ? `
                    <div class="form-hint">
                        <button type="button" class="btn btn-sm btn-link" onclick="document.getElementById('payAmount').value=${credit.monthly_payment}">
                            Ежемесячный платёж
                        </button>
                        <button type="button" class="btn btn-sm btn-link" onclick="document.getElementById('payAmount').value=${credit.remaining_amount}">
                            Весь остаток
                        </button>
                    </div>
                ` : ''}
            </div>
            
            <div class="form-group">
                <label class="form-label">Дата платежа</label>
                <input type="date" class="form-input" name="date" value="${today}">
                <div class="form-hint">Можно указать любую дату, включая выходные</div>
            </div>
            
            ${isExtra ? `
                <div class="form-group">
                    <label class="form-label">Что уменьшить?</label>
                    <div class="reduce-options">
                        <label class="reduce-option active" data-reduce="term">
                            <input type="radio" name="reduce_type" value="term" checked>
                            <div class="reduce-option-content">
                                <div class="reduce-option-icon">${svgIcon('calendar','icon-sm')}</div>
                                <div class="reduce-option-title">Уменьшить срок</div>
                                <div class="reduce-option-desc">Быстрее погасите, больше сэкономите на процентах</div>
                            </div>
                        </label>
                        <label class="reduce-option" data-reduce="payment">
                            <input type="radio" name="reduce_type" value="payment">
                            <div class="reduce-option-content">
                                <div class="reduce-option-icon">${svgIcon('money','icon-sm')}</div>
                                <div class="reduce-option-title">Уменьшить платёж</div>
                                <div class="reduce-option-desc">Меньше ежемесячная нагрузка на бюджет</div>
                            </div>
                        </label>
                    </div>
                </div>
                
                <!-- Предварительный расчёт -->
                <div class="early-payment-preview" id="earlyPaymentPreview">
                    <div class="preview-title">${svgIcon('bar-chart','icon-sm')} Результат досрочного погашения</div>
                    <div class="preview-content" id="previewContent">
                        Введите сумму для расчёта
                    </div>
                </div>
            ` : ''}
            
            <div class="form-group">
                <label class="form-label">Комментарий</label>
                <input type="text" class="form-input" name="notes" placeholder="Необязательно">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn ${isExtra ? 'btn-success' : 'btn-primary'}">
                    ${isExtra ? `${svgIcon('rocket','icon-sm')} Погасить досрочно` : `${svgIcon('credit-card','icon-sm')} Внести платёж`}
                </button>
            </div>
        </form>
    `);
    
    // Обработка выбора типа уменьшения
    if (isExtra) {
        document.querySelectorAll('.reduce-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.reduce-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                option.querySelector('input').checked = true;
                updateEarlyPaymentPreview(credit);
            });
        });
        
        // Обновление предпросмотра при вводе суммы
        document.getElementById('payAmount').addEventListener('input', () => {
            updateEarlyPaymentPreview(credit);
        });
    }
    
    document.getElementById('payCreditForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            amount: parseFloat(formData.get('amount')),
            date: formData.get('date'),
            is_extra: isExtra,
            reduce_type: formData.get('reduce_type') || 'term',
            notes: formData.get('notes') || ''
        };
        
        try {
            const result = await API.credits.pay(creditId, data);
            closeModal();
            
            let message = 'Платёж внесён';
            if (isExtra && result.months_reduced > 0) {
                message = `Платёж внесён! Срок сокращён на ${result.months_reduced} мес.`;
            }
            
            showToast(message, 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка платежа', 'error');
        }
    });
}

// Функция расчёта предпросмотра досрочного погашения
function updateEarlyPaymentPreview(credit) {
    const amount = parseFloat(document.getElementById('payAmount')?.value) || 0;
    const reduceType = document.querySelector('input[name="reduce_type"]:checked')?.value || 'term';
    const preview = document.getElementById('previewContent');
    
    if (!preview || amount <= 0) {
        if (preview) preview.innerHTML = 'Введите сумму для расчёта';
        return;
    }
    
    const rate = credit.interest_rate / 100 / 12;
    const newRemaining = credit.remaining_amount - amount;
    
    if (newRemaining <= 0) {
        preview.innerHTML = `
            <div class="preview-result success">
                <div class="preview-icon">${svgIcon('party')}</div>
                <div class="preview-text">Кредит будет полностью погашен!</div>
            </div>
        `;
        return;
    }
    
    if (reduceType === 'term') {
        // Расчёт нового срока
        let newMonths = credit.remaining_months;
        if (rate > 0 && credit.monthly_payment > newRemaining * rate) {
            newMonths = Math.ceil(
                -Math.log(1 - (newRemaining * rate / credit.monthly_payment)) / Math.log(1 + rate)
            );
        } else {
            newMonths = Math.ceil(newRemaining / credit.monthly_payment);
        }
        
        const monthsSaved = credit.remaining_months - newMonths;
        
        // Расчёт экономии на процентах
        let oldInterest = 0;
        let temp = credit.remaining_amount;
        for (let i = 0; i < credit.remaining_months && temp > 0; i++) {
            const int = temp * rate;
            oldInterest += int;
            temp -= (credit.monthly_payment - int);
        }
        
        let newInterest = 0;
        temp = newRemaining;
        for (let i = 0; i < newMonths && temp > 0; i++) {
            const int = temp * rate;
            newInterest += int;
            temp -= (credit.monthly_payment - int);
        }
        
        const interestSaved = oldInterest - newInterest;
        
        preview.innerHTML = `
            <div class="preview-grid">
                <div class="preview-item">
                    <div class="preview-label">Новый срок</div>
                    <div class="preview-value">${newMonths} мес.</div>
                    <div class="preview-change success">-${monthsSaved} мес.</div>
                </div>
                <div class="preview-item">
                    <div class="preview-label">Экономия на %</div>
                    <div class="preview-value success">${formatMoney(interestSaved)}</div>
                </div>
                <div class="preview-item">
                    <div class="preview-label">Новый остаток</div>
                    <div class="preview-value">${formatMoney(newRemaining)}</div>
                </div>
            </div>
        `;
    } else {
        // Расчёт нового платежа
        let newPayment;
        if (rate > 0) {
            newPayment = newRemaining * (rate * Math.pow(1 + rate, credit.remaining_months)) / (Math.pow(1 + rate, credit.remaining_months) - 1);
        } else {
            newPayment = newRemaining / credit.remaining_months;
        }
        
        const paymentReduction = credit.monthly_payment - newPayment;
        
        preview.innerHTML = `
            <div class="preview-grid">
                <div class="preview-item">
                    <div class="preview-label">Новый платёж</div>
                    <div class="preview-value">${formatMoney(newPayment)}</div>
                    <div class="preview-change success">-${formatMoney(paymentReduction)}</div>
                </div>
                <div class="preview-item">
                    <div class="preview-label">Срок</div>
                    <div class="preview-value">${credit.remaining_months} мес.</div>
                    <div class="preview-change">без изменений</div>
                </div>
                <div class="preview-item">
                    <div class="preview-label">Новый остаток</div>
                    <div class="preview-value">${formatMoney(newRemaining)}</div>
                </div>
            </div>
        `;
    }
}

// ----- БОНУСНАЯ КАРТА -----
function showBonusCardModal(id = null) {
    const card = id ? state.bonusCards.find(c => c.id === id) : null;
    const title = card ? 'Редактировать бонусную карту' : 'Новая бонусная карта';
    
    openModal(title, `
        <form id="bonusCardForm">
            <div class="form-group">
                <label class="form-label">Название карты *</label>
                <input type="text" class="form-input" name="name" required 
                       value="${card?.name || ''}" placeholder="Например: Пятёрочка">
            </div>
            
            <div class="form-group">
                <label class="form-label">Магазин / Сеть</label>
                <input type="text" class="form-input" name="store_name" 
                       value="${card?.store_name || ''}" placeholder="Название магазина">
            </div>
            
            <div class="form-group">
                <label class="form-label">Номер карты / Штрихкод *</label>
                <input type="text" class="form-input" name="card_number" required 
                       value="${card?.card_number || ''}" placeholder="1234567890123">
            </div>
            
            <div class="form-group">
                <label class="form-label">Тип штрихкода</label>
                <select class="form-select" name="barcode_type">
                    ${Object.entries(BARCODE_TYPES).map(([key, val]) => 
                        `<option value="${key}" ${card?.barcode_type === key ? 'selected' : ''}>${val.name} - ${val.description}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Баланс бонусов</label>
                <input type="number" class="form-input" name="bonus_balance" step="0.01" 
                       value="${card?.bonus_balance || 0}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Заметки</label>
                <input type="text" class="form-input" name="notes" 
                       value="${card?.notes || ''}" placeholder="Дополнительная информация">
            </div>
            
            <div class="form-group">
                <label class="form-label">Иконка</label>
                <div class="icon-picker">
                    ${BONUS_CARD_ICON_KEYS.map(key =>
                    `<div class="icon-option ${card?.icon === key ? 'selected' : ''}" data-icon="${key}">
                        ${svgIcon(key, 'icon-sm')}
                    </div>`
                    ).join('')}
                </div>
                <input type="hidden" name="icon" value="${card?.icon || 'ticket'}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Цвет</label>
                <div class="color-picker">
                    ${COLORS.slice(0, 12).map(color => 
                        `<div class="color-option ${card?.color === color ? 'selected' : ''}" data-color="${color}" style="background: ${color}"></div>`
                    ).join('')}
                </div>
                <input type="hidden" name="color" value="${card?.color || '#667eea'}">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">${card ? 'Сохранить' : 'Добавить'}</button>
            </div>
        </form>
    `);
    
    initPickers();
    
    document.getElementById('bonusCardForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.bonus_balance = parseFloat(data.bonus_balance) || 0;
        
        try {
            if (card) {
                await API.bonusCards.update(card.id, data);
                showToast('Бонусная карта обновлена', 'success');
            } else {
                await API.bonusCards.create(data);
                showToast('Бонусная карта добавлена', 'success');
            }
            closeModal();
            loadBonusCards();
        } catch (error) {
            showToast('Ошибка сохранения', 'error');
        }
    });
}

function showEditBonusCardModal(id) {
    showBonusCardModal(id);
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

function showEditMortgageModal(id) {
    const mortgage = state.mortgages.find(m => m.id === id);
    if (!mortgage) return;
    
    openModal('Редактировать ипотеку', `
        <form id="editMortgageForm">
            <div class="form-group">
                <label class="form-label">Название</label>
                <input type="text" class="form-input" name="name" value="${mortgage.name}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Адрес</label>
                <input type="text" class="form-input" name="property_address" value="${mortgage.property_address || ''}">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Стоимость недвижимости</label>
                    <input type="number" class="form-input" name="property_value" step="0.01" value="${mortgage.property_value}">
                </div>
                <div class="form-group">
                    <label class="form-label">Остаток долга</label>
                    <input type="number" class="form-input" name="remaining_amount" step="0.01" value="${mortgage.remaining_amount}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Ставка (%)</label>
                    <input type="number" class="form-input" name="interest_rate" step="0.1" value="${mortgage.interest_rate}">
                </div>
                <div class="form-group">
                    <label class="form-label">Ежемесячный платёж</label>
                    <input type="number" class="form-input" name="monthly_payment" step="0.01" value="${mortgage.monthly_payment}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Осталось месяцев</label>
                    <input type="number" class="form-input" name="remaining_months" value="${mortgage.remaining_months}">
                </div>
                <div class="form-group">
                    <label class="form-label">День платежа</label>
                    <input type="number" class="form-input" name="payment_day" min="1" max="31" value="${mortgage.payment_day}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Страховка (в год)</label>
                    <input type="number" class="form-input" name="insurance_yearly" step="0.01" value="${mortgage.insurance_yearly}">
                </div>
                <div class="form-group">
                    <label class="form-label">Налог (в год)</label>
                    <input type="number" class="form-input" name="property_tax_yearly" step="0.01" value="${mortgage.property_tax_yearly}">
                </div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Сохранить</button>
            </div>
        </form>
    `);
    
    document.getElementById('editMortgageForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        data.property_value = parseFloat(data.property_value);
        data.remaining_amount = parseFloat(data.remaining_amount);
        data.interest_rate = parseFloat(data.interest_rate);
        data.monthly_payment = parseFloat(data.monthly_payment);
        data.remaining_months = parseInt(data.remaining_months);
        data.payment_day = parseInt(data.payment_day);
        data.insurance_yearly = parseFloat(data.insurance_yearly);
        data.property_tax_yearly = parseFloat(data.property_tax_yearly);
        
        try {
            await API.mortgages.update(id, data);
            closeModal();
            showToast('Ипотека обновлена', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка обновления', 'error');
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
                        <button type="button" class="type-tab active" data-reduce="term">${svgIcon('calendar','icon-sm')} Срок (рекомендуется)</button>
                        <button type="button" class="type-tab" data-reduce="payment">${svgIcon('money','icon-sm')} Платёж</button>
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
    const today = getCurrentDate();
    
    const investmentAccounts = state.accounts.filter(a => a.is_investment || a.account_type === 'investment');
    
    if (investmentAccounts.length === 0) {
        showToast('Сначала создайте инвестиционный счёт', 'warning');
        if (confirm('Создать инвестиционный счёт сейчас?')) {
            showAccountModal();
        }
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
                           required placeholder="SBER" style="text-transform: uppercase;" ${investment ? 'readonly' : ''}>
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
                    <label class="form-label">${investment ? 'Текущее количество' : 'Количество'} *</label>
                    <input type="number" class="form-input" name="quantity" step="0.0001" 
                           value="${investment?.quantity || ''}" required ${investment ? 'readonly' : ''}>
                    ${investment ? '<div class="form-hint">Изменяется через покупку/продажу</div>' : ''}
                </div>
                <div class="form-group">
                    <label class="form-label">${investment ? 'Средняя цена' : 'Цена покупки'} *</label>
                    <input type="number" class="form-input" name="avg_buy_price" step="0.01" 
                           value="${investment?.avg_buy_price || ''}" required ${investment ? 'readonly' : ''}>
                    ${investment ? '<div class="form-hint">Рассчитывается автоматически</div>' : ''}
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Текущая цена</label>
                    <input type="number" class="form-input" name="current_price" step="0.01" 
                           value="${investment?.current_price || ''}" placeholder="Для расчёта прибыли">
                </div>
                <div class="form-group">
                    <label class="form-label">Валюта</label>
                        <select class="form-select" name="currency">
                        <option value="RUB" ${investment?.currency === 'RUB' ? 'selected' : ''}>RUB</option>
                        <option value="USD" ${investment?.currency === 'USD' ? 'selected' : ''}>USD</option>
                        <option value="EUR" ${investment?.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                        <option value="CNY" ${investment?.currency === 'CNY' ? 'selected' : ''}>CNY</option>
                        </select>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Сектор</label>
                <input type="text" class="form-input" name="sector" value="${investment?.sector || ''}" 
                       placeholder="Финансы, IT, Энергетика...">
            </div>
            
            ${!investment ? `
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Комиссия</label>
                        <input type="number" class="form-input" name="commission" step="0.01" value="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Дата покупки</label>
                        <input type="date" class="form-input" name="date" value="${today}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Заметка</label>
                    <input type="text" class="form-input" name="notes" placeholder="Комментарий к покупке">
                </div>
                
                <div id="investmentTotal" style="background: var(--gray-100); padding: 16px; border-radius: var(--radius); margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Сумма покупки:</span>
                        <span id="investmentSum">0 ₽</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>С комиссией:</span>
                        <strong id="investmentTotalSum">0 ₽</strong>
                    </div>
                </div>
            ` : `
                <div class="form-group">
                    <label class="form-label">Получено дивидендов</label>
                    <input type="number" class="form-input" name="dividends_received" step="0.01" 
                           value="${investment?.dividends_received || 0}" readonly>
                    <div class="form-hint">Добавляйте дивиденды через кнопку "Дивиденд"</div>
                </div>
            `}
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">${investment ? 'Сохранить' : 'Добавить'}</button>
            </div>
        </form>
    `);
    
    // Расчёт суммы для новой инвестиции
    if (!investment) {
        const updateTotal = () => {
            const qty = parseFloat(document.querySelector('input[name="quantity"]')?.value) || 0;
            const price = parseFloat(document.querySelector('input[name="avg_buy_price"]')?.value) || 0;
            const commission = parseFloat(document.querySelector('input[name="commission"]')?.value) || 0;
            const sum = qty * price;
            const total = sum + commission;
            
            const sumEl = document.getElementById('investmentSum');
            const totalEl = document.getElementById('investmentTotalSum');
            if (sumEl) sumEl.textContent = formatMoney(sum);
            if (totalEl) totalEl.textContent = formatMoney(total);
        };
        
        document.querySelector('input[name="quantity"]')?.addEventListener('input', updateTotal);
        document.querySelector('input[name="avg_buy_price"]')?.addEventListener('input', updateTotal);
        document.querySelector('input[name="commission"]')?.addEventListener('input', updateTotal);
    }
    
    document.getElementById('investmentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        if (investment) {
            // Редактирование - только обновляем разрешённые поля
            const updateData = {
                name: data.name,
                asset_type: data.asset_type,
                current_price: parseFloat(data.current_price) || investment.current_price,
                currency: data.currency,
                sector: data.sector
            };
            
            try {
                await API.investments.update(investment.id, updateData);
                showToast('Инвестиция обновлена', 'success');
                closeModal();
                loadAllData();
            } catch (error) {
                showToast('Ошибка сохранения', 'error');
            }
        } else {
            // Новая инвестиция
            data.account_id = parseInt(data.account_id);
            data.ticker = data.ticker.toUpperCase();
            data.quantity = parseFloat(data.quantity);
            data.avg_buy_price = parseFloat(data.avg_buy_price);
            data.current_price = parseFloat(data.current_price) || data.avg_buy_price;
            data.commission = parseFloat(data.commission) || 0;
            
            try {
                await API.investments.create(data);
                showToast('Инвестиция добавлена', 'success');
                closeModal();
                loadAllData();
            } catch (error) {
                showToast('Ошибка добавления', 'error');
            }
        }
    });
}

function showBuyInvestmentModal(id) {
    const investment = state.investments.find(i => i.id === id);
    if (!investment) return;
    
    const today = getCurrentDate();
    
    openModal(`${svgIcon('trending-up','icon-sm')} Купить ${investment.ticker}`, `
        <form id="buyInvestmentForm">
            <div style="background: var(--gray-100); padding: 16px; border-radius: var(--radius); margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 20px; font-weight: 700;">${investment.ticker}</div>
                        <div style="color: var(--gray-500);">${investment.name}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 13px; color: var(--gray-500);">Текущая позиция</div>
                        <div style="font-weight: 600;">${investment.quantity} шт. × ${formatMoney(investment.avg_buy_price)}</div>
                    </div>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Количество *</label>
                    <input type="number" class="form-input" name="quantity" step="0.0001" required min="0.0001">
                </div>
                <div class="form-group">
                    <label class="form-label">Цена за шт. *</label>
                    <input type="number" class="form-input" name="price" step="0.01" required value="${investment.current_price}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Комиссия</label>
                    <input type="number" class="form-input" name="commission" step="0.01" value="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Дата</label>
                    <input type="date" class="form-input" name="date" value="${today}">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Заметка</label>
                <input type="text" class="form-input" name="notes" placeholder="Комментарий к покупке">
            </div>
            
            <div id="buyTotal" style="background: var(--success-light); padding: 16px; border-radius: var(--radius); margin-bottom: 20px; text-align: center;">
                <div style="font-size: 13px; color: var(--gray-600);">Итого к оплате</div>
                <div style="font-size: 24px; font-weight: 700; color: var(--success);">0 ₽</div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-success">Купить</button>
            </div>
        </form>
    `);
    
    // Расчёт итого
    const updateTotal = () => {
        const qty = parseFloat(document.querySelector('input[name="quantity"]').value) || 0;
        const price = parseFloat(document.querySelector('input[name="price"]').value) || 0;
        const commission = parseFloat(document.querySelector('input[name="commission"]').value) || 0;
        const total = qty * price + commission;
        document.getElementById('buyTotal').querySelector('div:last-child').textContent = formatMoney(total);
    };
    
    document.querySelector('input[name="quantity"]').addEventListener('input', updateTotal);
    document.querySelector('input[name="price"]').addEventListener('input', updateTotal);
    document.querySelector('input[name="commission"]').addEventListener('input', updateTotal);
    
    document.getElementById('buyInvestmentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            await API.investments.buy(id, {
                quantity: parseFloat(formData.get('quantity')),
                price: parseFloat(formData.get('price')),
                commission: parseFloat(formData.get('commission')) || 0,
                date: formData.get('date'),
                notes: formData.get('notes')
            });
            closeModal();
            showToast('Покупка добавлена', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка покупки', 'error');
        }
    });
}

function showSellInvestmentModal(id) {
    const investment = state.investments.find(i => i.id === id);
    if (!investment) return;
    
    const today = getCurrentDate();
    
    openModal(`${svgIcon('trending-down','icon-sm')} Продать ${investment.ticker}`, `
        <form id="sellInvestmentForm">
            <div style="background: var(--gray-100); padding: 16px; border-radius: var(--radius); margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 20px; font-weight: 700;">${investment.ticker}</div>
                        <div style="color: var(--gray-500);">${investment.name}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 13px; color: var(--gray-500);">Доступно</div>
                        <div style="font-weight: 600;">${investment.quantity} шт.</div>
                        <div style="font-size: 12px; color: var(--gray-500);">Ср. цена: ${formatMoney(investment.avg_buy_price)}</div>
                    </div>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Количество *</label>
                    <input type="number" class="form-input" name="quantity" step="0.0001" required 
                           min="0.0001" max="${investment.quantity}">
                    <button type="button" class="btn btn-sm btn-link" style="margin-top: 4px;"
                            onclick="document.querySelector('input[name=quantity]').value=${investment.quantity}">
                        Продать всё
                    </button>
                </div>
                <div class="form-group">
                    <label class="form-label">Цена за шт. *</label>
                    <input type="number" class="form-input" name="price" step="0.01" required value="${investment.current_price}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Комиссия</label>
                    <input type="number" class="form-input" name="commission" step="0.01" value="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Дата</label>
                    <input type="date" class="form-input" name="date" value="${today}">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Заметка</label>
                <input type="text" class="form-input" name="notes" placeholder="Комментарий к продаже">
            </div>
            
            <div id="sellResult" style="padding: 16px; border-radius: var(--radius); margin-bottom: 20px; text-align: center;">
                <div style="display: flex; justify-content: space-around;">
                    <div>
                        <div style="font-size: 13px; color: var(--gray-600);">Получите</div>
                        <div id="sellTotal" style="font-size: 20px; font-weight: 700;">0 ₽</div>
                    </div>
                    <div>
                        <div style="font-size: 13px; color: var(--gray-600);">Прибыль</div>
                        <div id="sellProfit" style="font-size: 20px; font-weight: 700;">0 ₽</div>
                    </div>
                </div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-warning">Продать</button>
            </div>
        </form>
    `);
    
    const updateResult = () => {
        const qty = parseFloat(document.querySelector('input[name="quantity"]').value) || 0;
        const price = parseFloat(document.querySelector('input[name="price"]').value) || 0;
        const commission = parseFloat(document.querySelector('input[name="commission"]').value) || 0;
        const total = qty * price - commission;
        const profit = (price - investment.avg_buy_price) * qty - commission;
        
        document.getElementById('sellTotal').textContent = formatMoney(total);
        const profitEl = document.getElementById('sellProfit');
        profitEl.textContent = `${profit >= 0 ? '+' : ''}${formatMoney(profit)}`;
        profitEl.style.color = profit >= 0 ? 'var(--success)' : 'var(--danger)';
        
        document.getElementById('sellResult').style.background = profit >= 0 ? 'var(--success-light)' : 'var(--danger-light)';
    };
    
    document.querySelector('input[name="quantity"]').addEventListener('input', updateResult);
    document.querySelector('input[name="price"]').addEventListener('input', updateResult);
    document.querySelector('input[name="commission"]').addEventListener('input', updateResult);
    updateResult();
    
    document.getElementById('sellInvestmentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            await API.investments.sell(id, {
                quantity: parseFloat(formData.get('quantity')),
                price: parseFloat(formData.get('price')),
                commission: parseFloat(formData.get('commission')) || 0,
                date: formData.get('date'),
                notes: formData.get('notes')
            });
            closeModal();
            showToast('Продажа выполнена', 'success');
            loadAllData();
        } catch (error) {
            showToast(error.message || 'Ошибка продажи', 'error');
        }
    });
}

function showDividendModal(id) {
    const investment = state.investments.find(i => i.id === id);
    if (!investment) return;
    
    const today = getCurrentDate();
    
    openModal(`${svgIcon('money','icon-sm')} Дивиденд ${investment.ticker}`, `
        <form id="dividendForm">
            <div style="background: var(--warning-light); padding: 16px; border-radius: var(--radius); margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 20px; font-weight: 700;">${investment.ticker}</div>
                        <div style="color: var(--gray-600);">${investment.name}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 13px; color: var(--gray-600);">Уже получено</div>
                        <div style="font-weight: 600; color: var(--success);">${formatMoney(investment.dividends_received || 0)}</div>
                    </div>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Сумма дивидендов *</label>
                    <input type="number" class="form-input" name="amount" step="0.01" required min="0.01">
                </div>
                <div class="form-group">
                    <label class="form-label">Удержанный налог</label>
                    <input type="number" class="form-input" name="tax" step="0.01" value="0">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Дата выплаты</label>
                <input type="date" class="form-input" name="date" value="${today}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Заметка</label>
                <input type="text" class="form-input" name="notes" placeholder="Например: за Q3 2024">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-warning">Добавить дивиденд</button>
            </div>
        </form>
    `);
    
    document.getElementById('dividendForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            await API.investments.dividend(id, {
                amount: parseFloat(formData.get('amount')),
                tax: parseFloat(formData.get('tax')) || 0,
                date: formData.get('date'),
                notes: formData.get('notes')
            });
            closeModal();
            showToast('Дивиденд добавлен', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка добавления', 'error');
        }
    });
}

async function deleteInvestmentTransaction(id) {
    if (!confirm('Удалить эту операцию? Позиция будет пересчитана.')) return;
    
    try {
        await API.investments.deleteTransaction(id);
        showToast('Операция удалена', 'success');
        loadAllData();
    } catch (error) {
        showToast('Ошибка удаления', 'error');
    }
}

// ----- НАЛОГИ -----
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
            loadTaxes();
        } catch (error) {
            showToast('Ошибка добавления', 'error');
        }
    });
}

function showEditTaxModal(id) {
    const tax = state.taxes?.payments.find(t => t.id === id);
    if (!tax) return;
    
    openModal('Редактировать налог', `
        <form id="editTaxForm">
            <div class="form-group">
                <label class="form-label">Тип налога</label>
                <select class="form-select" name="tax_type">
                    ${Object.entries(TAX_TYPES).map(([key, val]) => 
                        `<option value="${key}" ${tax.tax_type === key ? 'selected' : ''}>${val.icon} ${val.name}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Сумма</label>
                <input type="number" class="form-input" name="amount" step="0.01" value="${tax.amount}">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Период с</label>
                    <input type="date" class="form-input" name="period_start" value="${tax.period_start}">
                </div>
                <div class="form-group">
                    <label class="form-label">Период по</label>
                    <input type="date" class="form-input" name="period_end" value="${tax.period_end}">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Срок уплаты</label>
                <input type="date" class="form-input" name="due_date" value="${tax.due_date}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Описание</label>
                <input type="text" class="form-input" name="description" value="${tax.description || ''}">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Сохранить</button>
            </div>
        </form>
    `);
    
    document.getElementById('editTaxForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.amount = parseFloat(data.amount);
        
        try {
            await API.taxes.update(id, data);
            closeModal();
            showToast('Налог обновлён', 'success');
            loadTaxes();
        } catch (error) {
            showToast('Ошибка обновления', 'error');
        }
    });
}

async function payTax(id) {
    if (!confirm('Отметить налог как оплаченный?')) return;
    
    try {
        await API.taxes.pay(id);
        showToast('Налог оплачен', 'success');
        loadTaxes();
    } catch (error) {
        showToast('Ошибка', 'error');
    }
}

async function deleteTax(id) {
    if (!confirm('Удалить налоговый платёж?')) return;
    
    try {
        await API.taxes.delete(id);
        showToast('Налог удалён', 'success');
        loadTaxes();
    } catch (error) {
        showToast('Ошибка удаления', 'error');
    }
}

async function transferTaxReserve(accountId) {
    const account = state.accounts.find(a => a.id === accountId);
    if (!account || !account.linked_tax_account_id) {
        showToast('Не указан счёт для перевода налогов', 'warning');
        return;
    }
    
    if (!confirm('Перевести накопленный налог на резервный счёт?')) return;
    
    try {
        await API.taxes.transfer({
            business_account_id: accountId,
            tax_account_id: account.linked_tax_account_id
        });
        showToast('Налог переведён', 'success');
        loadAllData();
    } catch (error) {
        showToast('Ошибка перевода', 'error');
    }
}

// ----- МАГАЗИНЫ -----
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
                    ${STORE_ICON_KEYS.map(key =>
                    `<div class="icon-option" data-icon="${key}">
                        ${svgIcon(key, 'icon-sm')}
                    </div>`
                    ).join('')}
                </div>
                <input type="hidden" name="icon" value="store">
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

function showEditStoreModal(id) {
    const store = state.stores.find(s => s.id === id);
    if (!store) return;
    
    openModal('Редактировать магазин', `
        <form id="editStoreForm">
            <div class="form-group">
                <label class="form-label">Название</label>
                <input type="text" class="form-input" name="name" value="${store.name}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Тип магазина</label>
                <select class="form-select" name="store_type">
                    ${Object.entries(STORE_TYPES).map(([key, val]) => 
                        `<option value="${key}" ${store.store_type === key ? 'selected' : ''}>${val.icon} ${val.name}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Адрес</label>
                <input type="text" class="form-input" name="address" value="${store.address || ''}">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Сохранить</button>
            </div>
        </form>
    `);
    
    document.getElementById('editStoreForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        try {
            await API.stores.update(id, data);
            closeModal();
            showToast('Магазин обновлён', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка обновления', 'error');
        }
    });
}

// ----- ТОВАРЫ -----
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
                    <option value="dairy">Молочные</option>
                    <option value="meat">Мясо</option>
                    <option value="bread">Хлеб</option>
                    <option value="vegetables">Овощи</option>
                    <option value="fruits">Фрукты</option>
                    <option value="drinks">Напитки</option>
                    <option value="other">Другое</option>
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
                    ${PRODUCT_ICON_KEYS.map(key =>
                    `<div class="icon-option" data-icon="${key}">
                        ${svgIcon(key, 'icon-sm')}
                    </div>`
                    ).join('')}
                </div>
                <input type="hidden" name="icon" value="box">
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

function showEditProductModal(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    
    openModal('Редактировать товар', `
        <form id="editProductForm">
            <div class="form-group">
                <label class="form-label">Название</label>
                <input type="text" class="form-input" name="name" value="${product.name}">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Категория</label>
                    <select class="form-select" name="category">
                        <option value="dairy" ${product.category === 'dairy' ? 'selected' : ''}>Молочные</option>
                        <option value="meat" ${product.category === 'meat' ? 'selected' : ''}>Мясо</option>
                        <option value="bread" ${product.category === 'bread' ? 'selected' : ''}>Хлеб</option>
                        <option value="vegetables" ${product.category === 'vegetables' ? 'selected' : ''}>Овощи</option>
                        <option value="fruits" ${product.category === 'fruits' ? 'selected' : ''}>Фрукты</option>
                        <option value="drinks" ${product.category === 'drinks' ? 'selected' : ''}>Напитки</option>
                        <option value="other" ${product.category === 'other' ? 'selected' : ''}>Другое</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Единица</label>
                    <select class="form-select" name="unit">
                        ${UNITS.map(u => `<option value="${u}" ${product.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Сохранить</button>
            </div>
        </form>
    `);
    
    document.getElementById('editProductForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        try {
            await API.products.update(id, data);
            closeModal();
            showToast('Товар обновлён', 'success');
            loadAllData();
        } catch (error) {
            showToast('Ошибка обновления', 'error');
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
                    <input type="checkbox" name="is_sale"> ${svgIcon('flame','icon-sm')} Акционная цена
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

async function deleteCreditCard(id) {
    if (!confirm('Удалить кредитную карту? Все операции по этой карте также будут удалены.')) return;
    
    try {
        await API.creditCards.delete(id);
        showToast('Кредитная карта удалена', 'success');
        loadAllData();
    } catch (error) {
        showToast('Ошибка удаления', 'error');
    }
}

async function deleteCategory(id) {
    if (!confirm('Удалить категорию? Операции останутся, но будут без категории.')) return;
    
    try {
        await API.categories.delete(id);
        showToast('Категория удалена', 'success');
        loadAllData();
    } catch (error) {
        showToast('Ошибка удаления', 'error');
    }
}

async function deleteTransaction(id) {
    if (!confirm('Удалить операцию? Баланс счёта будет скорректирован.')) return;
    
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

async function deleteInvestment(id) {
    if (!confirm('Удалить инвестицию?')) return;
    
    try {
        await API.investments.delete(id);
        showToast('Инвестиция удалена', 'success');
        loadAllData();
    } catch (error) {
        showToast('Ошибка удаления', 'error');
    }
}

async function deleteStore(id) {
    if (!confirm('Удалить магазин? Цены товаров в этом магазине также будут удалены.')) return;
    
    try {
        await API.stores.delete(id);
        showToast('Магазин удалён', 'success');
        loadAllData();
    } catch (error) {
        showToast('Ошибка удаления', 'error');
    }
}

async function deleteProduct(id) {
    if (!confirm('Удалить товар?')) return;
    
    try {
        await API.products.delete(id);
        showToast('Товар удалён', 'success');
        loadAllData();
    } catch (error) {
        showToast('Ошибка удаления', 'error');
    }
}

async function deleteBonusCard(id) {
    if (!confirm('Удалить бонусную карту?')) return;
    
    try {
        await API.bonusCards.delete(id);
        showToast('Бонусная карта удалена', 'success');
        loadBonusCards();
    } catch (error) {
        showToast('Ошибка удаления', 'error');
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
            document.getElementById(`calc-${tab.dataset.calc}`)?.classList.add('active');
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
    const startDate = document.getElementById('calcStartDate')?.value;
    
    if (!amount || !rate || !term) {
        showToast('Заполните сумму, ставку и срок', 'warning');
        return;
    }
    
    try {
        const result = await API.calculator.credit({
            amount, 
            interest_rate: rate, 
            term_months: term, 
            extra_payment: extra,
            start_date: startDate
        });
        
        const container = document.getElementById('calcCreditResult');
        
        // Определяем есть ли уже оплаченные месяцы
        const hasPaidMonths = result.months_passed > 0;
        
        container.innerHTML = `
            <div class="calc-result-header">${svgIcon('bar-chart','icon-sm')} Результаты расчёта</div>
            
            <div class="calc-result-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
                <div class="calc-result-card" style="background: var(--gray-100); padding: 16px; border-radius: var(--radius);">
                    <div style="font-size: 12px; color: var(--gray-500);">Ежемесячный платёж</div>
                    <div style="font-size: 24px; font-weight: 700; color: var(--primary);">${formatMoney(result.monthly_payment)}</div>
                </div>
                <div class="calc-result-card" style="background: var(--danger-light); padding: 16px; border-radius: var(--radius);">
                    <div style="font-size: 12px; color: var(--gray-500);">Переплата</div>
                    <div style="font-size: 24px; font-weight: 700; color: var(--danger);">${formatMoney(result.overpayment)}</div>
                </div>
            </div>
            
            ${hasPaidMonths ? `
                <div class="calc-paid-info" style="background: var(--success-light); padding: 16px; border-radius: var(--radius); margin-bottom: 20px;">
                    <div style="font-weight: 600; margin-bottom: 8px;">${svgIcon('check-circle','icon-sm')} Уже оплачено</div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                        <div>
                            <div style="font-size: 12px; color: var(--gray-600);">Месяцев</div>
                            <div style="font-size: 18px; font-weight: 600;">${result.months_passed} из ${term}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: var(--gray-600);">Основной долг</div>
                            <div style="font-size: 18px; font-weight: 600;">${formatMoney(result.paid_principal)}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: var(--gray-600);">Проценты</div>
                            <div style="font-size: 18px; font-weight: 600;">${formatMoney(result.paid_interest)}</div>
                        </div>
                    </div>
                </div>
                
                <div class="calc-current-info" style="background: var(--warning-light); padding: 16px; border-radius: var(--radius); margin-bottom: 20px;">
                    <div style="font-weight: 600; margin-bottom: 8px;">${svgIcon('map-pin','icon-sm')} Текущее состояние</div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                        <div>
                            <div style="font-size: 12px; color: var(--gray-600);">Остаток долга</div>
                            <div style="font-size: 24px; font-weight: 700;">${formatMoney(result.current_remaining)}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: var(--gray-600);">Осталось месяцев</div>
                            <div style="font-size: 24px; font-weight: 700;">${result.remaining_months}</div>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <div class="calc-result-item" style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--gray-200);">
                <span class="calc-result-label">Общая сумма выплат</span>
                <span class="calc-result-value">${formatMoney(result.total_payment)}</span>
            </div>
            
            ${result.strategies.with_extra ? `
                <div class="calc-comparison" style="margin-top: 20px; padding: 20px; background: linear-gradient(135deg, var(--success-light) 0%, #d1fae5 100%); border-radius: var(--radius);">
                    <div class="calc-comparison-title" style="font-weight: 600; margin-bottom: 12px;">${svgIcon('info','icon-sm')} С досрочными платежами +${formatMoney(extra)}/мес.</div>
                    <div class="calc-comparison-options" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                        <div class="calc-option" style="text-align: center;">
                            <div style="font-size: 12px; color: var(--gray-600);">Новый срок</div>
                            <div style="font-size: 20px; font-weight: 700;">${result.strategies.with_extra.term_months} мес.</div>
                            <div style="font-size: 13px; color: var(--success);">-${result.strategies.with_extra.months_saved} мес.</div>
                        </div>
                        <div class="calc-option" style="text-align: center;">
                            <div style="font-size: 12px; color: var(--gray-600);">Экономия</div>
                            <div style="font-size: 20px; font-weight: 700; color: var(--success);">${formatMoney(result.strategies.with_extra.savings)}</div>
                        </div>
                        <div class="calc-option" style="text-align: center;">
                            <div style="font-size: 12px; color: var(--gray-600);">Переплата</div>
                            <div style="font-size: 20px; font-weight: 700;">${formatMoney(result.strategies.with_extra.overpayment)}</div>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <!-- График платежей -->
            <div style="margin-top: 20px;">
                <div style="font-weight: 600; margin-bottom: 12px;">${svgIcon('calendar','icon-sm')} График платежей</div>
                <div style="max-height: 300px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <thead style="position: sticky; top: 0; background: white;">
                            <tr style="border-bottom: 2px solid var(--gray-200);">
                                <th style="padding: 8px; text-align: left;">Месяц</th>
                                <th style="padding: 8px; text-align: right;">Платёж</th>
                                <th style="padding: 8px; text-align: right;">Основной</th>
                                <th style="padding: 8px; text-align: right;">Проценты</th>
                                <th style="padding: 8px; text-align: right;">Остаток</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${result.schedule.map(s => `
                                <tr style="border-bottom: 1px solid var(--gray-100); ${s.is_paid ? 'background: var(--success-light); opacity: 0.7;' : ''}">
                                    <td style="padding: 8px;">
                                        ${s.month}
                                        ${s.is_paid ? `<span style="color: var(--success); margin-left: 4px;">${svgIcon('check','icon-sm')}</span>` : ''}
                                    </td>
                                    <td style="padding: 8px; text-align: right;">${formatMoney(s.payment)}</td>
                                    <td style="padding: 8px; text-align: right;">${formatMoney(s.principal)}</td>
                                    <td style="padding: 8px; text-align: right; color: var(--danger);">${formatMoney(s.interest)}</td>
                                    <td style="padding: 8px; text-align: right; font-weight: 600;">${formatMoney(s.remaining)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
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
    
    if (!remaining || !months || !payment || !earlyAmount) {
        showToast('Заполните все обязательные поля', 'warning');
        return;
    }
    
    const monthlyRate = rate / 100 / 12;
    
    // ========== БЕЗ ДОСРОЧНОГО ПОГАШЕНИЯ ==========
    let totalWithout = 0;
    let interestWithout = 0;
    let tempRemaining = remaining;
    
    for (let i = 0; i < months && tempRemaining > 0; i++) {
        const interest = tempRemaining * monthlyRate;
        const principal = Math.min(payment - interest, tempRemaining);
        interestWithout += interest;
        totalWithout += payment;
        tempRemaining -= principal;
    }
    
    // ========== УМЕНЬШЕНИЕ СРОКА ==========
    const newRemaining = remaining - earlyAmount;
    let monthsReduced = 0;
    let interestReduceTerm = 0;
    tempRemaining = newRemaining;
    
    while (tempRemaining > 0.01 && monthsReduced < months * 2) {
        const interest = tempRemaining * monthlyRate;
        const principal = payment - interest;
        if (principal <= 0) break;
        interestReduceTerm += interest;
        tempRemaining -= principal;
        monthsReduced++;
    }
    
    const monthsSaved = months - monthsReduced;
    const totalReduceTerm = payment * monthsReduced + earlyAmount;
    const savingsReduceTerm = (totalWithout - totalReduceTerm);
    
    // ========== УМЕНЬШЕНИЕ ПЛАТЕЖА ==========
    let newPayment;
    if (monthlyRate > 0) {
        newPayment = newRemaining * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    } else {
        newPayment = newRemaining / months;
    }
    
    let interestReducePayment = 0;
    tempRemaining = newRemaining;
    for (let i = 0; i < months && tempRemaining > 0; i++) {
        const interest = tempRemaining * monthlyRate;
        interestReducePayment += interest;
        tempRemaining -= (newPayment - interest);
    }
    
    const totalReducePayment = newPayment * months + earlyAmount;
    const savingsReducePayment = totalWithout - totalReducePayment;
    const paymentReduction = payment - newPayment;
    
    // ========== РЕНДЕР РЕЗУЛЬТАТА ==========
    const container = document.getElementById('calcEarlyResult');
    
    const betterOption = savingsReduceTerm > savingsReducePayment ? 'term' : 'payment';
    
    container.innerHTML = `
        <div class="early-calc-results">
            <!-- Текущая ситуация -->
            <div class="calc-result-card current">
                <div class="result-card-header">
                    <span class="result-card-icon">${svgIcon('bar-chart','icon-sm')}</span>
                    <span class="result-card-title">Без досрочного погашения</span>
                </div>
                <div class="result-card-body">
                    <div class="result-row">
                        <span>Осталось платить</span>
                        <span>${months} мес.</span>
                    </div>
                    <div class="result-row">
                        <span>Ежемесячный платёж</span>
                        <span>${formatMoney(payment)}</span>
                    </div>
                    <div class="result-row">
                        <span>Всего выплатите</span>
                        <span>${formatMoney(totalWithout)}</span>
                    </div>
                    <div class="result-row highlight">
                        <span>Переплата по процентам</span>
                        <span class="text-danger">${formatMoney(interestWithout)}</span>
                    </div>
                </div>
            </div>
            
            <!-- Вариант 1: Уменьшение срока -->
            <div class="calc-result-card option ${betterOption === 'term' ? 'recommended' : ''}">
                <div class="result-card-header">
                    <span class="result-card-icon">${svgIcon('calendar','icon-sm')}</span>
                    <span class="result-card-title">Уменьшить срок</span>
                    ${betterOption === 'term' ? '<span class="badge-recommended">Рекомендуем</span>' : ''}
                </div>
                <div class="result-card-body">
                    <div class="result-row">
                        <span>Новый срок</span>
                        <span><strong>${monthsReduced} мес.</strong> <span class="text-success">(-${monthsSaved})</span></span>
                    </div>
                    <div class="result-row">
                        <span>Платёж остаётся</span>
                        <span>${formatMoney(payment)}</span>
                    </div>
                    <div class="result-row">
                        <span>Всего выплатите</span>
                        <span>${formatMoney(totalReduceTerm)}</span>
                    </div>
                    <div class="result-row highlight">
                        <span>Экономия</span>
                        <span class="text-success">${formatMoney(savingsReduceTerm)}</span>
                    </div>
                </div>
                <div class="result-card-footer">
                    <div class="savings-breakdown">
                        <span>${svgIcon('info','icon-sm')} Вы сэкономите ${formatMoney(interestWithout - interestReduceTerm)} на процентах</span>
                    </div>
                </div>
            </div>
            
            <!-- Вариант 2: Уменьшение платежа -->
            <div class="calc-result-card option ${betterOption === 'payment' ? 'recommended' : ''}">
                <div class="result-card-header">
                    <span class="result-card-icon">${svgIcon('money','icon-sm')}</span>
                    <span class="result-card-title">Уменьшить платёж</span>
                    ${betterOption === 'payment' ? '<span class="badge-recommended">Рекомендуем</span>' : ''}
                </div>
                <div class="result-card-body">
                    <div class="result-row">
                        <span>Срок остаётся</span>
                        <span>${months} мес.</span>
                    </div>
                    <div class="result-row">
                        <span>Новый платёж</span>
                        <span><strong>${formatMoney(newPayment)}</strong> <span class="text-success">(-${formatMoney(paymentReduction)})</span></span>
                    </div>
                    <div class="result-row">
                        <span>Всего выплатите</span>
                        <span>${formatMoney(totalReducePayment)}</span>
                    </div>
                    <div class="result-row highlight">
                        <span>Экономия</span>
                        <span class="text-success">${formatMoney(savingsReducePayment)}</span>
                    </div>
                </div>
                <div class="result-card-footer">
                    <div class="savings-breakdown">
                        <span>${svgIcon('info','icon-sm')} Ежемесячно освободится ${formatMoney(paymentReduction)}</span>
                    </div>
                </div>
            </div>
            
            <!-- Итоговая рекомендация -->
            <div class="calc-recommendation">
                <div class="recommendation-icon">${betterOption === 'term' ? svgIcon('calendar','icon-sm') : svgIcon('money','icon-sm')}</div>
                <div class="recommendation-text">
                    <strong>Рекомендация:</strong> 
                    ${betterOption === 'term' 
                        ? `Уменьшайте срок! Вы сэкономите на ${formatMoney(savingsReduceTerm - savingsReducePayment)} больше и погасите кредит на ${monthsSaved} мес. раньше.`
                        : `Уменьшайте платёж! Это даст вам больше финансовой свободы — ${formatMoney(paymentReduction)} в месяц.`
                    }
                </div>
            </div>
        </div>
    `;
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function initPickers() {
    // Icon picker
    document.querySelectorAll('.icon-option').forEach(option => {
        option.addEventListener('click', () => {
            const picker = option.closest('.icon-picker') || option.closest('.form-group');
            picker.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            
            const input = picker.parentElement?.querySelector('input[name="icon"]') || 
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
            
            const input = picker.parentElement?.querySelector('input[name="color"]') || 
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