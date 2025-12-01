// frontend/js/utils.js

// Форматирование денег
function formatMoney(amount, currency = 'RUB') {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
}

// Форматирование даты
function formatDate(dateStr, options = {}) {
    const date = new Date(dateStr);
    const defaultOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...options
    };
    return date.toLocaleDateString('ru-RU', defaultOptions);
}

// Форматирование относительной даты
function formatRelativeDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((date - now) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'Сегодня';
    if (diff === 1) return 'Завтра';
    if (diff === -1) return 'Вчера';
    if (diff > 0 && diff <= 7) return `Через ${diff} дн.`;
    if (diff < 0 && diff >= -7) return `${Math.abs(diff)} дн. назад`;
    
    return formatDate(dateStr);
}

// Форматирование процентов
function formatPercent(value, decimals = 1) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

// Получение цвета для значения
function getValueColor(value, type = 'default') {
    if (type === 'profit') {
        return value >= 0 ? 'var(--success)' : 'var(--danger)';
    }
    if (type === 'change') {
        return value >= 0 ? 'var(--success)' : 'var(--danger)';
    }
    return 'var(--gray-900)';
}

// Debounce функция
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle функция
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Генерация уникального ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Получение текущей даты в формате YYYY-MM-DD
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

// Получение первого дня месяца
function getFirstDayOfMonth(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
}

// Получение последнего дня месяца
function getLastDayOfMonth(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
}

// Иконки
const ICONS = [
    '💰', '💵', '💴', '💶', '💷', '💳', '🏦', '🏧', '💎', '👛',
    '🛒', '🛍️', '🏠', '🏡', '🚗', '🚕', '🚌', '✈️', '🚀', '⛽',
    '🍔', '🍕', '🍽️', '☕', '🍺', '🍷', '🥗', '🍰', '🍦', '🥤',
    '🎬', '🎮', '🎵', '🎸', '🎭', '🎪', '🎯', '🎲', '🎳', '🎰',
    '📱', '💻', '📺', '🔌', '💡', '🚿', '🧹', '🛋️', '🛏️', '🚪',
    '👕', '👗', '👟', '👜', '💄', '💅', '💇', '👓', '⌚', '💍',
    '💊', '🏥', '💪', '🧘', '🏃', '🚴', '⚽', '🏀', '🎾', '🏊',
    '🎓', '📚', '✏️', '📝', '🎨', '🎹', '📷', '🔬', '💼', '📊',
    '🎁', '💐', '🎂', '🎄', '🎃', '❤️', '💕', '🐕', '🐈', '🐠',
    '👶', '👨‍👩‍👧', '👴', '👵', '🏋️', '🧳', '🏖️', '⛷️', '🎢', '🗺️',
    '📞', '📧', '🔒', '🔑', '⚙️', '🔧', '📦', '🏷️', '📋', '✅',
    '🎯', '🏆', '⭐', '🌟', '🔥', '💥', '✨', '🌈', '☀️', '🌙'
];

// Цвета
const COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
    '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#a855f7', '#d946ef', '#f43f5e', '#64748b', '#78716c'
];

// Типы счетов
const ACCOUNT_TYPES = {
    debit: { name: 'Дебетовая карта', icon: '💳' },
    credit_card: { name: 'Кредитная карта', icon: '💳' },
    cash: { name: 'Наличные', icon: '💵' },
    savings: { name: 'Накопительный', icon: '🐷' },
    business: { name: 'Бизнес (ИП)', icon: '🏢' },
    tax_reserve: { name: 'Резерв на налоги', icon: '🧾' },
    investment: { name: 'Инвестиционный', icon: '📈' }
};

// Типы кредитов
const CREDIT_TYPES = {
    consumer: { name: 'Потребительский', icon: '📋' },
    car: { name: 'Автокредит', icon: '🚗' },
    education: { name: 'Образовательный', icon: '🎓' },
    other: { name: 'Другой', icon: '📦' }
};

// Типы налогов
const TAX_TYPES = {
    usn: { name: 'УСН', icon: '🧾' },
    ndfl: { name: 'НДФЛ', icon: '💰' },
    property: { name: 'Имущественный', icon: '🏠' },
    transport: { name: 'Транспортный', icon: '🚗' },
    other: { name: 'Другой', icon: '📋' }
};

// Типы активов
const ASSET_TYPES = {
    stock: { name: 'Акция', icon: '📈' },
    bond: { name: 'Облигация', icon: '📜' },
    etf: { name: 'ETF', icon: '📊' },
    crypto: { name: 'Криптовалюта', icon: '₿' },
    other: { name: 'Другое', icon: '💎' }
};

// Типы магазинов
const STORE_TYPES = {
    grocery: { name: 'Продукты', icon: '🛒' },
    electronics: { name: 'Электроника', icon: '📱' },
    clothes: { name: 'Одежда', icon: '👕' },
    pharmacy: { name: 'Аптека', icon: '💊' },
    household: { name: 'Хозтовары', icon: '🧹' },
    other: { name: 'Другое', icon: '🏪' }
};

// Единицы измерения
const UNITS = ['шт', 'кг', 'г', 'л', 'мл', 'уп', 'м'];

// Показать toast уведомление
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Подтверждение действия
function confirm(message) {
    return window.confirm(message);
}

// Prompt для ввода
function prompt(message, defaultValue = '') {
    return window.prompt(message, defaultValue);
}