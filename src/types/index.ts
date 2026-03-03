// ============================================================
// CORE DATA MODELS - SmartShop ERP & POS v2.0
// ============================================================

export type PartnerType = 'CUSTOMER' | 'SUPPLIER';
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'DEBT';
export type TransactionType = 'INCOME' | 'EXPENSE';
export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type RepairStatus = 'RECEIVED' | 'DIAGNOSING' | 'REPAIRING' | 'WAITING_PARTS' | 'DONE' | 'RETURNED' | 'CANCELLED';

// ---------- PRODUCT ----------
export interface Category {
    id: string;
    name: string;
    color?: string;
}

export interface Product {
    id: string;
    sku: string;
    name: string;
    description?: string;
    specs?: { [key: string]: string }; // Map of technical specs
    imageBase64?: string;
    categoryId: string;
    inStock: number;
    lowStockAlert: number;
    importPrice: number; // Đây là giá vốn (Cost Price)
    retailPrice: number;
    createdAt: string;
    updatedAt: string;
}

// ---------- PARTNER ----------
export interface Partner {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    type: PartnerType;
    totalDebt: number; // Positive = khách nợ mình, Negative = mình nợ NCC
    notes?: string;
    createdAt: string;
}

// ---------- SALE ORDER ----------
export interface SaleOrderItem {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
}

export interface SaleOrder {
    id: string;
    orderNumber: string;
    customerId?: string;
    customerName?: string;
    items: SaleOrderItem[];
    subtotal: number;
    discountTotal: number;
    vatPercent: number;
    vatAmount: number;
    totalAmount: number;
    amountPaid: number;
    debtAmount: number; // totalAmount - amountPaid
    paymentMethod: PaymentMethod;
    status: OrderStatus;
    notes?: string;
    createdAt: string;
}

// ---------- PURCHASE ORDER ----------
export interface PurchaseOrderItem {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export interface PurchaseOrder {
    id: string;
    orderNumber: string;
    supplierId?: string;
    supplierName?: string;
    items: PurchaseOrderItem[];
    subtotal: number;
    vatPercent: number;
    vatAmount: number;
    totalAmount: number;
    amountPaid: number;
    debtAmount: number;
    paymentMethod: PaymentMethod;
    status: OrderStatus;
    notes?: string;
    createdAt: string;
}

// ---------- CASH TRANSACTION ----------
export interface CashTransaction {
    id: string;
    type: TransactionType;
    amount: number;
    title: string;
    description?: string;
    category: string; // 'SALE', 'PURCHASE', 'DEBT_PAYMENT', 'EXPENSE', 'OTHER'
    refId?: string; // Reference to SaleOrder / PurchaseOrder / etc.
    refType?: string;
    paymentMethod: 'CASH' | 'TRANSFER';
    createdAt: string;
}

// ---------- REPAIR SERVICE ----------
export interface RepairTicket {
    id: string;
    ticketNumber: string;
    customerId?: string;
    customerName: string;
    customerPhone: string;
    deviceName: string;
    deviceBrand?: string;
    deviceSerial?: string;
    problemDescription: string;
    technicianNotes?: string;
    estimatedCost?: number;
    finalCost?: number;
    depositPaid?: number;
    status: RepairStatus;
    receivedAt: string;
    estimatedReturnAt?: string;
    returnedAt?: string;
    createdAt: string;
    updatedAt: string;
}

// ---------- RENTAL CONTRACT ----------
export interface RentalContract {
    id: string;
    contractNumber: string;
    customerId?: string;
    customerName: string;
    customerPhone: string;
    machineModel: string;
    machineSerial: string;
    startDate: string;
    endDate?: string;
    monthlyFee: number;
    freePagesMono: number;
    freePagesColor: number;
    pricePerPageMono: number;
    pricePerPageColor: number;
    lastCounterMono: number;
    lastCounterColor: number;
    lastCounterDate?: string;
    isActive: boolean;
    notes?: string;
    createdAt: string;
}

export interface RentalCounterLog {
    id: string;
    contractId: string;
    date: string;
    counterMono: number;
    counterColor: number;
    usedMono: number;
    usedColor: number;
    excessMono: number;
    excessColor: number;
    chargeAmount: number;
    notes?: string;
    createdAt: string;
}

// ---------- APP SETTINGS ----------
export interface AppSettings {
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    companyEmail?: string;
    logoBase64?: string;
    vatPercent: number;
    currency: string;
    // VietQR
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    bankBin: string; // Bank BIN code
    // Telegram
    telegramBotToken: string;
    telegramChatId: string;
    // Groq AI
    groqApiKey: string;
    groqModel: string;
    // Google Sheets
    googleSheetId: string;
    googleAppsScriptUrl: string;
    googleClientId: string;
}

// ---------- CART (POS SESSION) ----------
export interface CartItem {
    productId: string;
    sku: string;
    name: string;
    unitPrice: number;
    quantity: number;
    discount: number;
    subtotal: number;
    inStock: number; // For stock check
}
