# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date, timedelta
from dateutil.relativedelta import relativedelta
import os
import math
import requests
import json
import hashlib

app = Flask(__name__)
CORS(app)

db_path = os.environ.get('DATABASE_URL', 'sqlite:////app/data/budget.db')
app.config['SQLALCHEMY_DATABASE_URI'] = db_path
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# DeepSeek API настройки
DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY', '')
DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

db = SQLAlchemy(app)

# ============ МОДЕЛИ ============

class Account(db.Model):
    """Счета: дебетовые, кредитные карты, наличные, ИП, инвестиционные, налоговый резерв"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    account_type = db.Column(db.String(30), default='debit')
    # Типы: debit, credit_card, cash, savings, business, tax_reserve, investment
    balance = db.Column(db.Float, default=0)
    credit_limit = db.Column(db.Float, default=0)
    icon = db.Column(db.String(50), default='💳')
    color = db.Column(db.String(20), default='#667eea')
    bank_name = db.Column(db.String(100), default='')
    # Для ИП счетов
    is_business = db.Column(db.Boolean, default=False)
    tax_rate = db.Column(db.Float, default=0)
    linked_tax_account_id = db.Column(db.Integer, nullable=True)
    # Для инвестиционных счетов
    is_investment = db.Column(db.Boolean, default=False)
    broker_name = db.Column(db.String(100), default='')
    # Для налогового резерва
    is_tax_reserve = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Category(db.Model):
    """Категории доходов и расходов"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)
    icon = db.Column(db.String(50), default='📦')
    color = db.Column(db.String(20), default='#667eea')
    budget_limit = db.Column(db.Float, default=0)
    parent_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)

class Transaction(db.Model):
    """Транзакции"""
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(20), nullable=False)
    description = db.Column(db.String(255))
    date = db.Column(db.Date, default=date.today)
    account_id = db.Column(db.Integer, db.ForeignKey('account.id'))
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))
    to_account_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=True)
    store_id = db.Column(db.Integer, db.ForeignKey('store.id'), nullable=True)
    is_tax_transfer = db.Column(db.Boolean, default=False)
    tags = db.Column(db.String(255), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    account = db.relationship('Account', foreign_keys=[account_id])
    category = db.relationship('Category')
    to_account = db.relationship('Account', foreign_keys=[to_account_id])
    store = db.relationship('Store')

class Goal(db.Model):
    """Финансовые цели"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    target_amount = db.Column(db.Float, nullable=False)
    current_amount = db.Column(db.Float, default=0)
    deadline = db.Column(db.Date, nullable=True)
    icon = db.Column(db.String(50), default='🎯')
    color = db.Column(db.String(20), default='#667eea')
    priority = db.Column(db.Integer, default=1)
    is_completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    linked_account_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class CreditCard(db.Model):
    """Кредитные карты с детальной информацией"""
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('account.id'))
    credit_limit = db.Column(db.Float, nullable=False)
    current_debt = db.Column(db.Float, default=0)
    min_payment_percent = db.Column(db.Float, default=5)
    grace_period_days = db.Column(db.Integer, default=55)
    interest_rate = db.Column(db.Float, default=0)
    statement_day = db.Column(db.Integer, default=1)
    payment_due_day = db.Column(db.Integer, default=20)
    cashback_percent = db.Column(db.Float, default=0)
    
    account = db.relationship('Account')

class InvestmentTransaction(db.Model):
    """История операций с инвестициями"""
    id = db.Column(db.Integer, primary_key=True)
    investment_id = db.Column(db.Integer, db.ForeignKey('investment.id'))
    transaction_type = db.Column(db.String(20), nullable=False)  # buy, sell, dividend
    quantity = db.Column(db.Float, nullable=False)
    price = db.Column(db.Float, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    commission = db.Column(db.Float, default=0)
    date = db.Column(db.Date, default=date.today)
    notes = db.Column(db.String(255), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    investment = db.relationship('Investment', backref='transactions')    

class Credit(db.Model):
    """Потребительские кредиты"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    credit_type = db.Column(db.String(30), default='consumer')
    original_amount = db.Column(db.Float, nullable=False)
    remaining_amount = db.Column(db.Float, nullable=False)
    interest_rate = db.Column(db.Float, default=0)
    monthly_payment = db.Column(db.Float, nullable=False)
    term_months = db.Column(db.Integer, nullable=False)
    remaining_months = db.Column(db.Integer, nullable=False)
    start_date = db.Column(db.Date, nullable=True)
    next_payment_date = db.Column(db.Date, nullable=True)
    payment_day = db.Column(db.Integer, default=1)
    bank_name = db.Column(db.String(100), default='')
    extra_payments_total = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Mortgage(db.Model):
    """Ипотека"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    property_address = db.Column(db.String(255), default='')
    property_value = db.Column(db.Float, nullable=False)
    down_payment = db.Column(db.Float, default=0)
    original_amount = db.Column(db.Float, nullable=False)
    remaining_amount = db.Column(db.Float, nullable=False)
    interest_rate = db.Column(db.Float, nullable=False)
    term_months = db.Column(db.Integer, nullable=False)
    remaining_months = db.Column(db.Integer, nullable=False)
    monthly_payment = db.Column(db.Float, nullable=False)
    payment_type = db.Column(db.String(20), default='annuity')
    start_date = db.Column(db.Date, nullable=True)
    next_payment_date = db.Column(db.Date, nullable=True)
    payment_day = db.Column(db.Integer, default=1)
    bank_name = db.Column(db.String(100), default='')
    insurance_yearly = db.Column(db.Float, default=0)
    property_tax_yearly = db.Column(db.Float, default=0)
    extra_payments_total = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class MortgagePayment(db.Model):
    """История платежей по ипотеке"""
    id = db.Column(db.Integer, primary_key=True)
    mortgage_id = db.Column(db.Integer, db.ForeignKey('mortgage.id'))
    date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    principal = db.Column(db.Float, default=0)
    interest = db.Column(db.Float, default=0)
    is_extra = db.Column(db.Boolean, default=False)
    reduce_type = db.Column(db.String(20), default='term')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Store(db.Model):
    """Магазины для сравнения цен"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    store_type = db.Column(db.String(50), default='grocery')
    address = db.Column(db.String(255), default='')
    icon = db.Column(db.String(50), default='🏪')
    color = db.Column(db.String(20), default='#667eea')
    rating = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Product(db.Model):
    """Товары для отслеживания цен"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), default='other')
    unit = db.Column(db.String(20), default='шт')
    icon = db.Column(db.String(50), default='📦')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ProductPrice(db.Model):
    """Цены на товары в магазинах"""
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'))
    store_id = db.Column(db.Integer, db.ForeignKey('store.id'))
    price = db.Column(db.Float, nullable=False)
    is_sale = db.Column(db.Boolean, default=False)
    date = db.Column(db.Date, default=date.today)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    product = db.relationship('Product')
    store = db.relationship('Store')

class Investment(db.Model):
    """Инвестиции"""
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('account.id'))
    ticker = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    asset_type = db.Column(db.String(30), default='stock')
    quantity = db.Column(db.Float, nullable=False)
    avg_buy_price = db.Column(db.Float, nullable=False)
    current_price = db.Column(db.Float, default=0)
    currency = db.Column(db.String(10), default='RUB')
    sector = db.Column(db.String(50), default='')
    dividends_received = db.Column(db.Float, default=0)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    account = db.relationship('Account')

class TaxPayment(db.Model):
    """Налоговые платежи"""
    id = db.Column(db.Integer, primary_key=True)
    tax_type = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    period_start = db.Column(db.Date, nullable=False)
    period_end = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    paid_date = db.Column(db.Date, nullable=True)
    is_paid = db.Column(db.Boolean, default=False)
    description = db.Column(db.String(255), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class TaxReserve(db.Model):
    """Резерв на налоги (для ИП)"""
    id = db.Column(db.Integer, primary_key=True)
    business_account_id = db.Column(db.Integer, db.ForeignKey('account.id'))
    tax_account_id = db.Column(db.Integer, db.ForeignKey('account.id'))
    income_amount = db.Column(db.Float, nullable=False)
    tax_amount = db.Column(db.Float, nullable=False)
    tax_rate = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, default=date.today)
    is_transferred = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Budget(db.Model):
    """Месячный бюджет"""
    id = db.Column(db.Integer, primary_key=True)
    year = db.Column(db.Integer, nullable=False)
    month = db.Column(db.Integer, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)
    planned_amount = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Achievement(db.Model):
    """Достижения"""
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    icon = db.Column(db.String(50), default='🏆')
    points = db.Column(db.Integer, default=10)
    unlocked = db.Column(db.Boolean, default=False)
    unlocked_at = db.Column(db.DateTime, nullable=True)

class BonusCard(db.Model):
    """Бонусные карты магазинов"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    store_name = db.Column(db.String(100), default='')
    card_number = db.Column(db.String(50), nullable=False)
    barcode_type = db.Column(db.String(20), default='CODE128')  # CODE128, EAN13, QR
    icon = db.Column(db.String(50), default='🎫')
    color = db.Column(db.String(20), default='#667eea')
    bonus_balance = db.Column(db.Float, default=0)
    notes = db.Column(db.String(255), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AIAnalysis(db.Model):
    """Кэш AI-анализа"""
    id = db.Column(db.Integer, primary_key=True)
    analysis_type = db.Column(db.String(50), nullable=False)
    period = db.Column(db.String(20), nullable=False)
    data_hash = db.Column(db.String(64), nullable=False)
    result = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ============ API ROUTES ============

# --- Счета ---
@app.route('/api/accounts', methods=['GET'])
def get_accounts():
    account_type = request.args.get('type')
    query = Account.query
    if account_type:
        query = query.filter_by(account_type=account_type)
    
    accounts = query.order_by(Account.account_type, Account.name).all()
    result = []
    
    for a in accounts:
        data = {
            'id': a.id,
            'name': a.name,
            'account_type': a.account_type,
            'balance': a.balance,
            'credit_limit': a.credit_limit,
            'icon': a.icon,
            'color': a.color,
            'bank_name': a.bank_name,
            'is_business': a.is_business,
            'tax_rate': a.tax_rate,
            'linked_tax_account_id': a.linked_tax_account_id,
            'is_investment': a.is_investment,
            'broker_name': a.broker_name,
            'is_tax_reserve': a.is_tax_reserve
        }
        
        # Для кредитных карт
        if a.account_type == 'credit_card':
            card = CreditCard.query.filter_by(account_id=a.id).first()
            if card:
                data['credit_limit'] = card.credit_limit
                data['current_debt'] = card.current_debt
                data['available_limit'] = card.credit_limit - card.current_debt
                data['min_payment'] = round(card.current_debt * card.min_payment_percent / 100, 2)
                data['min_payment_percent'] = card.min_payment_percent
                data['grace_period_days'] = card.grace_period_days
                data['interest_rate'] = card.interest_rate
                data['statement_day'] = card.statement_day
                data['payment_due_day'] = card.payment_due_day
                data['cashback_percent'] = card.cashback_percent
                data['utilization'] = round((card.current_debt / card.credit_limit) * 100, 1) if card.credit_limit > 0 else 0
                # Баланс для кредитки = -долг
                data['balance'] = -card.current_debt
        
        # Для инвестиционных счетов
        if a.is_investment:
            investments = Investment.query.filter_by(account_id=a.id).all()
            total_invested = sum(i.quantity * i.avg_buy_price for i in investments)
            total_current = sum(i.quantity * i.current_price for i in investments)
            data['total_invested'] = total_invested
            data['total_current_value'] = total_current
            data['total_profit'] = total_current - total_invested
            data['total_profit_percent'] = round(((total_current - total_invested) / total_invested) * 100, 2) if total_invested > 0 else 0
            data['investments_count'] = len(investments)
        
        # Для бизнес-счетов - сумма налогов к уплате
        if a.is_business:
            reserves = TaxReserve.query.filter_by(
                business_account_id=a.id,
                is_transferred=False
            ).all()
            data['pending_tax'] = sum(r.tax_amount for r in reserves)
        
        # Для налогового резерва - показываем связанные бизнес-счета
        if a.is_tax_reserve:
            linked_accounts = Account.query.filter_by(linked_tax_account_id=a.id).all()
            data['linked_business_accounts'] = [{'id': la.id, 'name': la.name} for la in linked_accounts]
        
        result.append(data)
    
    return jsonify(result)

@app.route('/api/accounts', methods=['POST'])
def create_account():
    data = request.json
    
    # Определяем тип счёта
    account_type = data.get('account_type', 'debit')
    is_tax_reserve = account_type == 'tax_reserve'
    is_investment = account_type == 'investment' or data.get('is_investment', False)
    is_business = data.get('is_business', False)
    
    account = Account(
        name=data['name'],
        account_type=account_type,
        balance=data.get('balance', 0),
        credit_limit=data.get('credit_limit', 0),
        icon=data.get('icon', '💳'),
        color=data.get('color', '#667eea'),
        bank_name=data.get('bank_name', ''),
        is_business=is_business,
        tax_rate=data.get('tax_rate', 0),
        linked_tax_account_id=data.get('linked_tax_account_id'),
        is_investment=is_investment,
        broker_name=data.get('broker_name', ''),
        is_tax_reserve=is_tax_reserve
    )
    db.session.add(account)
    db.session.commit()
    
    # Создаём запись кредитной карты если нужно
    if account_type == 'credit_card':
        card = CreditCard(
            account_id=account.id,
            credit_limit=data.get('credit_limit', 0),
            current_debt=abs(data.get('current_debt', 0)),  # Долг всегда положительный в таблице
            min_payment_percent=data.get('min_payment_percent', 5),
            grace_period_days=data.get('grace_period_days', 55),
            interest_rate=data.get('interest_rate', 0),
            statement_day=data.get('statement_day', 1),
            payment_due_day=data.get('payment_due_day', 20),
            cashback_percent=data.get('cashback_percent', 0)
        )
        db.session.add(card)
        db.session.commit()
    
    return jsonify({'id': account.id, 'message': 'Счёт создан'}), 201

@app.route('/api/accounts/<int:id>', methods=['PUT'])
def update_account(id):
    account = Account.query.get_or_404(id)
    data = request.json
    
    account.name = data.get('name', account.name)
    account.account_type = data.get('account_type', account.account_type)
    account.balance = data.get('balance', account.balance)
    account.credit_limit = data.get('credit_limit', account.credit_limit)
    account.icon = data.get('icon', account.icon)
    account.color = data.get('color', account.color)
    account.bank_name = data.get('bank_name', account.bank_name)
    account.is_business = data.get('is_business', account.is_business)
    account.tax_rate = data.get('tax_rate', account.tax_rate)
    account.linked_tax_account_id = data.get('linked_tax_account_id', account.linked_tax_account_id)
    account.is_investment = data.get('is_investment', account.is_investment)
    account.broker_name = data.get('broker_name', account.broker_name)
    account.is_tax_reserve = data.get('is_tax_reserve', account.is_tax_reserve)
    
    # Обновляем кредитную карту
    if account.account_type == 'credit_card':
        card = CreditCard.query.filter_by(account_id=id).first()
        if card:
            card.credit_limit = data.get('credit_limit', card.credit_limit)
            # Обновляем долг если передан
            if 'current_debt' in data:
                card.current_debt = abs(data['current_debt'])
            card.min_payment_percent = data.get('min_payment_percent', card.min_payment_percent)
            card.grace_period_days = data.get('grace_period_days', card.grace_period_days)
            card.interest_rate = data.get('interest_rate', card.interest_rate)
            card.statement_day = data.get('statement_day', card.statement_day)
            card.payment_due_day = data.get('payment_due_day', card.payment_due_day)
            card.cashback_percent = data.get('cashback_percent', card.cashback_percent)
    
    db.session.commit()
    return jsonify({'message': 'Счёт обновлён'})

@app.route('/api/accounts/<int:id>', methods=['DELETE'])
def delete_account(id):
    account = Account.query.get_or_404(id)
    
    # Удаляем связанные данные
    Transaction.query.filter(
        (Transaction.account_id == id) | (Transaction.to_account_id == id)
    ).delete(synchronize_session=False)
    CreditCard.query.filter_by(account_id=id).delete()
    Investment.query.filter_by(account_id=id).delete()
    TaxReserve.query.filter(
        (TaxReserve.business_account_id == id) | (TaxReserve.tax_account_id == id)
    ).delete(synchronize_session=False)
    
    # Убираем ссылки на этот счёт как налоговый
    Account.query.filter_by(linked_tax_account_id=id).update({'linked_tax_account_id': None})
    
    db.session.delete(account)
    db.session.commit()
    return jsonify({'message': 'Счёт удалён'})

# --- Кредитные карты ---
@app.route('/api/credit-cards', methods=['GET'])
def get_credit_cards():
    cards = db.session.query(CreditCard, Account).join(Account).all()
    result = []
    
    for card, account in cards:
        today = date.today()
        payment_date = today.replace(day=min(card.payment_due_day, 28))
        if payment_date < today:
            payment_date = (payment_date + relativedelta(months=1))
        days_until_payment = (payment_date - today).days
        
        result.append({
            'id': card.id,
            'account_id': account.id,
            'name': account.name,
            'icon': account.icon,
            'color': account.color,
            'bank_name': account.bank_name,
            'credit_limit': card.credit_limit,
            'current_debt': card.current_debt,
            'available_limit': card.credit_limit - card.current_debt,
            'min_payment': round(card.current_debt * card.min_payment_percent / 100, 2),
            'min_payment_percent': card.min_payment_percent,
            'grace_period_days': card.grace_period_days,
            'interest_rate': card.interest_rate,
            'statement_day': card.statement_day,
            'payment_due_day': card.payment_due_day,
            'days_until_payment': days_until_payment,
            'cashback_percent': card.cashback_percent,
            'utilization': round((card.current_debt / card.credit_limit) * 100, 1) if card.credit_limit > 0 else 0
        })
    
    return jsonify(result)

@app.route('/api/credit-cards/<int:id>', methods=['PUT'])
def update_credit_card(id):
    """Полное редактирование кредитной карты"""
    card = CreditCard.query.get_or_404(id)
    account = Account.query.get(card.account_id)
    data = request.json
    
    # Обновляем счёт
    if 'name' in data:
        account.name = data['name']
    if 'icon' in data:
        account.icon = data['icon']
    if 'color' in data:
        account.color = data['color']
    if 'bank_name' in data:
        account.bank_name = data['bank_name']
    
    # Обновляем карту
    if 'credit_limit' in data:
        card.credit_limit = data['credit_limit']
    if 'current_debt' in data:
        card.current_debt = abs(data['current_debt'])
    if 'min_payment_percent' in data:
        card.min_payment_percent = data['min_payment_percent']
    if 'grace_period_days' in data:
        card.grace_period_days = data['grace_period_days']
    if 'interest_rate' in data:
        card.interest_rate = data['interest_rate']
    if 'statement_day' in data:
        card.statement_day = data['statement_day']
    if 'payment_due_day' in data:
        card.payment_due_day = data['payment_due_day']
    if 'cashback_percent' in data:
        card.cashback_percent = data['cashback_percent']
    
    db.session.commit()
    return jsonify({'message': 'Кредитная карта обновлена'})

@app.route('/api/credit-cards/<int:id>', methods=['DELETE'])
def delete_credit_card(id):
    """Удаление кредитной карты"""
    card = CreditCard.query.get_or_404(id)
    account_id = card.account_id
    
    # Удаляем транзакции
    Transaction.query.filter(
        (Transaction.account_id == account_id) | (Transaction.to_account_id == account_id)
    ).delete(synchronize_session=False)
    
    # Удаляем карту и счёт
    db.session.delete(card)
    account = Account.query.get(account_id)
    if account:
        db.session.delete(account)
    
    db.session.commit()
    return jsonify({'message': 'Кредитная карта удалена'})

@app.route('/api/credit-cards/<int:id>/pay', methods=['POST'])
def pay_credit_card(id):
    card = CreditCard.query.get_or_404(id)
    data = request.json
    amount = data['amount']
    from_account_id = data['from_account_id']
    
    from_account = Account.query.get_or_404(from_account_id)
    from_account.balance -= amount
    
    card.current_debt = max(0, card.current_debt - amount)
    
    transaction = Transaction(
        amount=amount,
        type='transfer',
        description=f'Погашение кредитной карты {card.account.name}',
        account_id=from_account_id,
        to_account_id=card.account_id,
        date=date.today()
    )
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify({
        'message': 'Платёж внесён',
        'new_debt': card.current_debt,
        'available_limit': card.credit_limit - card.current_debt
    })

@app.route('/api/credit-cards/<int:id>/update-limit', methods=['PUT'])
def update_credit_limit(id):
    card = CreditCard.query.get_or_404(id)
    data = request.json
    card.credit_limit = data['credit_limit']
    db.session.commit()
    return jsonify({
        'message': 'Лимит обновлён',
        'credit_limit': card.credit_limit,
        'available_limit': card.credit_limit - card.current_debt
    })

@app.route('/api/credit-cards/<int:id>/update-debt', methods=['PUT'])
def update_credit_debt(id):
    """Обновление текущего долга по кредитной карте"""
    card = CreditCard.query.get_or_404(id)
    data = request.json
    card.current_debt = abs(data['current_debt'])
    db.session.commit()
    return jsonify({
        'message': 'Долг обновлён',
        'current_debt': card.current_debt,
        'available_limit': card.credit_limit - card.current_debt
    })

# --- Категории ---
@app.route('/api/categories', methods=['GET'])
def get_categories():
    type_filter = request.args.get('type')
    query = Category.query
    if type_filter:
        query = query.filter_by(type=type_filter)
    categories = query.order_by(Category.name).all()
    
    today = date.today()
    first_day = today.replace(day=1)
    
    result = []
    for c in categories:
        spent = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.category_id == c.id,
            Transaction.date >= first_day,
            Transaction.type == 'expense'
        ).scalar() or 0
        
        earned = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.category_id == c.id,
            Transaction.date >= first_day,
            Transaction.type == 'income'
        ).scalar() or 0
        
        result.append({
            'id': c.id,
            'name': c.name,
            'type': c.type,
            'icon': c.icon,
            'color': c.color,
            'budget_limit': c.budget_limit,
            'spent_this_month': spent,
            'earned_this_month': earned,
            'budget_percent': round((spent / c.budget_limit) * 100, 1) if c.budget_limit > 0 else 0,
            'is_over_budget': spent > c.budget_limit if c.budget_limit > 0 else False
        })
    
    return jsonify(result)

@app.route('/api/categories', methods=['POST'])
def create_category():
    data = request.json
    category = Category(
        name=data['name'],
        type=data['type'],
        icon=data.get('icon', '📦'),
        color=data.get('color', '#667eea'),
        budget_limit=data.get('budget_limit', 0)
    )
    db.session.add(category)
    db.session.commit()
    return jsonify({'id': category.id, 'message': 'Категория создана'}), 201

@app.route('/api/categories/<int:id>', methods=['PUT'])
def update_category(id):
    category = Category.query.get_or_404(id)
    data = request.json
    category.name = data.get('name', category.name)
    category.icon = data.get('icon', category.icon)
    category.color = data.get('color', category.color)
    category.budget_limit = data.get('budget_limit', category.budget_limit)
    if 'type' in data:
        category.type = data['type']
    db.session.commit()
    return jsonify({'message': 'Категория обновлена'})

@app.route('/api/categories/<int:id>', methods=['DELETE'])
def delete_category(id):
    # Убираем категорию из транзакций
    Transaction.query.filter_by(category_id=id).update({'category_id': None})
    
    category = Category.query.get_or_404(id)
    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Категория удалена'})

# --- Транзакции ---
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    type_filter = request.args.get('type')
    account_filter = request.args.get('account_id', type=int)
    category_filter = request.args.get('category_id', type=int)
    store_filter = request.args.get('store_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    search = request.args.get('search', '')
    
    query = Transaction.query
    
    if type_filter:
        query = query.filter_by(type=type_filter)
    if account_filter:
        query = query.filter(
            (Transaction.account_id == account_filter) | 
            (Transaction.to_account_id == account_filter)
        )
    if category_filter:
        query = query.filter_by(category_id=category_filter)
    if store_filter:
        query = query.filter_by(store_id=store_filter)
    if start_date:
        query = query.filter(Transaction.date >= datetime.strptime(start_date, '%Y-%m-%d').date())
    if end_date:
        query = query.filter(Transaction.date <= datetime.strptime(end_date, '%Y-%m-%d').date())
    if search:
        query = query.filter(Transaction.description.ilike(f'%{search}%'))
    
    transactions = query.order_by(Transaction.date.desc(), Transaction.id.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'transactions': [{
            'id': t.id,
            'amount': t.amount,
            'type': t.type,
            'description': t.description,
            'date': t.date.isoformat(),
            'account_id': t.account_id,
            'account_name': t.account.name if t.account else None,
            'account_icon': t.account.icon if t.account else None,
            'category_id': t.category_id,
            'category_name': t.category.name if t.category else None,
            'category_icon': t.category.icon if t.category else None,
            'category_color': t.category.color if t.category else None,
            'to_account_id': t.to_account_id,
            'to_account_name': t.to_account.name if t.to_account else None,
            'store_id': t.store_id,
            'store_name': t.store.name if t.store else None,
            'is_tax_transfer': t.is_tax_transfer,
            'tags': t.tags.split(',') if t.tags else []
        } for t in transactions.items],
        'total': transactions.total,
        'pages': transactions.pages,
        'current_page': page
    })

@app.route('/api/transactions', methods=['POST'])
def create_transaction():
    data = request.json
    
    transaction = Transaction(
        amount=data['amount'],
        type=data['type'],
        description=data.get('description', ''),
        date=datetime.strptime(data['date'], '%Y-%m-%d').date() if data.get('date') else date.today(),
        account_id=data['account_id'],
        category_id=data.get('category_id'),
        to_account_id=data.get('to_account_id'),
        store_id=data.get('store_id'),
        is_tax_transfer=data.get('is_tax_transfer', False),
        tags=','.join(data.get('tags', []))
    )
    
    account = Account.query.get(data['account_id'])
    
    if data['type'] == 'income':
        account.balance += data['amount']
        
        if account.is_business and account.tax_rate > 0 and account.linked_tax_account_id:
            tax_amount = data['amount'] * account.tax_rate / 100
            
            # Создаём запись резерва
            reserve = TaxReserve(
                business_account_id=account.id,
                tax_account_id=account.linked_tax_account_id,
                income_amount=data['amount'],
                tax_amount=tax_amount,
                tax_rate=account.tax_rate,
                date=transaction.date,
                is_transferred=True  # Сразу помечаем как переведённый
            )
            db.session.add(reserve)
            
            # ✅ Автоматически переводим налог на резервный счёт
            tax_account = Account.query.get(account.linked_tax_account_id)
            if tax_account:
                account.balance -= tax_amount  # Списываем с ИП счёта
                tax_account.balance += tax_amount  # Зачисляем на резервный
                
                # Создаём транзакцию перевода для истории
                tax_transfer = Transaction(
                    amount=tax_amount,
                    type='transfer',
                    description=f'Автоматический резерв налога {account.tax_rate}%',
                    account_id=account.id,
                    to_account_id=account.linked_tax_account_id,
                    is_tax_transfer=True,
                    date=transaction.date
                )
                db.session.add(tax_transfer)
            
    elif data['type'] == 'expense':
        account.balance -= data['amount']
        
        if account.account_type == 'credit_card':
            card = CreditCard.query.filter_by(account_id=account.id).first()
            if card:
                card.current_debt += data['amount']
                
    elif data['type'] == 'transfer' and data.get('to_account_id'):
        account.balance -= data['amount']
        to_account = Account.query.get(data['to_account_id'])
        
        # ✅ ИСПРАВЛЕНИЕ: Если переводим С кредитной карты - увеличиваем долг
        if account.account_type == 'credit_card':
            card = CreditCard.query.filter_by(account_id=account.id).first()
            if card:
                card.current_debt += data['amount']
        
        # ✅ ИСПРАВЛЕНИЕ: Если переводим НА кредитную карту - уменьшаем долг (погашение)
        if to_account.account_type == 'credit_card':
            to_card = CreditCard.query.filter_by(account_id=to_account.id).first()
            if to_card:
                to_card.current_debt = max(0, to_card.current_debt - data['amount'])
        else:
            to_account.balance += data['amount']
        
        if data.get('is_tax_transfer'):
            TaxReserve.query.filter_by(
                business_account_id=data['account_id'],
                tax_account_id=data['to_account_id'],
                is_transferred=False
            ).update({'is_transferred': True})
    
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify({'id': transaction.id, 'message': 'Транзакция создана'}), 201

@app.route('/api/transactions/<int:id>', methods=['PUT'])
def update_transaction(id):
    """Редактирование транзакции"""
    transaction = Transaction.query.get_or_404(id)
    data = request.json
    
    # ========== ОТКАТЫВАЕМ СТАРУЮ ТРАНЗАКЦИЮ ==========
    old_account = Account.query.get(transaction.account_id)
    
    if transaction.type == 'income':
        old_account.balance -= transaction.amount
        
    elif transaction.type == 'expense':
        old_account.balance += transaction.amount
        if old_account.account_type == 'credit_card':
            card = CreditCard.query.filter_by(account_id=old_account.id).first()
            if card:
                card.current_debt = max(0, card.current_debt - transaction.amount)
                
    elif transaction.type == 'transfer' and transaction.to_account_id:
        old_account.balance += transaction.amount
        # Если переводили С кредитки
        if old_account.account_type == 'credit_card':
            card = CreditCard.query.filter_by(account_id=old_account.id).first()
            if card:
                card.current_debt = max(0, card.current_debt - transaction.amount)
        
        old_to_account = Account.query.get(transaction.to_account_id)
        if old_to_account:
            if old_to_account.account_type == 'credit_card':
                to_card = CreditCard.query.filter_by(account_id=old_to_account.id).first()
                if to_card:
                    to_card.current_debt += transaction.amount
            else:
                old_to_account.balance -= transaction.amount
    
    # ========== ОБНОВЛЯЕМ ДАННЫЕ ТРАНЗАКЦИИ ==========
    transaction.amount = data.get('amount', transaction.amount)
    transaction.type = data.get('type', transaction.type)
    transaction.description = data.get('description', transaction.description)
    if data.get('date'):
        transaction.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    transaction.account_id = data.get('account_id', transaction.account_id)
    transaction.category_id = data.get('category_id', transaction.category_id)
    transaction.to_account_id = data.get('to_account_id', transaction.to_account_id)
    transaction.store_id = data.get('store_id', transaction.store_id)
    
    # ========== ПРИМЕНЯЕМ НОВУЮ ТРАНЗАКЦИЮ ==========
    new_account = Account.query.get(transaction.account_id)
    
    if transaction.type == 'income':
        new_account.balance += transaction.amount
        
    elif transaction.type == 'expense':
        new_account.balance -= transaction.amount
        if new_account.account_type == 'credit_card':
            card = CreditCard.query.filter_by(account_id=new_account.id).first()
            if card:
                card.current_debt += transaction.amount
                
    elif transaction.type == 'transfer' and transaction.to_account_id:
        new_account.balance -= transaction.amount
        # Если переводим С кредитки
        if new_account.account_type == 'credit_card':
            card = CreditCard.query.filter_by(account_id=new_account.id).first()
            if card:
                card.current_debt += transaction.amount
        
        new_to_account = Account.query.get(transaction.to_account_id)
        if new_to_account:
            if new_to_account.account_type == 'credit_card':
                to_card = CreditCard.query.filter_by(account_id=new_to_account.id).first()
                if to_card:
                    to_card.current_debt = max(0, to_card.current_debt - transaction.amount)
            else:
                new_to_account.balance += transaction.amount
    
    db.session.commit()
    return jsonify({'message': 'Транзакция обновлена'})

@app.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    transaction = Transaction.query.get_or_404(id)
    
    account = Account.query.get(transaction.account_id)
    
    if transaction.type == 'income':
        # Откатываем доход - уменьшаем баланс
        account.balance -= transaction.amount
        
    elif transaction.type == 'expense':
        # Откатываем расход - увеличиваем баланс
        account.balance += transaction.amount
        # ✅ ИСПРАВЛЕНИЕ: Для кредитки уменьшаем долг
        if account.account_type == 'credit_card':
            card = CreditCard.query.filter_by(account_id=account.id).first()
            if card:
                card.current_debt = max(0, card.current_debt - transaction.amount)
                
    elif transaction.type == 'transfer' and transaction.to_account_id:
        # Откатываем перевод
        # Возвращаем деньги на исходный счёт
        account.balance += transaction.amount
        
        # ✅ ИСПРАВЛЕНИЕ: Если переводили С кредитки - уменьшаем долг обратно
        if account.account_type == 'credit_card':
            card = CreditCard.query.filter_by(account_id=account.id).first()
            if card:
                card.current_debt = max(0, card.current_debt - transaction.amount)
        
        to_account = Account.query.get(transaction.to_account_id)
        if to_account:
            # ✅ ИСПРАВЛЕНИЕ: Если переводили НА кредитку - увеличиваем долг обратно
            if to_account.account_type == 'credit_card':
                to_card = CreditCard.query.filter_by(account_id=to_account.id).first()
                if to_card:
                    to_card.current_debt += transaction.amount
            else:
                to_account.balance -= transaction.amount
    
    db.session.delete(transaction)
    db.session.commit()
    return jsonify({'message': 'Транзакция удалена'})

# --- Цели ---
@app.route('/api/goals', methods=['GET'])
def get_goals():
    show_completed = request.args.get('show_completed', 'false') == 'true'
    query = Goal.query
    if not show_completed:
        query = query.filter_by(is_completed=False)
    goals = query.order_by(Goal.priority.desc(), Goal.deadline).all()
    
    today = date.today()
    result = []
    
    for g in goals:
        days_left = (g.deadline - today).days if g.deadline else None
        monthly_needed = 0
        weekly_needed = 0
        
        if g.deadline and days_left and days_left > 0:
            remaining = g.target_amount - g.current_amount
            months_left = max(1, days_left / 30)
            weeks_left = max(1, days_left / 7)
            monthly_needed = remaining / months_left
            weekly_needed = remaining / weeks_left
        
        result.append({
            'id': g.id,
            'name': g.name,
            'target_amount': g.target_amount,
            'current_amount': g.current_amount,
            'remaining_amount': g.target_amount - g.current_amount,
            'deadline': g.deadline.isoformat() if g.deadline else None,
            'icon': g.icon,
            'color': g.color,
            'priority': g.priority,
            'is_completed': g.is_completed,
            'completed_at': g.completed_at.isoformat() if g.completed_at else None,
            'progress': round((g.current_amount / g.target_amount) * 100, 1) if g.target_amount > 0 else 0,
            'days_left': days_left,
            'monthly_needed': round(monthly_needed, 2),
            'weekly_needed': round(weekly_needed, 2),
            'is_on_track': monthly_needed <= (g.target_amount / 12) if g.deadline else True,
            'linked_account_id': g.linked_account_id
        })
    
    return jsonify(result)

@app.route('/api/goals', methods=['POST'])
def create_goal():
    data = request.json
    goal = Goal(
        name=data['name'],
        target_amount=data['target_amount'],
        current_amount=data.get('current_amount', 0),
        deadline=datetime.strptime(data['deadline'], '%Y-%m-%d').date() if data.get('deadline') else None,
        icon=data.get('icon', '🎯'),
        color=data.get('color', '#667eea'),
        priority=data.get('priority', 1),
        linked_account_id=data.get('linked_account_id')
    )
    db.session.add(goal)
    db.session.commit()
    return jsonify({'id': goal.id, 'message': 'Цель создана'}), 201

@app.route('/api/goals/<int:id>', methods=['PUT'])
def update_goal(id):
    goal = Goal.query.get_or_404(id)
    data = request.json
    
    goal.name = data.get('name', goal.name)
    goal.target_amount = data.get('target_amount', goal.target_amount)
    goal.current_amount = data.get('current_amount', goal.current_amount)
    if data.get('deadline'):
        goal.deadline = datetime.strptime(data['deadline'], '%Y-%m-%d').date()
    elif 'deadline' in data and data['deadline'] is None:
        goal.deadline = None
    goal.icon = data.get('icon', goal.icon)
    goal.color = data.get('color', goal.color)
    goal.priority = data.get('priority', goal.priority)
    goal.linked_account_id = data.get('linked_account_id', goal.linked_account_id)
    
    if goal.current_amount >= goal.target_amount and not goal.is_completed:
        goal.is_completed = True
        goal.completed_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify({'message': 'Цель обновлена'})

@app.route('/api/goals/<int:id>/add', methods=['POST'])
def add_to_goal(id):
    goal = Goal.query.get_or_404(id)
    data = request.json
    amount = data['amount']
    
    goal.current_amount += amount
    
    if goal.current_amount >= goal.target_amount:
        goal.is_completed = True
        goal.completed_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify({
        'message': 'Сумма добавлена',
        'current_amount': goal.current_amount,
        'is_completed': goal.is_completed
    })

@app.route('/api/goals/<int:id>', methods=['DELETE'])
def delete_goal(id):
    goal = Goal.query.get_or_404(id)
    db.session.delete(goal)
    db.session.commit()
    return jsonify({'message': 'Цель удалена'})

# --- Кредиты ---
@app.route('/api/credits', methods=['GET'])
def get_credits():
    credits = Credit.query.order_by(Credit.next_payment_date).all()
    today = date.today()
    
    result = []
    for c in credits:
        days_until_payment = (c.next_payment_date - today).days if c.next_payment_date else None
        total_paid = c.original_amount - c.remaining_amount
        
        # Рассчитываем сколько месяцев оплачено
        months_paid = c.term_months - c.remaining_months
        
        # Рассчитываем переплату
        rate = c.interest_rate / 100 / 12
        total_to_pay = c.monthly_payment * c.term_months
        overpayment = total_to_pay - c.original_amount
        
        # Рассчитываем сколько процентов уже заплатили
        paid_interest = 0
        remaining = c.original_amount
        for _ in range(months_paid):
            interest = remaining * rate
            principal = c.monthly_payment - interest
            paid_interest += interest
            remaining = max(0, remaining - principal)
        
        result.append({
            'id': c.id,
            'name': c.name,
            'credit_type': c.credit_type,
            'original_amount': c.original_amount,
            'remaining_amount': c.remaining_amount,
            'interest_rate': c.interest_rate,
            'monthly_payment': c.monthly_payment,
            'term_months': c.term_months,
            'remaining_months': c.remaining_months,
            'months_paid': months_paid,
            'start_date': c.start_date.isoformat() if c.start_date else None,
            'next_payment_date': c.next_payment_date.isoformat() if c.next_payment_date else None,
            'payment_day': c.payment_day,
            'bank_name': c.bank_name,
            'days_until_payment': days_until_payment,
            'progress': round((total_paid / c.original_amount) * 100, 1) if c.original_amount > 0 else 0,
            'total_paid': total_paid,
            'paid_interest': round(paid_interest, 2),
            'total_overpayment': round(overpayment, 2),
            'remaining_overpayment': round(overpayment - paid_interest, 2),
            'extra_payments_total': c.extra_payments_total,
            'is_payment_soon': days_until_payment is not None and days_until_payment <= 5
        })
    
    return jsonify(result)

@app.route('/api/credits', methods=['POST'])
def create_credit():
    data = request.json
    
    start_date_str = data.get('start_date')
    if start_date_str:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
    else:
        start_date = date.today()
    
    payment_day = data.get('payment_day', start_date.day)
    original_amount = data['original_amount']
    interest_rate = data.get('interest_rate', 0)
    term_months = data['term_months']
    
    # Рассчитываем ежемесячный платёж если не указан
    monthly_payment = data.get('monthly_payment')
    if not monthly_payment:
        rate = interest_rate / 100 / 12
        if rate > 0:
            monthly_payment = original_amount * (rate * (1 + rate)**term_months) / ((1 + rate)**term_months - 1)
        else:
            monthly_payment = original_amount / term_months
    
    # Рассчитываем сколько месяцев уже прошло с даты взятия кредита
    today = date.today()
    months_passed = 0
    if start_date < today:
        months_passed = (today.year - start_date.year) * 12 + (today.month - start_date.month)
        # Если день платежа ещё не наступил в этом месяце, уменьшаем на 1
        if today.day < payment_day:
            months_passed = max(0, months_passed - 1)
    
    # Если указан remaining_amount - используем его, иначе рассчитываем
    if 'remaining_amount' in data and data['remaining_amount'] is not None:
        remaining_amount = data['remaining_amount']
        # Рассчитываем оставшиеся месяцы на основе остатка
        if interest_rate > 0:
            rate = interest_rate / 100 / 12
            if monthly_payment > remaining_amount * rate:
                remaining_months = math.ceil(
                    -math.log(1 - (remaining_amount * rate / monthly_payment)) / math.log(1 + rate)
                )
            else:
                remaining_months = term_months - months_passed
        else:
            remaining_months = math.ceil(remaining_amount / monthly_payment) if monthly_payment > 0 else term_months
    else:
        # Рассчитываем остаток на основе прошедших платежей
        remaining_amount = original_amount
        rate = interest_rate / 100 / 12
        
        for _ in range(months_passed):
            if rate > 0:
                interest = remaining_amount * rate
                principal = monthly_payment - interest
            else:
                principal = monthly_payment
            remaining_amount = max(0, remaining_amount - principal)
        
        remaining_months = term_months - months_passed
    
    # Вычисляем следующую дату платежа
    try:
        next_payment = today.replace(day=min(payment_day, 28))
    except ValueError:
        next_payment = today.replace(day=28)
    
    if next_payment <= today:
        next_payment = next_payment + relativedelta(months=1)
    
    credit = Credit(
        name=data['name'],
        credit_type=data.get('credit_type', 'consumer'),
        original_amount=original_amount,
        remaining_amount=max(0, remaining_amount),
        interest_rate=interest_rate,
        monthly_payment=round(monthly_payment, 2),
        term_months=term_months,
        remaining_months=max(0, remaining_months),
        start_date=start_date,
        next_payment_date=next_payment,
        payment_day=payment_day,
        bank_name=data.get('bank_name', ''),
        extra_payments_total=data.get('extra_payments_total', 0)
    )
    db.session.add(credit)
    db.session.commit()
    
    return jsonify({
        'id': credit.id, 
        'message': 'Кредит добавлен',
        'calculated': {
            'months_passed': months_passed,
            'remaining_amount': round(remaining_amount, 2),
            'remaining_months': remaining_months,
            'monthly_payment': round(monthly_payment, 2)
        }
    }), 201

@app.route('/api/credits/<int:id>', methods=['PUT'])
def update_credit(id):
    """Редактирование кредита"""
    credit = Credit.query.get_or_404(id)
    data = request.json
    
    credit.name = data.get('name', credit.name)
    credit.credit_type = data.get('credit_type', credit.credit_type)
    credit.original_amount = data.get('original_amount', credit.original_amount)
    credit.remaining_amount = data.get('remaining_amount', credit.remaining_amount)
    credit.interest_rate = data.get('interest_rate', credit.interest_rate)
    credit.monthly_payment = data.get('monthly_payment', credit.monthly_payment)
    credit.term_months = data.get('term_months', credit.term_months)
    credit.remaining_months = data.get('remaining_months', credit.remaining_months)
    credit.payment_day = data.get('payment_day', credit.payment_day)
    credit.bank_name = data.get('bank_name', credit.bank_name)
    
    if data.get('start_date'):
        credit.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
    if data.get('next_payment_date'):
        credit.next_payment_date = datetime.strptime(data['next_payment_date'], '%Y-%m-%d').date()
    
    db.session.commit()
    return jsonify({'message': 'Кредит обновлён'})

@app.route('/api/credits/<int:id>/pay', methods=['POST'])
def pay_credit(id):
    credit = Credit.query.get_or_404(id)
    data = request.json
    amount = data['amount']
    is_extra = data.get('is_extra', False)
    reduce_type = data.get('reduce_type', 'term')
    
    credit.remaining_amount = max(0, credit.remaining_amount - amount)
    
    if is_extra:
        credit.extra_payments_total += amount
        
        if reduce_type == 'term' and credit.remaining_months > 1:
            new_months = math.ceil(credit.remaining_amount / credit.monthly_payment)
            credit.remaining_months = max(1, new_months)
        elif reduce_type == 'payment':
            if credit.remaining_months > 0:
                credit.monthly_payment = credit.remaining_amount / credit.remaining_months
    else:
        credit.remaining_months = max(0, credit.remaining_months - 1)
    
    if credit.remaining_amount > 0:
        credit.next_payment_date = credit.next_payment_date + relativedelta(months=1)
    
    db.session.commit()
    return jsonify({
        'message': 'Платёж внесён',
        'remaining_amount': credit.remaining_amount,
        'remaining_months': credit.remaining_months,
        'monthly_payment': credit.monthly_payment
    })

@app.route('/api/credits/<int:id>', methods=['DELETE'])
def delete_credit(id):
    credit = Credit.query.get_or_404(id)
    db.session.delete(credit)
    db.session.commit()
    return jsonify({'message': 'Кредит удалён'})

# --- Ипотека ---
@app.route('/api/mortgages', methods=['GET'])
def get_mortgages():
    mortgages = Mortgage.query.all()
    today = date.today()
    
    result = []
    for m in mortgages:
        days_until_payment = (m.next_payment_date - today).days if m.next_payment_date else None
        total_paid = m.original_amount - m.remaining_amount
        
        total_to_pay = m.monthly_payment * m.term_months
        overpayment = total_to_pay - m.original_amount
        
        months_saved = 0
        if m.extra_payments_total > 0:
            months_saved = math.floor(m.extra_payments_total / m.monthly_payment)
        
        result.append({
            'id': m.id,
            'name': m.name,
            'property_address': m.property_address,
            'property_value': m.property_value,
            'down_payment': m.down_payment,
            'original_amount': m.original_amount,
            'remaining_amount': m.remaining_amount,
            'interest_rate': m.interest_rate,
            'term_months': m.term_months,
            'remaining_months': m.remaining_months,
            'monthly_payment': m.monthly_payment,
            'payment_type': m.payment_type,
            'start_date': m.start_date.isoformat() if m.start_date else None,
            'next_payment_date': m.next_payment_date.isoformat() if m.next_payment_date else None,
            'payment_day': m.payment_day,
            'bank_name': m.bank_name,
            'insurance_yearly': m.insurance_yearly,
            'property_tax_yearly': m.property_tax_yearly,
            'extra_payments_total': m.extra_payments_total,
            'days_until_payment': days_until_payment,
            'progress': round((total_paid / m.original_amount) * 100, 1) if m.original_amount > 0 else 0,
            'total_paid': total_paid,
            'overpayment': overpayment,
            'months_saved': months_saved,
            'monthly_extra_costs': round((m.insurance_yearly + m.property_tax_yearly) / 12, 2),
            'total_monthly_cost': m.monthly_payment + round((m.insurance_yearly + m.property_tax_yearly) / 12, 2),
            'is_payment_soon': days_until_payment is not None and days_until_payment <= 5,
            'equity': m.property_value - m.remaining_amount
        })
    
    return jsonify(result)

@app.route('/api/mortgages', methods=['POST'])
def create_mortgage():
    data = request.json
    
    start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data.get('start_date') else date.today()
    payment_day = data.get('payment_day', start_date.day)
    
    next_payment = start_date.replace(day=min(payment_day, 28))
    if next_payment <= date.today():
        next_payment = next_payment + relativedelta(months=1)
    
    loan_amount = data['original_amount']
    rate = data['interest_rate'] / 100 / 12
    term = data['term_months']
    
    if data.get('monthly_payment'):
        monthly_payment = data['monthly_payment']
    else:
        if rate > 0:
            monthly_payment = loan_amount * (rate * (1 + rate)**term) / ((1 + rate)**term - 1)
        else:
            monthly_payment = loan_amount / term
    
    mortgage = Mortgage(
        name=data['name'],
        property_address=data.get('property_address', ''),
        property_value=data['property_value'],
        down_payment=data.get('down_payment', 0),
        original_amount=loan_amount,
        remaining_amount=data.get('remaining_amount', loan_amount),
        interest_rate=data['interest_rate'],
        term_months=term,
        remaining_months=data.get('remaining_months', term),
        monthly_payment=round(monthly_payment, 2),
        payment_type=data.get('payment_type', 'annuity'),
        start_date=start_date,
        next_payment_date=next_payment,
        payment_day=payment_day,
        bank_name=data.get('bank_name', ''),
        insurance_yearly=data.get('insurance_yearly', 0),
        property_tax_yearly=data.get('property_tax_yearly', 0)
    )
    db.session.add(mortgage)
    db.session.commit()
    return jsonify({'id': mortgage.id, 'message': 'Ипотека добавлена'}), 201

@app.route('/api/mortgages/<int:id>', methods=['PUT'])
def update_mortgage(id):
    """Редактирование ипотеки"""
    mortgage = Mortgage.query.get_or_404(id)
    data = request.json
    
    mortgage.name = data.get('name', mortgage.name)
    mortgage.property_address = data.get('property_address', mortgage.property_address)
    mortgage.property_value = data.get('property_value', mortgage.property_value)
    mortgage.down_payment = data.get('down_payment', mortgage.down_payment)
    mortgage.original_amount = data.get('original_amount', mortgage.original_amount)
    mortgage.remaining_amount = data.get('remaining_amount', mortgage.remaining_amount)
    mortgage.interest_rate = data.get('interest_rate', mortgage.interest_rate)
    mortgage.term_months = data.get('term_months', mortgage.term_months)
    mortgage.remaining_months = data.get('remaining_months', mortgage.remaining_months)
    mortgage.monthly_payment = data.get('monthly_payment', mortgage.monthly_payment)
    mortgage.payment_type = data.get('payment_type', mortgage.payment_type)
    mortgage.payment_day = data.get('payment_day', mortgage.payment_day)
    mortgage.bank_name = data.get('bank_name', mortgage.bank_name)
    mortgage.insurance_yearly = data.get('insurance_yearly', mortgage.insurance_yearly)
    mortgage.property_tax_yearly = data.get('property_tax_yearly', mortgage.property_tax_yearly)
    
    if data.get('start_date'):
        mortgage.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
    if data.get('next_payment_date'):
        mortgage.next_payment_date = datetime.strptime(data['next_payment_date'], '%Y-%m-%d').date()
    
    db.session.commit()
    return jsonify({'message': 'Ипотека обновлена'})

@app.route('/api/mortgages/<int:id>/pay', methods=['POST'])
def pay_mortgage(id):
    mortgage = Mortgage.query.get_or_404(id)
    data = request.json
    amount = data['amount']
    is_extra = data.get('is_extra', False)
    reduce_type = data.get('reduce_type', 'term')
    
    monthly_rate = mortgage.interest_rate / 100 / 12
    interest_part = mortgage.remaining_amount * monthly_rate
    principal_part = amount - interest_part if not is_extra else amount
    
    mortgage.remaining_amount = max(0, mortgage.remaining_amount - principal_part)
    
    payment = MortgagePayment(
        mortgage_id=id,
        date=date.today(),
        amount=amount,
        principal=principal_part,
        interest=interest_part if not is_extra else 0,
        is_extra=is_extra,
        reduce_type=reduce_type
    )
    db.session.add(payment)
    
    if is_extra:
        mortgage.extra_payments_total += amount
        
        if reduce_type == 'term' and mortgage.remaining_months > 1:
            if monthly_rate > 0:
                new_months = -math.log(1 - (mortgage.remaining_amount * monthly_rate / mortgage.monthly_payment)) / math.log(1 + monthly_rate)
                mortgage.remaining_months = max(1, math.ceil(new_months))
            else:
                mortgage.remaining_months = math.ceil(mortgage.remaining_amount / mortgage.monthly_payment)
        elif reduce_type == 'payment':
            if mortgage.remaining_months > 0 and monthly_rate > 0:
                mortgage.monthly_payment = mortgage.remaining_amount * (monthly_rate * (1 + monthly_rate)**mortgage.remaining_months) / ((1 + monthly_rate)**mortgage.remaining_months - 1)
            elif mortgage.remaining_months > 0:
                mortgage.monthly_payment = mortgage.remaining_amount / mortgage.remaining_months
    else:
        mortgage.remaining_months = max(0, mortgage.remaining_months - 1)
    
    if mortgage.remaining_amount > 0:
        mortgage.next_payment_date = mortgage.next_payment_date + relativedelta(months=1)
    
    db.session.commit()
    return jsonify({
        'message': 'Платёж внесён',
        'remaining_amount': mortgage.remaining_amount,
        'remaining_months': mortgage.remaining_months,
        'monthly_payment': round(mortgage.monthly_payment, 2)
    })

@app.route('/api/mortgages/<int:id>/payments', methods=['GET'])
def get_mortgage_payments(id):
    payments = MortgagePayment.query.filter_by(mortgage_id=id).order_by(MortgagePayment.date.desc()).all()
    return jsonify([{
        'id': p.id,
        'date': p.date.isoformat(),
        'amount': p.amount,
        'principal': p.principal,
        'interest': p.interest,
        'is_extra': p.is_extra,
        'reduce_type': p.reduce_type
    } for p in payments])

@app.route('/api/mortgages/<int:id>', methods=['DELETE'])
def delete_mortgage(id):
    MortgagePayment.query.filter_by(mortgage_id=id).delete()
    mortgage = Mortgage.query.get_or_404(id)
    db.session.delete(mortgage)
    db.session.commit()
    return jsonify({'message': 'Ипотека удалена'})

# --- Бонусные карты ---
@app.route('/api/bonus-cards', methods=['GET'])
def get_bonus_cards():
    cards = BonusCard.query.order_by(BonusCard.name).all()
    return jsonify([{
        'id': c.id,
        'name': c.name,
        'store_name': c.store_name,
        'card_number': c.card_number,
        'barcode_type': c.barcode_type,
        'icon': c.icon,
        'color': c.color,
        'bonus_balance': c.bonus_balance,
        'notes': c.notes,
        'created_at': c.created_at.isoformat()
    } for c in cards])

@app.route('/api/bonus-cards', methods=['POST'])
def create_bonus_card():
    data = request.json
    card = BonusCard(
        name=data['name'],
        store_name=data.get('store_name', ''),
        card_number=data['card_number'],
        barcode_type=data.get('barcode_type', 'CODE128'),
        icon=data.get('icon', '🎫'),
        color=data.get('color', '#667eea'),
        bonus_balance=data.get('bonus_balance', 0),
        notes=data.get('notes', '')
    )
    db.session.add(card)
    db.session.commit()
    return jsonify({'id': card.id, 'message': 'Бонусная карта добавлена'}), 201

@app.route('/api/bonus-cards/<int:id>', methods=['PUT'])
def update_bonus_card(id):
    card = BonusCard.query.get_or_404(id)
    data = request.json
    
    card.name = data.get('name', card.name)
    card.store_name = data.get('store_name', card.store_name)
    card.card_number = data.get('card_number', card.card_number)
    card.barcode_type = data.get('barcode_type', card.barcode_type)
    card.icon = data.get('icon', card.icon)
    card.color = data.get('color', card.color)
    card.bonus_balance = data.get('bonus_balance', card.bonus_balance)
    card.notes = data.get('notes', card.notes)
    
    db.session.commit()
    return jsonify({'message': 'Бонусная карта обновлена'})

@app.route('/api/bonus-cards/<int:id>', methods=['DELETE'])
def delete_bonus_card(id):
    card = BonusCard.query.get_or_404(id)
    db.session.delete(card)
    db.session.commit()
    return jsonify({'message': 'Бонусная карта удалена'})

# --- Калькулятор кредитов ---
@app.route('/api/calculator/credit', methods=['POST'])
def calculate_credit():
    data = request.json
    amount = data['amount']
    rate = data['interest_rate'] / 100 / 12
    term = data['term_months']
    extra_payment = data.get('extra_payment', 0)
    start_date_str = data.get('start_date')
    
    # Рассчитываем ежемесячный платёж
    if rate > 0:
        monthly_payment = amount * (rate * (1 + rate)**term) / ((1 + rate)**term - 1)
    else:
        monthly_payment = amount / term
    
    # Определяем сколько месяцев уже прошло
    months_passed = 0
    if start_date_str:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        today = date.today()
        if start_date < today:
            months_passed = (today.year - start_date.year) * 12 + (today.month - start_date.month)
            payment_day = data.get('payment_day', start_date.day)
            if today.day < payment_day:
                months_passed = max(0, months_passed - 1)
    
    # Полный график платежей
    schedule = []
    remaining = amount
    total_interest = 0
    total_principal = 0
    month = 0
    
    while remaining > 0.01 and month < term * 2:
        month += 1
        interest = remaining * rate
        principal = monthly_payment - interest
        
        if extra_payment > 0 and month > months_passed:
            principal += extra_payment
        
        if principal > remaining:
            principal = remaining
            interest = remaining * rate
        
        remaining = max(0, remaining - principal)
        total_interest += interest
        total_principal += principal
        
        is_paid = month <= months_passed
        
        schedule.append({
            'month': month,
            'payment': round(monthly_payment + (extra_payment if month > months_passed else 0), 2),
            'principal': round(principal, 2),
            'interest': round(interest, 2),
            'remaining': round(remaining, 2),
            'is_paid': is_paid,
            'total_paid': round(total_principal + total_interest, 2)
        })
        
        if remaining <= 0.01:
            break
    
    # Рассчитываем текущий остаток (после оплаченных месяцев)
    current_remaining = amount
    paid_principal = 0
    paid_interest = 0
    for i in range(min(months_passed, len(schedule))):
        paid_principal += schedule[i]['principal']
        paid_interest += schedule[i]['interest']
        current_remaining = schedule[i]['remaining']
    
    total_payment = monthly_payment * term
    overpayment = total_payment - amount
    
    # Стратегии
    strategies = {
        'base': {
            'term_months': term,
            'monthly_payment': round(monthly_payment, 2),
            'total_payment': round(total_payment, 2),
            'overpayment': round(overpayment, 2)
        }
    }
    
    # Расчёт с досрочными платежами (если указаны)
    if extra_payment > 0:
        extra_schedule = []
        extra_remaining = current_remaining  # Начинаем с текущего остатка
        extra_total_interest = paid_interest
        extra_month = months_passed
        
        while extra_remaining > 0.01 and extra_month < term * 2:
            extra_month += 1
            interest = extra_remaining * rate
            principal = monthly_payment + extra_payment - interest
            
            if principal > extra_remaining:
                principal = extra_remaining
            
            extra_remaining = max(0, extra_remaining - principal)
            extra_total_interest += interest
            
            extra_schedule.append({
                'month': extra_month,
                'payment': round(monthly_payment + extra_payment, 2),
                'principal': round(principal, 2),
                'interest': round(interest, 2),
                'remaining': round(extra_remaining, 2)
            })
            
            if extra_remaining <= 0.01:
                break
        
        new_term = extra_month
        savings = overpayment - extra_total_interest
        
        strategies['with_extra'] = {
            'term_months': new_term,
            'remaining_months': new_term - months_passed,
            'monthly_payment': round(monthly_payment + extra_payment, 2),
            'total_payment': round(paid_principal + paid_interest + sum(s['payment'] for s in extra_schedule), 2),
            'overpayment': round(extra_total_interest, 2),
            'savings': round(savings, 2),
            'months_saved': term - new_term
        }
    
    return jsonify({
        'monthly_payment': round(monthly_payment, 2),
        'total_payment': round(total_payment, 2),
        'overpayment': round(overpayment, 2),
        'months_passed': months_passed,
        'current_remaining': round(current_remaining, 2),
        'remaining_months': max(0, term - months_passed),
        'paid_principal': round(paid_principal, 2),
        'paid_interest': round(paid_interest, 2),
        'schedule': schedule[:36],  # Первые 36 месяцев для отображения
        'strategies': strategies
    })

@app.route('/api/calculator/mortgage', methods=['POST'])
def calculate_mortgage():
    data = request.json
    property_value = data['property_value']
    down_payment = data.get('down_payment', 0)
    amount = property_value - down_payment
    rate = data['interest_rate'] / 100 / 12
    term = data['term_months']
    payment_type = data.get('payment_type', 'annuity')
    
    schedule = []
    
    if payment_type == 'annuity':
        if rate > 0:
            monthly_payment = amount * (rate * (1 + rate)**term) / ((1 + rate)**term - 1)
        else:
            monthly_payment = amount / term
        
        remaining = amount
        total_interest = 0
        
        for month in range(1, term + 1):
            interest = remaining * rate
            principal = monthly_payment - interest
            remaining -= principal
            total_interest += interest
            
            if month <= 12 or month > term - 12 or month % 12 == 0:
                schedule.append({
                    'month': month,
                    'payment': round(monthly_payment, 2),
                    'principal': round(principal, 2),
                    'interest': round(interest, 2),
                    'remaining': round(max(0, remaining), 2)
                })
        
        total_payment = monthly_payment * term
        
    else:
        principal_part = amount / term
        remaining = amount
        total_interest = 0
        total_payment = 0
        
        for month in range(1, term + 1):
            interest = remaining * rate
            payment = principal_part + interest
            remaining -= principal_part
            total_interest += interest
            total_payment += payment
            
            if month <= 12 or month > term - 12 or month % 12 == 0:
                schedule.append({
                    'month': month,
                    'payment': round(payment, 2),
                    'principal': round(principal_part, 2),
                    'interest': round(interest, 2),
                    'remaining': round(max(0, remaining), 2)
                })
        
        monthly_payment = schedule[0]['payment'] if schedule else 0
    
    return jsonify({
        'loan_amount': amount,
        'monthly_payment': round(monthly_payment, 2),
        'monthly_payment_last': round(schedule[-1]['payment'], 2) if schedule else 0,
        'total_payment': round(total_payment, 2),
        'overpayment': round(total_interest, 2),
        'schedule': schedule
    })

# --- Магазины и цены ---
@app.route('/api/stores', methods=['GET'])
def get_stores():
    stores = Store.query.all()
    result = []
    
    for s in stores:
        prices = ProductPrice.query.filter_by(store_id=s.id).all()
        avg_price_ratio = 0
        
        if prices:
            ratios = []
            for p in prices:
                min_price = db.session.query(db.func.min(ProductPrice.price)).filter(
                    ProductPrice.product_id == p.product_id
                ).scalar()
                if min_price and min_price > 0:
                    ratios.append(p.price / min_price)
            if ratios:
                avg_price_ratio = sum(ratios) / len(ratios)
        
        result.append({
            'id': s.id,
            'name': s.name,
            'store_type': s.store_type,
            'address': s.address,
            'icon': s.icon,
            'color': s.color,
            'products_count': len(prices),
            'price_rating': round(5 - (avg_price_ratio - 1) * 2, 1) if avg_price_ratio > 0 else 0
        })
    
    return jsonify(result)

@app.route('/api/stores', methods=['POST'])
def create_store():
    data = request.json
    store = Store(
        name=data['name'],
        store_type=data.get('store_type', 'grocery'),
        address=data.get('address', ''),
        icon=data.get('icon', '🏪'),
        color=data.get('color', '#667eea')
    )
    db.session.add(store)
    db.session.commit()
    return jsonify({'id': store.id, 'message': 'Магазин добавлен'}), 201

@app.route('/api/stores/<int:id>', methods=['PUT'])
def update_store(id):
    store = Store.query.get_or_404(id)
    data = request.json
    
    store.name = data.get('name', store.name)
    store.store_type = data.get('store_type', store.store_type)
    store.address = data.get('address', store.address)
    store.icon = data.get('icon', store.icon)
    store.color = data.get('color', store.color)
    
    db.session.commit()
    return jsonify({'message': 'Магазин обновлён'})

@app.route('/api/stores/<int:id>', methods=['DELETE'])
def delete_store(id):
    ProductPrice.query.filter_by(store_id=id).delete()
    Transaction.query.filter_by(store_id=id).update({'store_id': None})
    store = Store.query.get_or_404(id)
    db.session.delete(store)
    db.session.commit()
    return jsonify({'message': 'Магазин удалён'})

@app.route('/api/products', methods=['GET'])
def get_products():
    products = Product.query.order_by(Product.name).all()
    result = []
    
    for p in products:
        prices = ProductPrice.query.filter_by(product_id=p.id).order_by(ProductPrice.date.desc()).all()
        
        store_prices = {}
        for price in prices:
            if price.store_id not in store_prices:
                store_prices[price.store_id] = {
                    'store_id': price.store_id,
                    'store_name': price.store.name,
                    'store_icon': price.store.icon,
                    'price': price.price,
                    'is_sale': price.is_sale,
                    'date': price.date.isoformat()
                }
        
        min_price = min([sp['price'] for sp in store_prices.values()]) if store_prices else 0
        max_price = max([sp['price'] for sp in store_prices.values()]) if store_prices else 0
        
        best_store = None
        for sp in store_prices.values():
            if sp['price'] == min_price:
                best_store = sp
                break
        
        result.append({
            'id': p.id,
            'name': p.name,
            'category': p.category,
            'unit': p.unit,
            'icon': p.icon,
            'prices': list(store_prices.values()),
            'min_price': min_price,
            'max_price': max_price,
            'price_diff': round(max_price - min_price, 2),
            'price_diff_percent': round(((max_price - min_price) / min_price) * 100, 1) if min_price > 0 else 0,
            'best_store': best_store
        })
    
    return jsonify(result)

@app.route('/api/products', methods=['POST'])
def create_product():
    data = request.json
    product = Product(
        name=data['name'],
        category=data.get('category', 'other'),
        unit=data.get('unit', 'шт'),
        icon=data.get('icon', '📦')
    )
    db.session.add(product)
    db.session.commit()
    return jsonify({'id': product.id, 'message': 'Товар добавлен'}), 201

@app.route('/api/products/<int:id>', methods=['PUT'])
def update_product(id):
    product = Product.query.get_or_404(id)
    data = request.json
    
    product.name = data.get('name', product.name)
    product.category = data.get('category', product.category)
    product.unit = data.get('unit', product.unit)
    product.icon = data.get('icon', product.icon)
    
    db.session.commit()
    return jsonify({'message': 'Товар обновлён'})

@app.route('/api/products/<int:id>/prices', methods=['POST'])
def add_product_price(id):
    data = request.json
    price = ProductPrice(
        product_id=id,
        store_id=data['store_id'],
        price=data['price'],
        is_sale=data.get('is_sale', False),
        date=datetime.strptime(data['date'], '%Y-%m-%d').date() if data.get('date') else date.today()
    )
    db.session.add(price)
    db.session.commit()
    return jsonify({'id': price.id, 'message': 'Цена добавлена'}), 201

@app.route('/api/products/<int:id>', methods=['DELETE'])
def delete_product(id):
    ProductPrice.query.filter_by(product_id=id).delete()
    product = Product.query.get_or_404(id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Товар удалён'})

# --- Инвестиции ---
@app.route('/api/investments', methods=['GET'])
def get_investments():
    account_id = request.args.get('account_id', type=int)
    query = Investment.query
    if account_id:
        query = query.filter_by(account_id=account_id)
    
    investments = query.order_by(Investment.asset_type, Investment.ticker).all()
    result = []
    
    for i in investments:
        invested = i.quantity * i.avg_buy_price
        current_value = i.quantity * i.current_price
        profit = current_value - invested
        profit_percent = (profit / invested * 100) if invested > 0 else 0
        
        # Получаем историю транзакций
        transactions = InvestmentTransaction.query.filter_by(
            investment_id=i.id
        ).order_by(InvestmentTransaction.date.desc()).all()
        
        transactions_data = [{
            'id': t.id,
            'type': t.transaction_type,
            'quantity': t.quantity,
            'price': t.price,
            'total_amount': t.total_amount,
            'commission': t.commission,
            'date': t.date.isoformat(),
            'notes': t.notes
        } for t in transactions]
        
        # Статистика покупок
        buy_transactions = [t for t in transactions if t.transaction_type == 'buy']
        total_bought = sum(t.quantity for t in buy_transactions)
        total_spent = sum(t.total_amount + t.commission for t in buy_transactions)
        
        result.append({
            'id': i.id,
            'account_id': i.account_id,
            'ticker': i.ticker,
            'name': i.name,
            'asset_type': i.asset_type,
            'quantity': i.quantity,
            'avg_buy_price': i.avg_buy_price,
            'current_price': i.current_price,
            'currency': i.currency,
            'sector': i.sector,
            'invested': round(invested, 2),
            'current_value': round(current_value, 2),
            'profit': round(profit, 2),
            'profit_percent': round(profit_percent, 2),
            'dividends_received': i.dividends_received,
            'total_return': round(profit + i.dividends_received, 2),
            'last_updated': i.last_updated.isoformat(),
            'transactions': transactions_data,
            'transactions_count': len(transactions),
            'total_bought_quantity': total_bought,
            'total_spent': round(total_spent, 2)
        })
    
    return jsonify(result)

@app.route('/api/investments', methods=['POST'])
def create_investment():
    data = request.json
    
    # Проверяем, есть ли уже такой тикер на этом счёте
    existing = Investment.query.filter_by(
        account_id=data['account_id'],
        ticker=data['ticker'].upper()
    ).first()
    
    if existing:
        # Добавляем к существующей позиции
        old_total = existing.quantity * existing.avg_buy_price
        new_total = data['quantity'] * data['avg_buy_price']
        existing.quantity += data['quantity']
        existing.avg_buy_price = (old_total + new_total) / existing.quantity
        existing.current_price = data.get('current_price', data['avg_buy_price'])
        existing.last_updated = datetime.utcnow()
        
        # Записываем транзакцию
        trans = InvestmentTransaction(
            investment_id=existing.id,
            transaction_type='buy',
            quantity=data['quantity'],
            price=data['avg_buy_price'],
            total_amount=data['quantity'] * data['avg_buy_price'],
            commission=data.get('commission', 0),
            date=datetime.strptime(data['date'], '%Y-%m-%d').date() if data.get('date') else date.today(),
            notes=data.get('notes', '')
        )
        db.session.add(trans)
        db.session.commit()
        
        return jsonify({'id': existing.id, 'message': 'Позиция пополнена'}), 200
    
    investment = Investment(
        account_id=data['account_id'],
        ticker=data['ticker'].upper(),
        name=data['name'],
        asset_type=data.get('asset_type', 'stock'),
        quantity=data['quantity'],
        avg_buy_price=data['avg_buy_price'],
        current_price=data.get('current_price', data['avg_buy_price']),
        currency=data.get('currency', 'RUB'),
        sector=data.get('sector', '')
    )
    db.session.add(investment)
    db.session.flush()  # Получаем ID
    
    # Записываем первую транзакцию покупки
    trans = InvestmentTransaction(
        investment_id=investment.id,
        transaction_type='buy',
        quantity=data['quantity'],
        price=data['avg_buy_price'],
        total_amount=data['quantity'] * data['avg_buy_price'],
        commission=data.get('commission', 0),
        date=datetime.strptime(data['date'], '%Y-%m-%d').date() if data.get('date') else date.today(),
        notes=data.get('notes', 'Первая покупка')
    )
    db.session.add(trans)
    db.session.commit()
    
    return jsonify({'id': investment.id, 'message': 'Инвестиция добавлена'}), 201

@app.route('/api/investments/<int:id>', methods=['PUT'])
def update_investment(id):
    investment = Investment.query.get_or_404(id)
    data = request.json
    
    investment.name = data.get('name', investment.name)
    investment.asset_type = data.get('asset_type', investment.asset_type)
    investment.quantity = data.get('quantity', investment.quantity)
    investment.avg_buy_price = data.get('avg_buy_price', investment.avg_buy_price)
    investment.current_price = data.get('current_price', investment.current_price)
    investment.currency = data.get('currency', investment.currency)
    investment.sector = data.get('sector', investment.sector)
    investment.dividends_received = data.get('dividends_received', investment.dividends_received)
    investment.last_updated = datetime.utcnow()
    
    db.session.commit()
    return jsonify({'message': 'Инвестиция обновлена'})

@app.route('/api/investments/<int:id>/buy', methods=['POST'])
def buy_investment(id):
    investment = Investment.query.get_or_404(id)
    data = request.json
    
    quantity = data['quantity']
    price = data['price']
    commission = data.get('commission', 0)
    
    total_invested = investment.quantity * investment.avg_buy_price + quantity * price
    investment.quantity += quantity
    investment.avg_buy_price = total_invested / investment.quantity
    investment.current_price = price
    investment.last_updated = datetime.utcnow()
    
    # Записываем транзакцию
    trans = InvestmentTransaction(
        investment_id=id,
        transaction_type='buy',
        quantity=quantity,
        price=price,
        total_amount=quantity * price,
        commission=commission,
        date=datetime.strptime(data['date'], '%Y-%m-%d').date() if data.get('date') else date.today(),
        notes=data.get('notes', '')
    )
    db.session.add(trans)
    db.session.commit()
    
    return jsonify({
        'message': 'Покупка добавлена',
        'quantity': investment.quantity,
        'avg_buy_price': round(investment.avg_buy_price, 2)
    })


@app.route('/api/investments/<int:id>/sell', methods=['POST'])
def sell_investment(id):
    investment = Investment.query.get_or_404(id)
    data = request.json
    
    quantity = data['quantity']
    price = data['price']
    commission = data.get('commission', 0)
    
    if quantity > investment.quantity:
        return jsonify({'error': 'Недостаточно акций'}), 400
    
    profit = (price - investment.avg_buy_price) * quantity - commission
    investment.quantity -= quantity
    investment.current_price = price
    investment.last_updated = datetime.utcnow()
    
    # Записываем транзакцию
    trans = InvestmentTransaction(
        investment_id=id,
        transaction_type='sell',
        quantity=quantity,
        price=price,
        total_amount=quantity * price,
        commission=commission,
        date=datetime.strptime(data['date'], '%Y-%m-%d').date() if data.get('date') else date.today(),
        notes=data.get('notes', f'Прибыль: {profit:.2f}')
    )
    db.session.add(trans)
    
    if investment.quantity == 0:
        db.session.delete(investment)
    
    db.session.commit()
    return jsonify({
        'message': 'Продажа выполнена',
        'profit': round(profit, 2),
        'remaining_quantity': investment.quantity if investment.quantity > 0 else 0
    })

@app.route('/api/investments/<int:id>/dividend', methods=['POST'])
def add_dividend(id):
    """Добавить полученный дивиденд"""
    investment = Investment.query.get_or_404(id)
    data = request.json
    
    amount = data['amount']
    investment.dividends_received += amount
    investment.last_updated = datetime.utcnow()
    
    # Записываем транзакцию
    trans = InvestmentTransaction(
        investment_id=id,
        transaction_type='dividend',
        quantity=0,
        price=0,
        total_amount=amount,
        commission=data.get('tax', 0),  # Налог на дивиденды
        date=datetime.strptime(data['date'], '%Y-%m-%d').date() if data.get('date') else date.today(),
        notes=data.get('notes', 'Дивиденды')
    )
    db.session.add(trans)
    db.session.commit()
    
    return jsonify({
        'message': 'Дивиденды добавлены',
        'total_dividends': investment.dividends_received
    })


@app.route('/api/investments/<int:id>/transactions', methods=['GET'])
def get_investment_transactions(id):
    """Получить историю операций по инвестиции"""
    transactions = InvestmentTransaction.query.filter_by(
        investment_id=id
    ).order_by(InvestmentTransaction.date.desc()).all()
    
    return jsonify([{
        'id': t.id,
        'type': t.transaction_type,
        'quantity': t.quantity,
        'price': t.price,
        'total_amount': t.total_amount,
        'commission': t.commission,
        'date': t.date.isoformat(),
        'notes': t.notes
    } for t in transactions])


@app.route('/api/investments/transactions/<int:id>', methods=['DELETE'])
def delete_investment_transaction(id):
    """Удалить транзакцию (и пересчитать позицию)"""
    trans = InvestmentTransaction.query.get_or_404(id)
    investment = trans.investment
    
    # Пересчитываем позицию
    if trans.transaction_type == 'buy':
        investment.quantity -= trans.quantity
        # Пересчитываем среднюю цену
        remaining_trans = InvestmentTransaction.query.filter(
            InvestmentTransaction.investment_id == investment.id,
            InvestmentTransaction.transaction_type == 'buy',
            InvestmentTransaction.id != id
        ).all()
        if remaining_trans:
            total_qty = sum(t.quantity for t in remaining_trans)
            total_amount = sum(t.total_amount for t in remaining_trans)
            investment.avg_buy_price = total_amount / total_qty if total_qty > 0 else 0
            investment.quantity = total_qty
    elif trans.transaction_type == 'sell':
        investment.quantity += trans.quantity
    elif trans.transaction_type == 'dividend':
        investment.dividends_received -= trans.total_amount
    
    db.session.delete(trans)
    
    # Если позиция пустая - удаляем
    if investment.quantity <= 0:
        db.session.delete(investment)
    
    db.session.commit()
    return jsonify({'message': 'Транзакция удалена'})

@app.route('/api/investments/<int:id>', methods=['DELETE'])
def delete_investment(id):
    # Удаляем все транзакции
    InvestmentTransaction.query.filter_by(investment_id=id).delete()
    investment = Investment.query.get_or_404(id)
    db.session.delete(investment)
    db.session.commit()
    return jsonify({'message': 'Инвестиция удалена'})

@app.route('/api/investments/summary', methods=['GET'])
def get_investments_summary():
    investments = Investment.query.all()
    
    by_type = {}
    by_sector = {}
    by_currency = {}
    
    total_invested = 0
    total_current = 0
    total_dividends = 0
    
    for i in investments:
        invested = i.quantity * i.avg_buy_price
        current = i.quantity * i.current_price
        
        total_invested += invested
        total_current += current
        total_dividends += i.dividends_received
        
        if i.asset_type not in by_type:
            by_type[i.asset_type] = {'invested': 0, 'current': 0, 'count': 0}
        by_type[i.asset_type]['invested'] += invested
        by_type[i.asset_type]['current'] += current
        by_type[i.asset_type]['count'] += 1
        
        sector = i.sector or 'Другое'
        if sector not in by_sector:
            by_sector[sector] = {'invested': 0, 'current': 0, 'count': 0}
        by_sector[sector]['invested'] += invested
        by_sector[sector]['current'] += current
        by_sector[sector]['count'] += 1
        
        if i.currency not in by_currency:
            by_currency[i.currency] = {'invested': 0, 'current': 0, 'count': 0}
        by_currency[i.currency]['invested'] += invested
        by_currency[i.currency]['current'] += current
        by_currency[i.currency]['count'] += 1
    
    return jsonify({
        'total_invested': round(total_invested, 2),
        'total_current': round(total_current, 2),
        'total_profit': round(total_current - total_invested, 2),
        'total_profit_percent': round(((total_current - total_invested) / total_invested * 100), 2) if total_invested > 0 else 0,
        'total_dividends': round(total_dividends, 2),
        'total_return': round(total_current - total_invested + total_dividends, 2),
        'positions_count': len(investments),
        'by_type': by_type,
        'by_sector': by_sector,
        'by_currency': by_currency
    })

# --- Налоги ---
@app.route('/api/taxes', methods=['GET'])
def get_taxes():
    year = request.args.get('year', date.today().year, type=int)
    
    payments = TaxPayment.query.filter(
        db.extract('year', TaxPayment.period_start) == year
    ).order_by(TaxPayment.due_date).all()
    
    reserves = db.session.query(
        TaxReserve.business_account_id,
        Account.name,
        db.func.sum(TaxReserve.income_amount).label('total_income'),
        db.func.sum(TaxReserve.tax_amount).label('total_tax'),
        db.func.sum(db.case((TaxReserve.is_transferred == False, TaxReserve.tax_amount), else_=0)).label('pending_tax')
    ).join(Account, TaxReserve.business_account_id == Account.id).filter(
        db.extract('year', TaxReserve.date) == year
    ).group_by(TaxReserve.business_account_id, Account.name).all()
    
    # Получаем налоговые резервные счета
    tax_reserve_accounts = Account.query.filter_by(is_tax_reserve=True).all()
    
    return jsonify({
        'payments': [{
            'id': p.id,
            'tax_type': p.tax_type,
            'amount': p.amount,
            'period_start': p.period_start.isoformat(),
            'period_end': p.period_end.isoformat(),
            'due_date': p.due_date.isoformat(),
            'paid_date': p.paid_date.isoformat() if p.paid_date else None,
            'is_paid': p.is_paid,
            'description': p.description,
            'is_overdue': not p.is_paid and p.due_date < date.today()
        } for p in payments],
        'reserves': [{
            'account_id': r.business_account_id,
            'account_name': r.name,
            'total_income': r.total_income,
            'total_tax': r.total_tax,
            'pending_tax': r.pending_tax
        } for r in reserves],
        'tax_reserve_accounts': [{
            'id': a.id,
            'name': a.name,
            'balance': a.balance,
            'icon': a.icon,
            'color': a.color
        } for a in tax_reserve_accounts],
        'summary': {
            'total_paid': sum(p.amount for p in payments if p.is_paid),
            'total_pending': sum(p.amount for p in payments if not p.is_paid),
            'total_reserves': sum(r.pending_tax for r in reserves),
            'total_in_reserve_accounts': sum(a.balance for a in tax_reserve_accounts)
        }
    })

@app.route('/api/taxes', methods=['POST'])
def create_tax_payment():
    data = request.json
    payment = TaxPayment(
        tax_type=data['tax_type'],
        amount=data['amount'],
        period_start=datetime.strptime(data['period_start'], '%Y-%m-%d').date(),
        period_end=datetime.strptime(data['period_end'], '%Y-%m-%d').date(),
        due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date(),
        description=data.get('description', '')
    )
    db.session.add(payment)
    db.session.commit()
    return jsonify({'id': payment.id, 'message': 'Налог добавлен'}), 201

@app.route('/api/taxes/<int:id>', methods=['PUT'])
def update_tax_payment(id):
    payment = TaxPayment.query.get_or_404(id)
    data = request.json
    
    payment.tax_type = data.get('tax_type', payment.tax_type)
    payment.amount = data.get('amount', payment.amount)
    payment.description = data.get('description', payment.description)
    
    if data.get('period_start'):
        payment.period_start = datetime.strptime(data['period_start'], '%Y-%m-%d').date()
    if data.get('period_end'):
        payment.period_end = datetime.strptime(data['period_end'], '%Y-%m-%d').date()
    if data.get('due_date'):
        payment.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
    
    db.session.commit()
    return jsonify({'message': 'Налог обновлён'})

@app.route('/api/taxes/<int:id>', methods=['DELETE'])
def delete_tax_payment(id):
    payment = TaxPayment.query.get_or_404(id)
    db.session.delete(payment)
    db.session.commit()
    return jsonify({'message': 'Налог удалён'})

@app.route('/api/taxes/<int:id>/pay', methods=['POST'])
def pay_tax(id):
    payment = TaxPayment.query.get_or_404(id)
    payment.is_paid = True
    payment.paid_date = date.today()
    db.session.commit()
    return jsonify({'message': 'Налог оплачен'})

@app.route('/api/taxes/transfer', methods=['POST'])
def transfer_tax_reserve():
    data = request.json
    business_account_id = data['business_account_id']
    tax_account_id = data['tax_account_id']
    
    pending = db.session.query(db.func.sum(TaxReserve.tax_amount)).filter(
        TaxReserve.business_account_id == business_account_id,
        TaxReserve.is_transferred == False
    ).scalar() or 0
    
    if pending <= 0:
        return jsonify({'error': 'Нет средств для перевода'}), 400
    
    business_account = Account.query.get(business_account_id)
    tax_account = Account.query.get(tax_account_id)
    
    business_account.balance -= pending
    tax_account.balance += pending
    
    TaxReserve.query.filter_by(
        business_account_id=business_account_id,
        is_transferred=False
    ).update({'is_transferred': True})
    
    transaction = Transaction(
        amount=pending,
        type='transfer',
        description='Перевод налогового резерва',
        account_id=business_account_id,
        to_account_id=tax_account_id,
        is_tax_transfer=True,
        date=date.today()
    )
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify({
        'message': 'Налог переведён',
        'amount': pending
    })

# --- AI Аналитика (DeepSeek) ---
@app.route('/api/ai/analyze', methods=['POST'])
def ai_analyze():
    """AI-анализ расходов с помощью DeepSeek"""
    if not DEEPSEEK_API_KEY:
        return jsonify({'error': 'DeepSeek API key not configured'}), 400
    
    data = request.json
    period = data.get('period', 'month')
    
    # Получаем данные за период
    today = date.today()
    if period == 'month':
        start_date = today.replace(day=1)
    elif period == 'quarter':
        start_date = today - relativedelta(months=3)
    elif period == 'year':
        start_date = today.replace(month=1, day=1)
    else:
        start_date = today - relativedelta(months=1)
    
    # Собираем статистику
    expenses_by_category = db.session.query(
        Category.name,
        Category.icon,
        db.func.sum(Transaction.amount).label('total')
    ).join(Transaction).filter(
        Transaction.type == 'expense',
        Transaction.date >= start_date
    ).group_by(Category.id).order_by(db.desc('total')).all()
    
    income_total = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.type == 'income',
        Transaction.date >= start_date
    ).scalar() or 0
    
    expense_total = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.type == 'expense',
        Transaction.date >= start_date
    ).scalar() or 0
    
    # Последние крупные траты
    large_expenses = Transaction.query.filter(
        Transaction.type == 'expense',
        Transaction.date >= start_date
    ).order_by(Transaction.amount.desc()).limit(10).all()
    
    # Формируем промпт для AI
    expense_list = "\n".join([
        f"- {e.icon} {e.name}: {e.total:,.0f} ₽" for e in expenses_by_category
    ])
    
    large_expense_list = "\n".join([
        f"- {t.description or t.category.name if t.category else 'Без категории'}: {t.amount:,.0f} ₽ ({t.date})"
        for t in large_expenses
    ])
    
    prompt = f"""Ты - финансовый консультант. Проанализируй расходы семьи за период и дай рекомендации.

ДАННЫЕ:
Период: {period}
Общий доход: {income_total:,.0f} ₽
Общие расходы: {expense_total:,.0f} ₽
Накоплено: {income_total - expense_total:,.0f} ₽
Норма сбережений: {((income_total - expense_total) / income_total * 100) if income_total > 0 else 0:.1f}%

РАСХОДЫ ПО КАТЕГОРИЯМ:
{expense_list}

КРУПНЫЕ ТРАТЫ:
{large_expense_list}

ЗАДАНИЕ:
1. Оцени структуру расходов (хорошо/нормально/плохо)
2. Найди категории где можно сэкономить
3. Укажи подозрительные или нерациональные траты
4. Дай 3-5 конкретных советов по оптимизации бюджета
5. Похвали если что-то сделано хорошо

Отвечай на русском, структурированно, с эмодзи. Будь конкретным и полезным."""

    try:
        response = requests.post(
            DEEPSEEK_API_URL,
            headers={
                'Authorization': f'Bearer {DEEPSEEK_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'deepseek-chat',
                'messages': [
                    {'role': 'system', 'content': 'Ты опытный финансовый консультант, помогающий семьям управлять бюджетом.'},
                    {'role': 'user', 'content': prompt}
                ],
                'temperature': 0.7,
                'max_tokens': 2000
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            ai_response = result['choices'][0]['message']['content']
            
            # Кэшируем результат
            data_hash = hashlib.md5(f"{start_date}{expense_total}".encode()).hexdigest()
            
            # Удаляем старый кэш
            AIAnalysis.query.filter_by(analysis_type='expense', period=period).delete()
            
            # Сохраняем новый
            analysis = AIAnalysis(
                analysis_type='expense',
                period=period,
                data_hash=data_hash,
                result=ai_response
            )
            db.session.add(analysis)
            db.session.commit()
            
            return jsonify({
                'analysis': ai_response,
                'stats': {
                    'income': income_total,
                    'expense': expense_total,
                    'savings': income_total - expense_total,
                    'savings_rate': round((income_total - expense_total) / income_total * 100, 1) if income_total > 0 else 0
                }
            })
        else:
            return jsonify({'error': f'DeepSeek API error: {response.status_code}'}), 500
            
    except requests.exceptions.Timeout:
        return jsonify({'error': 'AI service timeout'}), 504
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/tips', methods=['GET'])
def ai_tips():
    """Получить быстрые советы на основе текущих данных"""
    tips = []
    today = date.today()
    first_day = today.replace(day=1)
    
    # Проверяем превышение бюджета
    over_budget = []
    categories = Category.query.filter(Category.budget_limit > 0, Category.type == 'expense').all()
    for cat in categories:
        spent = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.category_id == cat.id,
            Transaction.date >= first_day,
            Transaction.type == 'expense'
        ).scalar() or 0
        if spent > cat.budget_limit:
            over_budget.append({
                'category': cat.name,
                'icon': cat.icon,
                'budget': cat.budget_limit,
                'spent': spent,
                'over': spent - cat.budget_limit
            })
    
    if over_budget:
        tips.append({
            'type': 'warning',
            'icon': '⚠️',
            'title': 'Превышение бюджета',
            'message': f"Превышен бюджет в {len(over_budget)} категориях. Самое большое превышение: {over_budget[0]['icon']} {over_budget[0]['category']} (+{over_budget[0]['over']:,.0f} ₽)"
        })
    
    # Проверяем норму сбережений
    income = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.type == 'income',
        Transaction.date >= first_day
    ).scalar() or 0
    
    expense = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.type == 'expense',
        Transaction.date >= first_day
    ).scalar() or 0
    
    if income > 0:
        savings_rate = (income - expense) / income * 100
        if savings_rate < 10:
            tips.append({
                'type': 'danger',
                'icon': '🚨',
                'title': 'Низкая норма сбережений',
                'message': f'Вы откладываете только {savings_rate:.1f}% дохода. Рекомендуется минимум 20%.'
            })
        elif savings_rate >= 30:
            tips.append({
                'type': 'success',
                'icon': '🎉',
                'title': 'Отличная норма сбережений!',
                'message': f'Вы откладываете {savings_rate:.1f}% дохода. Так держать!'
            })
    
    # Проверяем ближайшие платежи
    upcoming = []
    credits = Credit.query.all()
    for c in credits:
        if c.next_payment_date and (c.next_payment_date - today).days <= 3:
            upcoming.append(f"{c.name}: {c.monthly_payment:,.0f} ₽")
    
    if upcoming:
        tips.append({
            'type': 'info',
            'icon': '📅',
            'title': 'Ближайшие платежи',
            'message': f"Не забудьте: {', '.join(upcoming[:3])}"
        })
    
    # Проверяем долг по кредитным картам
    cards = CreditCard.query.all()
    high_utilization = [c for c in cards if c.credit_limit > 0 and (c.current_debt / c.credit_limit) > 0.7]
    if high_utilization:
        tips.append({
            'type': 'warning',
            'icon': '💳',
            'title': 'Высокая загрузка кредитных карт',
            'message': f'{len(high_utilization)} карт(ы) использованы более чем на 70%. Это может влиять на кредитный рейтинг.'
        })
    
    return jsonify(tips)

# --- Статистика и дашборд ---
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    today = date.today()
    first_day_month = today.replace(day=1)
    first_day_year = today.replace(month=1, day=1)
    last_month_start = (first_day_month - timedelta(days=1)).replace(day=1)
    last_month_end = first_day_month - timedelta(days=1)
    
    accounts = Account.query.all()
    total_balance = sum(a.balance for a in accounts if a.account_type not in ['credit_card'])
    
    # Долг по кредитным картам
    total_credit_debt = 0
    for a in accounts:
        if a.account_type == 'credit_card':
            card = CreditCard.query.filter_by(account_id=a.id).first()
            if card:
                total_credit_debt += card.current_debt
    
    monthly_income = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.type == 'income',
        Transaction.date >= first_day_month
    ).scalar() or 0
    
    monthly_expense = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.type == 'expense',
        Transaction.date >= first_day_month
    ).scalar() or 0
    
    last_month_income = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.type == 'income',
        Transaction.date >= last_month_start,
        Transaction.date <= last_month_end
    ).scalar() or 0
    
    last_month_expense = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.type == 'expense',
        Transaction.date >= last_month_start,
        Transaction.date <= last_month_end
    ).scalar() or 0
    
    yearly_income = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.type == 'income',
        Transaction.date >= first_day_year
    ).scalar() or 0
    
    yearly_expense = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.type == 'expense',
        Transaction.date >= first_day_year
    ).scalar() or 0
    
    goals = Goal.query.filter_by(is_completed=False).all()
    goals_total_target = sum(g.target_amount for g in goals)
    goals_total_current = sum(g.current_amount for g in goals)
    completed_goals_month = Goal.query.filter(
        Goal.is_completed == True,
        Goal.completed_at >= first_day_month
    ).count()
    
    credits = Credit.query.all()
    mortgages = Mortgage.query.all()
    total_credit_remaining = sum(c.remaining_amount for c in credits)
    total_mortgage_remaining = sum(m.remaining_amount for m in mortgages)
    monthly_credit_payments = sum(c.monthly_payment for c in credits)
    monthly_mortgage_payments = sum(m.monthly_payment for m in mortgages)
    
    investments = Investment.query.all()
    total_invested = sum(i.quantity * i.avg_buy_price for i in investments)
    total_investment_value = sum(i.quantity * i.current_price for i in investments)
    
    pending_taxes = db.session.query(db.func.sum(TaxReserve.tax_amount)).filter(
        TaxReserve.is_transferred == False
    ).scalar() or 0
    
    # Баланс налоговых резервных счетов
    tax_reserve_balance = db.session.query(db.func.sum(Account.balance)).filter(
        Account.is_tax_reserve == True
    ).scalar() or 0
    
    upcoming_payments = []
    
    # Кредиты - показываем на 14 дней вперёд
    for c in credits:
        if c.next_payment_date:
            days_left = (c.next_payment_date - today).days
            if days_left <= 14 and days_left >= 0:
                upcoming_payments.append({
                    'type': 'credit',
                    'name': c.name,
                    'amount': c.monthly_payment,
                    'date': c.next_payment_date.isoformat(),
                    'days_left': days_left
                })
        elif c.payment_day:
            # Если next_payment_date не установлен, вычисляем по payment_day
            payment_date = today.replace(day=min(c.payment_day, 28))
            if payment_date < today:
                payment_date = payment_date + relativedelta(months=1)
            days_left = (payment_date - today).days
            if days_left <= 14:
                upcoming_payments.append({
                    'type': 'credit',
                    'name': c.name,
                    'amount': c.monthly_payment,
                    'date': payment_date.isoformat(),
                    'days_left': days_left
                })
    
    # Ипотека - показываем на 14 дней вперёд
    for m in mortgages:
        if m.next_payment_date:
            days_left = (m.next_payment_date - today).days
            if days_left <= 14 and days_left >= 0:
                upcoming_payments.append({
                    'type': 'mortgage',
                    'name': m.name,
                    'amount': m.monthly_payment,
                    'date': m.next_payment_date.isoformat(),
                    'days_left': days_left
                })
        elif m.payment_day:
            payment_date = today.replace(day=min(m.payment_day, 28))
            if payment_date < today:
                payment_date = payment_date + relativedelta(months=1)
            days_left = (payment_date - today).days
            if days_left <= 14:
                upcoming_payments.append({
                    'type': 'mortgage',
                    'name': m.name,
                    'amount': m.monthly_payment,
                    'date': payment_date.isoformat(),
                    'days_left': days_left
                })
    
    # Кредитные карты - показываем на 14 дней вперёд
    cards = CreditCard.query.all()
    for card in cards:
        payment_date = today.replace(day=min(card.payment_due_day, 28))
        if payment_date < today:
            payment_date = payment_date + relativedelta(months=1)
        days_left = (payment_date - today).days
        # Показываем карту если есть долг ИЛИ если платёж скоро (для напоминания)
        if days_left <= 14 and days_left >= 0:
            min_payment = round(card.current_debt * card.min_payment_percent / 100, 2) if card.current_debt > 0 else 0
            upcoming_payments.append({
                'type': 'credit_card',
                'name': card.account.name,
                'amount': min_payment,
                'date': payment_date.isoformat(),
                'days_left': days_left,
                'current_debt': card.current_debt
            })
    
    upcoming_payments.sort(key=lambda x: x['days_left'])
    
    over_budget_categories = []
    categories = Category.query.filter(Category.budget_limit > 0, Category.type == 'expense').all()
    for cat in categories:
        spent = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.category_id == cat.id,
            Transaction.date >= first_day_month,
            Transaction.type == 'expense'
        ).scalar() or 0
        if spent > cat.budget_limit:
            over_budget_categories.append({
                'id': cat.id,
                'name': cat.name,
                'icon': cat.icon,
                'budget': cat.budget_limit,
                'spent': spent,
                'over': spent - cat.budget_limit
            })
    
    trends = []
    for i in range(5, -1, -1):
        month_start = (today - relativedelta(months=i)).replace(day=1)
        month_end = (month_start + relativedelta(months=1)) - timedelta(days=1)
        
        income = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.type == 'income',
            Transaction.date >= month_start,
            Transaction.date <= month_end
        ).scalar() or 0
        
        expense = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.type == 'expense',
            Transaction.date >= month_start,
            Transaction.date <= month_end
        ).scalar() or 0
        
        trends.append({
            'month': month_start.strftime('%Y-%m'),
            'month_name': month_start.strftime('%B'),
            'income': income,
            'expense': expense,
            'savings': income - expense
        })
    
    # Считаем баланс без налоговых резервов
    total_balance_without_tax = sum(
        a.balance for a in accounts 
        if a.account_type not in ['credit_card'] and not a.is_tax_reserve and a.account_type != 'tax_reserve'
    )
    
    return jsonify({
        'balance': {
            'total': total_balance_without_tax,
            'total_with_tax': total_balance,
            'tax_reserve': tax_reserve_balance,
            'credit_debt': total_credit_debt,
            'net_worth': total_balance - total_credit_debt - total_credit_remaining - total_mortgage_remaining + total_investment_value
        },
        'monthly': {
            'income': monthly_income,
            'expense': monthly_expense,
            'savings': monthly_income - monthly_expense,
            'savings_rate': round((monthly_income - monthly_expense) / monthly_income * 100, 1) if monthly_income > 0 else 0,
            'income_change': round((monthly_income - last_month_income) / last_month_income * 100, 1) if last_month_income > 0 else 0,
            'expense_change': round((monthly_expense - last_month_expense) / last_month_expense * 100, 1) if last_month_expense > 0 else 0
        },
        'yearly': {
            'income': yearly_income,
            'expense': yearly_expense,
            'savings': yearly_income - yearly_expense
        },
        'goals': {
            'total_target': goals_total_target,
            'total_current': goals_total_current,
            'progress': round(goals_total_current / goals_total_target * 100, 1) if goals_total_target > 0 else 0,
            'active_count': len(goals),
            'completed_this_month': completed_goals_month
        },
        'debts': {
            'credits_remaining': total_credit_remaining,
            'mortgage_remaining': total_mortgage_remaining,
            'credit_cards_debt': total_credit_debt,
            'total_debt': total_credit_remaining + total_mortgage_remaining + total_credit_debt,
            'monthly_payments': monthly_credit_payments + monthly_mortgage_payments
        },
        'investments': {
            'total_invested': total_invested,
            'current_value': total_investment_value,
            'profit': total_investment_value - total_invested,
            'profit_percent': round((total_investment_value - total_invested) / total_invested * 100, 2) if total_invested > 0 else 0
        },
        'taxes': {
            'pending': pending_taxes,
            'in_reserve': tax_reserve_balance
        },
        'upcoming_payments': upcoming_payments[:5],
        'over_budget_categories': over_budget_categories,
        'trends': trends
    })

@app.route('/api/stats/by-category', methods=['GET'])
def get_stats_by_category():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    type_filter = request.args.get('type', 'expense')
    
    query = db.session.query(
        Category.id,
        Category.name,
        Category.color,
        Category.icon,
        db.func.sum(Transaction.amount).label('total')
    ).join(Transaction).filter(Transaction.type == type_filter)
    
    if start_date:
        query = query.filter(Transaction.date >= datetime.strptime(start_date, '%Y-%m-%d').date())
    if end_date:
        query = query.filter(Transaction.date <= datetime.strptime(end_date, '%Y-%m-%d').date())
    
    results = query.group_by(Category.id).order_by(db.desc('total')).all()
    
    total = sum(r.total for r in results)
    
    return jsonify([{
        'id': r.id,
        'name': r.name,
        'color': r.color,
        'icon': r.icon,
        'total': r.total,
        'percent': round(r.total / total * 100, 1) if total > 0 else 0
    } for r in results])

@app.route('/api/stats/by-store', methods=['GET'])
def get_stats_by_store():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = db.session.query(
        Store.id,
        Store.name,
        Store.icon,
        Store.color,
        db.func.sum(Transaction.amount).label('total'),
        db.func.count(Transaction.id).label('count')
    ).join(Transaction).filter(Transaction.type == 'expense')
    
    if start_date:
        query = query.filter(Transaction.date >= datetime.strptime(start_date, '%Y-%m-%d').date())
    if end_date:
        query = query.filter(Transaction.date <= datetime.strptime(end_date, '%Y-%m-%d').date())
    
    results = query.group_by(Store.id).order_by(db.desc('total')).all()
    
    return jsonify([{
        'id': r.id,
        'name': r.name,
        'icon': r.icon,
        'color': r.color,
        'total': r.total,
        'count': r.count,
        'avg_check': round(r.total / r.count, 2) if r.count > 0 else 0
    } for r in results])

@app.route('/api/stats/trends', methods=['GET'])
def get_trends():
    """Детальные тренды для графиков"""
    months = request.args.get('months', 12, type=int)
    today = date.today()
    
    trends = []
    for i in range(months - 1, -1, -1):
        month_start = (today - relativedelta(months=i)).replace(day=1)
        month_end = (month_start + relativedelta(months=1)) - timedelta(days=1)
        
        income = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.type == 'income',
            Transaction.date >= month_start,
            Transaction.date <= month_end
        ).scalar() or 0
        
        expense = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.type == 'expense',
            Transaction.date >= month_start,
            Transaction.date <= month_end
        ).scalar() or 0
        
        trends.append({
            'month': month_start.strftime('%Y-%m'),
            'month_name': month_start.strftime('%b %Y'),
            'income': income,
            'expense': expense,
            'savings': income - expense,
            'savings_rate': round((income - expense) / income * 100, 1) if income > 0 else 0
        })
    
    return jsonify(trends)

# --- Достижения ---
@app.route('/api/achievements', methods=['GET'])
def get_achievements():
    # Проверяем достижения перед выдачей
    check_achievements()
    
    achievements = Achievement.query.order_by(Achievement.unlocked.desc(), Achievement.points.desc()).all()
    return jsonify([{
        'id': a.id,
        'code': a.code,
        'name': a.name,
        'description': a.description,
        'icon': a.icon,
        'points': a.points,
        'unlocked': a.unlocked,
        'unlocked_at': a.unlocked_at.isoformat() if a.unlocked_at else None
    } for a in achievements])

def check_achievements():
    """Проверка и разблокировка достижений"""
    today = date.today()
    first_day = today.replace(day=1)
    
    unlock_achievement('first_transaction', Transaction.query.count() >= 1)
    unlock_achievement('century', Transaction.query.count() >= 100)
    unlock_achievement('goal_achiever', Goal.query.filter_by(is_completed=True).count() >= 1)
    
    total_savings = db.session.query(db.func.sum(Account.balance)).filter(
        Account.account_type.in_(['debit', 'savings'])
    ).scalar() or 0
    unlock_achievement('saver_100k', total_savings >= 100000)
    
    monthly_income = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.type == 'income',
        Transaction.date >= first_day
    ).scalar() or 0
    monthly_expense = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.type == 'expense',
        Transaction.date >= first_day
    ).scalar() or 0
    unlock_achievement('profitable_month', monthly_income > monthly_expense)
    
    # Нет долгов
    total_debt = Credit.query.count() + Mortgage.query.count()
    total_card_debt = db.session.query(db.func.sum(CreditCard.current_debt)).scalar() or 0
    unlock_achievement('debt_free', total_debt == 0 and total_card_debt == 0)
    
    # Инвестор
    unlock_achievement('investor', Investment.query.count() >= 1)
    
    # Бюджетник - не превысил бюджет за месяц
    over_budget = False
    categories = Category.query.filter(Category.budget_limit > 0, Category.type == 'expense').all()
    for cat in categories:
        spent = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.category_id == cat.id,
            Transaction.date >= first_day,
            Transaction.type == 'expense'
        ).scalar() or 0
        if spent > cat.budget_limit:
            over_budget = True
            break
    unlock_achievement('budget_master', not over_budget and len(categories) > 0)

def unlock_achievement(code, condition):
    if not condition:
        return
    
    achievement = Achievement.query.filter_by(code=code).first()
    if achievement and not achievement.unlocked:
        achievement.unlocked = True
        achievement.unlocked_at = datetime.utcnow()
        db.session.commit()

# --- Инициализация ---
def init_database():
    with app.app_context():
        db.create_all()
        
        # Создаём категории по умолчанию
        if Category.query.count() == 0:
            default_categories = [
                ('Продукты', 'expense', '🛒', '#4CAF50', 30000),
                ('Транспорт', 'expense', '🚗', '#2196F3', 10000),
                ('Жильё', 'expense', '🏠', '#9C27B0', 0),
                ('Коммунальные', 'expense', '💡', '#FF9800', 8000),
                ('Здоровье', 'expense', '💊', '#F44336', 5000),
                ('Развлечения', 'expense', '🎬', '#E91E63', 10000),
                ('Одежда', 'expense', '👕', '#00BCD4', 10000),
                ('Образование', 'expense', '📚', '#3F51B5', 5000),
                ('Рестораны', 'expense', '🍽️', '#FF5722', 15000),
                ('Подарки', 'expense', '🎁', '#8BC34A', 5000),
                ('Подписки', 'expense', '📱', '#607D8B', 3000),
                ('Красота', 'expense', '💅', '#E91E63', 5000),
                ('Дети', 'expense', '👶', '#FFEB3B', 10000),
                ('Питомцы', 'expense', '🐕', '#795548', 5000),
                ('Связь', 'expense', '📞', '#009688', 2000),
                ('Другое', 'expense', '📦', '#9E9E9E', 0),
                ('Зарплата', 'income', '💰', '#4CAF50', 0),
                ('Фриланс', 'income', '💻', '#2196F3', 0),
                ('Бизнес', 'income', '🏢', '#9C27B0', 0),
                ('Инвестиции', 'income', '📈', '#FF9800', 0),
                ('Подарки', 'income', '🎁', '#E91E63', 0),
                ('Кэшбэк', 'income', '💳', '#00BCD4', 0),
                ('Возврат', 'income', '↩️', '#607D8B', 0),
                ('Другое', 'income', '💵', '#9E9E9E', 0),
            ]
            
            for name, type_, icon, color, budget in default_categories:
                db.session.add(Category(name=name, type=type_, icon=icon, color=color, budget_limit=budget))
        
        # Создаём достижения
        if Achievement.query.count() == 0:
            achievements = [
                ('first_transaction', 'Первый шаг', 'Добавьте первую транзакцию', '🎉', 10),
                ('century', 'Сотня', '100 транзакций', '💯', 50),
                ('goal_achiever', 'Целеустремлённый', 'Достигните первую цель', '🎯', 30),
                ('saver_100k', 'Накопитель', 'Накопите 100 000 ₽', '🐷', 100),
                ('profitable_month', 'В плюсе', 'Закончите месяц с прибылью', '📈', 20),
                ('debt_free', 'Свобода', 'Погасите все кредиты', '🦅', 200),
                ('investor', 'Инвестор', 'Сделайте первую инвестицию', '📊', 30),
                ('budget_master', 'Бюджетник', 'Не превысьте бюджет за месяц', '👑', 50),
            ]
            
            for code, name, desc, icon, points in achievements:
                db.session.add(Achievement(code=code, name=name, description=desc, icon=icon, points=points))
        
        db.session.commit()
        print("База данных инициализирована")

# Инициализация базы данных при импорте модуля
with app.app_context():
    db.create_all()
    
    # Создаём категории по умолчанию
    if Category.query.count() == 0:
        default_categories = [
            ('Продукты', 'expense', '🛒', '#4CAF50', 30000),
            ('Транспорт', 'expense', '🚗', '#2196F3', 10000),
            ('Жильё', 'expense', '🏠', '#9C27B0', 0),
            ('Коммунальные', 'expense', '💡', '#FF9800', 8000),
            ('Здоровье', 'expense', '💊', '#F44336', 5000),
            ('Развлечения', 'expense', '🎬', '#E91E63', 10000),
            ('Одежда', 'expense', '👕', '#00BCD4', 10000),
            ('Образование', 'expense', '📚', '#3F51B5', 5000),
            ('Рестораны', 'expense', '🍽️', '#FF5722', 15000),
            ('Подарки', 'expense', '🎁', '#8BC34A', 5000),
            ('Подписки', 'expense', '📱', '#607D8B', 3000),
            ('Красота', 'expense', '💅', '#E91E63', 5000),
            ('Дети', 'expense', '👶', '#FFEB3B', 10000),
            ('Питомцы', 'expense', '🐕', '#795548', 5000),
            ('Связь', 'expense', '📞', '#009688', 2000),
            ('Другое', 'expense', '📦', '#9E9E9E', 0),
            ('Зарплата', 'income', '💰', '#4CAF50', 0),
            ('Фриланс', 'income', '💻', '#2196F3', 0),
            ('Бизнес', 'income', '🏢', '#9C27B0', 0),
            ('Инвестиции', 'income', '📈', '#FF9800', 0),
            ('Подарки', 'income', '🎁', '#E91E63', 0),
            ('Кэшбэк', 'income', '💳', '#00BCD4', 0),
            ('Возврат', 'income', '↩️', '#607D8B', 0),
            ('Другое', 'income', '💵', '#9E9E9E', 0),
        ]
        
        for name, type_, icon, color, budget in default_categories:
            db.session.add(Category(name=name, type=type_, icon=icon, color=color, budget_limit=budget))
    
    # Создаём достижения
    if Achievement.query.count() == 0:
        achievements = [
            ('first_transaction', 'Первый шаг', 'Добавьте первую транзакцию', '🎉', 10),
            ('century', 'Сотня', '100 транзакций', '💯', 50),
            ('goal_achiever', 'Целеустремлённый', 'Достигните первую цель', '🎯', 30),
            ('saver_100k', 'Накопитель', 'Накопите 100 000 ₽', '🐷', 100),
            ('profitable_month', 'В плюсе', 'Закончите месяц с прибылью', '📈', 20),
            ('debt_free', 'Свобода', 'Погасите все кредиты', '🦅', 200),
            ('investor', 'Инвестор', 'Сделайте первую инвестицию', '📊', 30),
            ('budget_master', 'Бюджетник', 'Не превысьте бюджет за месяц', '👑', 50),
        ]
        
        for code, name, desc, icon, points in achievements:
            db.session.add(Achievement(code=code, name=name, description=desc, icon=icon, points=points))
    
    db.session.commit()
    print("База данных инициализирована")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)