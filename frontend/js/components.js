// frontend/js/components.js

// Этот файл может содержать переиспользуемые компоненты
// В текущей реализации все компоненты встроены в app.js

// Компонент прогресс-бара
function createProgressBar(percent, color = 'var(--primary)', height = '8px') {
    return `
        <div style="height: ${height}; background: var(--gray-100); border-radius: var(--radius-full); overflow: hidden;">
            <div style="height: 100%; width: ${Math.min(100, percent)}%; background: ${color}; border-radius: var(--radius-full); transition: width 0.5s ease;"></div>
        </div>
    `;
}

// Компонент карточки статистики
function createStatCard(icon, label, value, change = null) {
    return `
        <div class="stat-card">
            <div class="stat-icon">${icon}</div>
            <div class="stat-info">
                <div class="stat-label">${label}</div>
                <div class="stat-value">${value}</div>
                ${change !== null ? `
                    <div class="stat-change ${change >= 0 ? 'positive' : 'negative'}">
                        ${change >= 0 ? '↑' : '↓'} ${Math.abs(change)}%
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Компонент пустого состояния
function createEmptyState(icon, text, small = false) {
    return `
        <div class="empty-state ${small ? 'small' : ''}">
            <div class="empty-state-icon">${icon}</div>
            <div class="empty-state-text">${text}</div>
        </div>
    `;
}

// Компонент загрузки
function createLoader() {
    return `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
}

// Компонент badge
function createBadge(text, type = 'default') {
    const colors = {
        default: 'var(--gray-500)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
        info: 'var(--info)'
    };
    
    return `
        <span style="
            display: inline-block;
            padding: 4px 8px;
            border-radius: var(--radius-full);
            font-size: 12px;
            font-weight: 600;
            background: ${colors[type]}20;
            color: ${colors[type]};
        ">${text}</span>
    `;
}