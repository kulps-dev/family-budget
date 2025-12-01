// frontend/js/utils.js

// Форматирование денег
function formatMoney(amount, currency = '₽') {
    if (amount === null || amount === undefined) return `0 ${currency}`;
    
    const formatted = new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(Math.abs(amount));
    
    const sign = amount < 0 ? '-' : '';
    return `${sign}${formatted} ${currency}`;
}

// Форматирование даты
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
}

// Форматирование даты и времени
function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Получить текущую дату в формате YYYY-MM-DD
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

// Получить первый день месяца
function getFirstDayOfMonth() {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
}

// Получить последний день месяца
function getLastDayOfMonth() {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
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

// Показать toast уведомление
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Подтверждение действия
async function confirmAction(message, title = 'Подтверждение') {
    return new Promise((resolve) => {
        const result = confirm(message);
        resolve(result);
    });
}

// Константы
const ICONS = [
    '💰', '💳', '🏦', '💵', '💴', '💶', '💷', '🪙',
    '🛒', '🚗', '🏠', '💡', '💊', '🎬', '👕', '📚',
    '🍽️', '🎁', '📱', '💅', '👶', '🐕', '📞', '📦',
    '✈️', '🏖️', '🎯', '💻', '🎓', '💪', '💎', '🚀',
    '⭐', '🔥', '🎉', '🏆', '👑', '🌟', '💫', '🎊',
    '🏪', '🛍️', '🏬', '🏢', '🏥', '⛽', '🍞', '🥬',
    '🥩', '🧀', '🥛', '🍎', '🥤', '☕', '🍺', '🎫'
];

const COLORS = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
    '#fa709a', '#fee140', '#a8edea', '#fed6e3',
    '#5ee7df', '#b490ca', '#d299c2', '#fef9d7',
    '#4CAF50', '#2196F3', '#9C27B0', '#FF9800',
    '#F44336', '#E91E63', '#00BCD4', '#3F51B5',
    '#FF5722', '#8BC34A', '#607D8B', '#795548'
];

const ACCOUNT_TYPES = {
    'debit': { name: 'Дебетовая карта', icon: '💳' },
    'credit_card': { name: 'Кредитная карта', icon: '💳' },
    'cash': { name: 'Наличные', icon: '💵' },
    'savings': { name: 'Накопительный', icon: '🐷' },
    'business': { name: 'Бизнес (ИП)', icon: '🏢' },
    'tax_reserve': { name: 'Резерв на налоги', icon: '🧾' },
    'investment': { name: 'Инвестиционный', icon: '📈' }
};

const CREDIT_TYPES = {
    'consumer': { name: 'Потребительский', icon: '🛒' },
    'car': { name: 'Автокредит', icon: '🚗' },
    'education': { name: 'Образовательный', icon: '🎓' },
    'renovation': { name: 'На ремонт', icon: '🔨' },
    'other': { name: 'Другой', icon: '📋' }
};

const ASSET_TYPES = {
    'stock': { name: 'Акция', icon: '📈' },
    'bond': { name: 'Облигация', icon: '📄' },
    'etf': { name: 'ETF/Фонд', icon: '📊' },
    'crypto': { name: 'Криптовалюта', icon: '₿' },
    'currency': { name: 'Валюта', icon: '💱' },
    'gold': { name: 'Золото', icon: '🥇' },
    'other': { name: 'Другое', icon: '💎' }
};

const STORE_TYPES = {
    'grocery': { name: 'Продуктовый', icon: '🛒' },
    'supermarket': { name: 'Супермаркет', icon: '🏪' },
    'hypermarket': { name: 'Гипермаркет', icon: '🏬' },
    'pharmacy': { name: 'Аптека', icon: '💊' },
    'gas_station': { name: 'АЗС', icon: '⛽' },
    'electronics': { name: 'Электроника', icon: '📱' },
    'clothing': { name: 'Одежда', icon: '👕' },
    'online': { name: 'Онлайн', icon: '🌐' },
    'other': { name: 'Другой', icon: '🏪' }
};

const TAX_TYPES = {
    'usn': { name: 'УСН (упрощёнка)', icon: '📋' },
    'ndfl': { name: 'НДФЛ', icon: '💰' },
    'property': { name: 'Налог на имущество', icon: '🏠' },
    'transport': { name: 'Транспортный налог', icon: '🚗' },
    'land': { name: 'Земельный налог', icon: '🌍' },
    'other': { name: 'Другой', icon: '🧾' }
};

const BARCODE_TYPES = {
    'CODE128': { name: 'CODE128 (стандартный)', description: 'Универсальный штрихкод' },
    'EAN13': { name: 'EAN-13', description: 'Для товаров (13 цифр)' },
    'EAN8': { name: 'EAN-8', description: 'Короткий (8 цифр)' },
    'QR': { name: 'QR-код', description: 'Двумерный код' },
    'CODE39': { name: 'CODE39', description: 'Буквы и цифры' }
};

const UNITS = ['шт', 'кг', 'г', 'л', 'мл', 'уп', 'пач', 'бут', 'банка'];

// Генерация случайного цвета
function getRandomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// Генерация случайной иконки
function getRandomIcon() {
    return ICONS[Math.floor(Math.random() * ICONS.length)];
}

// Склонение слов
function pluralize(number, one, two, five) {
    let n = Math.abs(number);
    n %= 100;
    if (n >= 5 && n <= 20) {
        return five;
    }
    n %= 10;
    if (n === 1) {
        return one;
    }
    if (n >= 2 && n <= 4) {
        return two;
    }
    return five;
}

// Форматирование процентов
function formatPercent(value, decimals = 1) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

// Копирование в буфер обмена
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Скопировано в буфер обмена', 'success');
        return true;
    } catch (err) {
        showToast('Не удалось скопировать', 'error');
        return false;
    }
}

// Проверка мобильного устройства
function isMobile() {
    return window.innerWidth <= 768;
}

// Форматирование больших чисел
function formatLargeNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'М';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'К';
    }
    return num.toString();
}

// Получить цвет для значения (от красного к зелёному)
function getColorForValue(value, min, max) {
    const ratio = (value - min) / (max - min);
    const hue = ratio * 120; // 0 = красный, 120 = зелёный
    return `hsl(${hue}, 70%, 50%)`;
}

// Генерация уникального ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}