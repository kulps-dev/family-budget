// frontend/js/components.js

// Компонент прогресс-бара
function createProgressBar(percent, color = 'var(--primary)', height = '8px', showLabel = false) {
    const clampedPercent = Math.min(100, Math.max(0, percent));
    return `
        <div class="progress-bar-container" style="height: ${height}; background: var(--gray-100); border-radius: var(--radius-full); overflow: hidden; position: relative;">
            <div class="progress-bar-fill" style="height: 100%; width: ${clampedPercent}%; background: ${color}; border-radius: var(--radius-full); transition: width 0.5s ease;"></div>
            ${showLabel ? `<span class="progress-bar-label" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 600;">${clampedPercent.toFixed(0)}%</span>` : ''}
        </div>
    `;
}

// Компонент карточки статистики
function createStatCard(icon, label, value, change = null, color = null) {
    return `
        <div class="stat-card">
            <div class="stat-icon" ${color ? `style="color: ${color}"` : ''}>${icon}</div>
            <div class="stat-info">
                <div class="stat-label">${label}</div>
                <div class="stat-value" ${color ? `style="color: ${color}"` : ''}>${value}</div>
                ${change !== null ? `
                    <div class="stat-change ${change >= 0 ? 'positive' : 'negative'}">
                        ${svgIcon(change >= 0 ? 'arrow-up' : 'arrow-down', 'icon-sm')} ${Math.abs(change).toFixed(1)}%
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Компонент пустого состояния
function createEmptyState(iconId, text, actionText = null, actionHandler = null) {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">${svgIcon(iconId, 'icon-xl')}</div>
            <div class="empty-state-text">${text}</div>
            ${actionText ? `<button class="btn btn-primary btn-sm" onclick="${actionHandler}">${actionText}</button>` : ''}
        </div>
    `;
}

// Компонент загрузки
function createLoader(text = 'Загрузка...') {
    return `
        <div class="loading">
            <div class="spinner"></div>
            <div class="loading-text">${text}</div>
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
        info: 'var(--info)',
        primary: 'var(--primary)'
    };
    
    return `
        <span class="badge badge-${type}" style="
            display: inline-block;
            padding: 4px 10px;
            border-radius: var(--radius-full);
            font-size: 12px;
            font-weight: 600;
            background: ${colors[type]}15;
            color: ${colors[type]};
        ">${text}</span>
    `;
}

// Компонент аватара
function createAvatar(iconId, color = 'var(--primary)', size = '48px') {
    return `
        <div class="avatar" style="
            width: ${size};
            height: ${size};
            background: ${color}20;
            border-radius: var(--radius);
            display: flex;
            align-items: center;
            justify-content: center;
        ">${svgIcon(iconId)}</div>
    `;
}

// Компонент кнопки действия
function createActionButton(iconId, label, onClick, type = 'secondary', size = 'sm') {
    return `
        <button class="btn btn-${size} btn-${type}" onclick="${onClick}" title="${label}">
            ${svgIcon(iconId, 'icon-sm')}
        </button>
    `;
}

// Компонент выпадающего меню
function createDropdownMenu(triggerId, items) {
    const menuItems = items.map(item => {
        if (item.divider) {
            return '<div class="dropdown-divider"></div>';
        }
        return `
            <a href="#" class="dropdown-item ${item.danger ? 'danger' : ''}" onclick="${item.onClick}; return false;">
                <span class="dropdown-item-icon">${svgIcon(item.icon, 'icon-sm')}</span>
                <span class="dropdown-item-text">${item.label}</span>
            </a>
        `;
    }).join('');
    
    return `
        <div class="dropdown" id="${triggerId}-dropdown">
            <div class="dropdown-menu">
                ${menuItems}
            </div>
        </div>
    `;
}

// Компонент тултипа
function createTooltip(content, position = 'top') {
    return `data-tooltip="${content}" data-tooltip-position="${position}"`;
}

// Компонент карточки с графиком
function createChartCard(title, chartId, iconId = 'bar-chart') {
    return `
        <div class="card chart-card">
            <div class="card-header">
                <span class="card-icon">${svgIcon(iconId)}</span>
                <span class="card-title">${title}</span>
            </div>
            <div class="chart-container" id="${chartId}"></div>
        </div>
    `;
}

// Компонент таба
function createTabs(tabs, activeTab, onTabClick) {
    return `
        <div class="tabs">
            ${tabs.map(tab => `
                <button class="tab ${tab.id === activeTab ? 'active' : ''}" 
                        onclick="${onTabClick}('${tab.id}')"
                        data-tab="${tab.id}">
                    ${tab.icon ? `<span class="tab-icon">${svgIcon(tab.icon, 'icon-sm')}</span>` : ''}
                    <span class="tab-text">${tab.label}</span>
                </button>
            `).join('')}
        </div>
    `;
}

// Компонент модального подтверждения
function createConfirmModal(title, message, onConfirm, onCancel = 'closeModal()') {
    return `
        <div class="confirm-modal">
            <div class="confirm-message">${message}</div>
            <div class="confirm-actions">
                <button class="btn btn-secondary" onclick="${onCancel}">Отмена</button>
                <button class="btn btn-danger" onclick="${onConfirm}">Удалить</button>
            </div>
        </div>
    `;
}

// Компонент штрихкода (для бонусных карт)
function createBarcodeDisplay(cardNumber, barcodeType = 'CODE128') {
    // Для QR-кода используем другой подход
    if (barcodeType === 'QR') {
        return `
            <div class="barcode-container qr-code" id="barcode-${cardNumber.replace(/\s/g, '')}">
                <canvas class="qr-canvas"></canvas>
            </div>
        `;
    }
    
    return `
        <div class="barcode-container" id="barcode-${cardNumber.replace(/\s/g, '')}">
            <svg class="barcode-svg"></svg>
            <div class="barcode-number">${cardNumber}</div>
        </div>
    `;
}

// Компонент карточки бонусной карты
function createBonusCardDisplay(card) {
    return `
        <div class="bonus-card-display" style="background: linear-gradient(135deg, ${card.color} 0%, ${card.color}dd 100%);">
            <div class="bonus-card-header">
                <div class="bonus-card-icon">${svgIcon('ticket')}</div>
                <div class="bonus-card-info">
                    <div class="bonus-card-name">${card.name}</div>
                    <div class="bonus-card-store">${card.store_name}</div>
                </div>
            </div>
            <div class="bonus-card-barcode">
                ${createBarcodeDisplay(card.card_number, card.barcode_type)}
            </div>
            ${card.bonus_balance > 0 ? `
                <div class="bonus-card-balance">
                    <span class="bonus-label">Баланс бонусов:</span>
                    <span class="bonus-value">${card.bonus_balance}</span>
                </div>
            ` : ''}
        </div>
    `;
}

// Компонент AI-совета
function createAITip(tip) {
    const typeStyles = {
        success: { bg: 'var(--success-light)', border: 'var(--success)', icon: 'check' },
        warning: { bg: 'var(--warning-light)', border: 'var(--warning)', icon: 'alert-triangle' },
        danger: { bg: 'var(--danger-light)', border: 'var(--danger)', icon: 'alert-triangle' },
        info: { bg: 'var(--gray-100)', border: 'var(--info)', icon: 'info' }
    };
    
    const style = typeStyles[tip.type] || typeStyles.info;
    
    return `
        <div class="ai-tip" style="background: ${style.bg}; border-left: 4px solid ${style.border}; padding: 16px; border-radius: var(--radius); margin-bottom: 12px;">
            <div class="ai-tip-header" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span class="ai-tip-icon">${svgIcon(tip.iconId || style.icon)}</span>
                <span class="ai-tip-title" style="font-weight: 600;">${tip.title}</span>
            </div>
            <div class="ai-tip-message" style="font-size: 14px; color: var(--gray-700);">${tip.message}</div>
        </div>
    `;
}

// Компонент списка транзакций (компактный)
function createTransactionItem(t, showActions = true) {
    const iconId = t.type === 'transfer' ? 'repeat' : (t.type === 'income' ? 'trending-up' : 'trending-down');
    
    return `
        <div class="transaction-item" data-id="${t.id}">
            <div class="transaction-icon" style="background: ${t.category_color || '#667eea'}20; color: ${t.category_color || '#667eea'}">
                ${svgIcon(iconId)}
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
            ${showActions ? `
                <div class="transaction-actions">
                    <button class="btn-icon-sm" onclick="showEditTransactionModal(${t.id})" title="Редактировать">${svgIcon('edit', 'icon-sm')}</button>
                    <button class="btn-icon-sm danger" onclick="deleteTransaction(${t.id})" title="Удалить">${svgIcon('trash', 'icon-sm')}</button>
                </div>
            ` : ''}
        </div>
    `;
}

// Компонент мини-графика (sparkline)
function createSparkline(data, color = 'var(--primary)', width = 100, height = 30) {
    if (!data || data.length < 2) return '';
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');
    
    return `
        <svg width="${width}" height="${height}" class="sparkline">
            <polyline
                fill="none"
                stroke="${color}"
                stroke-width="2"
                points="${points}"
            />
        </svg>
    `;
}

// Компонент круговой диаграммы (простая)
function createDonutChart(percent, color = 'var(--primary)', size = 60, strokeWidth = 8) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    
    return `
        <svg width="${size}" height="${size}" class="donut-chart">
            <circle
                cx="${size / 2}"
                cy="${size / 2}"
                r="${radius}"
                fill="none"
                stroke="var(--gray-200)"
                stroke-width="${strokeWidth}"
            />
            <circle
                cx="${size / 2}"
                cy="${size / 2}"
                r="${radius}"
                fill="none"
                stroke="${color}"
                stroke-width="${strokeWidth}"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"
                stroke-linecap="round"
                transform="rotate(-90 ${size / 2} ${size / 2})"
                style="transition: stroke-dashoffset 0.5s ease;"
            />
            <text
                x="50%"
                y="50%"
                text-anchor="middle"
                dy=".3em"
                font-size="12"
                font-weight="600"
                fill="var(--gray-700)"
            >${percent.toFixed(0)}%</text>
        </svg>
    `;
}