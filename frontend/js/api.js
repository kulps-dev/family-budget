// frontend/js/api.js

const API_URL = '/api';

// Базовая функция для API запросов
async function api(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Ошибка сервера');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// API модули
const API = {
    // Дашборд
    dashboard: {
        get: () => api('/dashboard')
    },
    
    // Счета
    accounts: {
        getAll: (type) => api(`/accounts${type ? `?type=${type}` : ''}`),
        create: (data) => api('/accounts', 'POST', data),
        update: (id, data) => api(`/accounts/${id}`, 'PUT', data),
        delete: (id) => api(`/accounts/${id}`, 'DELETE')
    },
    
    // Кредитные карты
    creditCards: {
        getAll: () => api('/credit-cards'),
        update: (id, data) => api(`/credit-cards/${id}`, 'PUT', data),
        delete: (id) => api(`/credit-cards/${id}`, 'DELETE'),
        pay: (id, data) => api(`/credit-cards/${id}/pay`, 'POST', data),
        updateLimit: (id, data) => api(`/credit-cards/${id}/update-limit`, 'PUT', data),
        updateDebt: (id, data) => api(`/credit-cards/${id}/update-debt`, 'PUT', data)
    },
    
    // Категории
    categories: {
        getAll: (type) => api(`/categories${type ? `?type=${type}` : ''}`),
        create: (data) => api('/categories', 'POST', data),
        update: (id, data) => api(`/categories/${id}`, 'PUT', data),
        delete: (id) => api(`/categories/${id}`, 'DELETE')
    },
    
    // Транзакции
    transactions: {
        getAll: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return api(`/transactions${query ? `?${query}` : ''}`);
        },
        create: (data) => api('/transactions', 'POST', data),
        update: (id, data) => api(`/transactions/${id}`, 'PUT', data),
        delete: (id) => api(`/transactions/${id}`, 'DELETE')
    },
    
    // Цели
    goals: {
        getAll: (showCompleted = false) => api(`/goals?show_completed=${showCompleted}`),
        create: (data) => api('/goals', 'POST', data),
        update: (id, data) => api(`/goals/${id}`, 'PUT', data),
        addAmount: (id, amount) => api(`/goals/${id}/add`, 'POST', { amount }),
        delete: (id) => api(`/goals/${id}`, 'DELETE')
    },
    
    // Кредиты
    credits: {
        getAll: () => api('/credits'),
        create: (data) => api('/credits', 'POST', data),
        update: (id, data) => api(`/credits/${id}`, 'PUT', data),
        pay: (id, data) => api(`/credits/${id}/pay`, 'POST', data),
        delete: (id) => api(`/credits/${id}`, 'DELETE')
    },
    
    // Ипотека
    mortgages: {
        getAll: () => api('/mortgages'),
        create: (data) => api('/mortgages', 'POST', data),
        update: (id, data) => api(`/mortgages/${id}`, 'PUT', data),
        pay: (id, data) => api(`/mortgages/${id}/pay`, 'POST', data),
        getPayments: (id) => api(`/mortgages/${id}/payments`),
        delete: (id) => api(`/mortgages/${id}`, 'DELETE')
    },
    
    // Калькулятор
    calculator: {
        credit: (data) => api('/calculator/credit', 'POST', data),
        mortgage: (data) => api('/calculator/mortgage', 'POST', data)
    },
    
    // Магазины
    stores: {
        getAll: () => api('/stores'),
        create: (data) => api('/stores', 'POST', data),
        update: (id, data) => api(`/stores/${id}`, 'PUT', data),
        delete: (id) => api(`/stores/${id}`, 'DELETE')
    },
    
    // Товары
    products: {
        getAll: () => api('/products'),
        create: (data) => api('/products', 'POST', data),
        update: (id, data) => api(`/products/${id}`, 'PUT', data),
        addPrice: (id, data) => api(`/products/${id}/prices`, 'POST', data),
        delete: (id) => api(`/products/${id}`, 'DELETE')
    },
    
    // Инвестиции
    investments: {
        getAll: (accountId) => api(`/investments${accountId ? `?account_id=${accountId}` : ''}`),
        getSummary: () => api('/investments/summary'),
        create: (data) => api('/investments', 'POST', data),
        update: (id, data) => api(`/investments/${id}`, 'PUT', data),
        buy: (id, data) => api(`/investments/${id}/buy`, 'POST', data),
        sell: (id, data) => api(`/investments/${id}/sell`, 'POST', data),
        dividend: (id, data) => api(`/investments/${id}/dividend`, 'POST', data),
        getTransactions: (id) => api(`/investments/${id}/transactions`),
        deleteTransaction: (id) => api(`/investments/transactions/${id}`, 'DELETE'),
        delete: (id) => api(`/investments/${id}`, 'DELETE')
    },
    
    // Налоги
    taxes: {
        getAll: (year) => api(`/taxes${year ? `?year=${year}` : ''}`),
        create: (data) => api('/taxes', 'POST', data),
        update: (id, data) => api(`/taxes/${id}`, 'PUT', data),
        delete: (id) => api(`/taxes/${id}`, 'DELETE'),
        pay: (id) => api(`/taxes/${id}/pay`, 'POST'),
        transfer: (data) => api('/taxes/transfer', 'POST', data)
    },
    
    // Бонусные карты
    bonusCards: {
        getAll: () => api('/bonus-cards'),
        create: (data) => api('/bonus-cards', 'POST', data),
        update: (id, data) => api(`/bonus-cards/${id}`, 'PUT', data),
        delete: (id) => api(`/bonus-cards/${id}`, 'DELETE')
    },
    
    // Статистика
    stats: {
        byCategory: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return api(`/stats/by-category${query ? `?${query}` : ''}`);
        },
        byStore: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return api(`/stats/by-store${query ? `?${query}` : ''}`);
        },
        trends: (months = 12) => api(`/stats/trends?months=${months}`)
    },
    
    // AI Аналитика
    ai: {
        analyze: (data) => api('/ai/analyze', 'POST', data),
        getTips: () => api('/ai/tips')
    },
    
    // Достижения
    achievements: {
        getAll: () => api('/achievements')
    }
};