import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { SaleOrder, CashTransaction } from '@/types';

const SEED_ORDERS: SaleOrder[] = [
    {
        id: 'ord-1', orderNumber: 'HD2024001', customerId: 'cus-1',
        customerName: 'Anh Tuấn - IT Cần Thơ',
        items: [{ productId: 'p-1', productName: 'Laptop Dell XPS 15 9530', sku: 'LAP-DELL-XPS15', quantity: 1, unitPrice: 42000000, discount: 0, subtotal: 42000000 }],
        subtotal: 42000000, discountTotal: 0, vatPercent: 0, vatAmount: 0,
        totalAmount: 42000000, amountPaid: 27000000, debtAmount: 15000000,
        paymentMethod: 'DEBT', status: 'COMPLETED',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
        id: 'ord-2', orderNumber: 'HD2024002',
        items: [{ productId: 'p-5', productName: 'Chuột Logitech G304', sku: 'MOUSE-LOGI-G304', quantity: 2, unitPrice: 850000, discount: 0, subtotal: 1700000 }],
        subtotal: 1700000, discountTotal: 0, vatPercent: 0, vatAmount: 0,
        totalAmount: 1700000, amountPaid: 1700000, debtAmount: 0,
        paymentMethod: 'CASH', status: 'COMPLETED',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
];

interface SaleState {
    orders: SaleOrder[];
    addOrder: (order: Omit<SaleOrder, 'id' | 'orderNumber'>) => SaleOrder;
    cancelOrder: (id: string) => void;
    getOrderById: (id: string) => SaleOrder | undefined;
    getTodayRevenue: () => number;
    getMonthRevenue: () => number;
    getTotalDebt: () => number;
    reset: () => void;
}

export const useSaleStore = create<SaleState>()(
    persist(
        (set, get) => ({
            orders: SEED_ORDERS,

            addOrder: (data) => {
                const count = get().orders.length + 1;
                const order: SaleOrder = {
                    ...data,
                    id: uuidv4(),
                    orderNumber: `HD${new Date().getFullYear()}${String(count).padStart(4, '0')}`,
                };
                set((s) => ({ orders: [order, ...s.orders] }));
                return order;
            },

            cancelOrder: (id) =>
                set((s) => ({
                    orders: s.orders.map((o) => (o.id === id ? { ...o, status: 'CANCELLED' } : o)),
                })),

            getOrderById: (id) => get().orders.find((o) => o.id === id),

            getTodayRevenue: () => {
                const today = new Date().toDateString();
                return get().orders
                    .filter((o) => o.status === 'COMPLETED' && new Date(o.createdAt).toDateString() === today)
                    .reduce((sum, o) => sum + o.amountPaid, 0);
            },

            getMonthRevenue: () => {
                const now = new Date();
                return get().orders
                    .filter((o) => {
                        const d = new Date(o.createdAt);
                        return o.status === 'COMPLETED' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    })
                    .reduce((sum, o) => sum + o.amountPaid, 0);
            },

            getTotalDebt: () =>
                get().orders.filter((o) => o.status === 'COMPLETED').reduce((sum, o) => sum + o.debtAmount, 0),

            reset: () => set({ orders: [] }),
        }),
        { name: 'smartshop-sales' }
    )
);

// ===================== CASHFLOW STORE =====================
const SEED_TRANSACTIONS: CashTransaction[] = [
    {
        id: 'tx-1', type: 'INCOME', amount: 27000000,
        title: 'Khách trả tiền HD2024001', category: 'SALE',
        refId: 'ord-1', refType: 'SALE_ORDER', paymentMethod: 'TRANSFER',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
        id: 'tx-2', type: 'INCOME', amount: 1700000,
        title: 'Bán hàng HD2024002 - Tiền mặt', category: 'SALE',
        refId: 'ord-2', refType: 'SALE_ORDER', paymentMethod: 'CASH',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
        id: 'tx-3', type: 'EXPENSE', amount: 12500000,
        title: 'Thanh toán NCC Viễn Sơn', category: 'PURCHASE',
        refType: 'PURCHASE_ORDER', paymentMethod: 'TRANSFER',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
];

interface CashFlowState {
    transactions: CashTransaction[];
    addTransaction: (tx: Omit<CashTransaction, 'id'>) => CashTransaction;
    deleteTransaction: (id: string) => void;
    getBalance: () => number;
    getMonthIncome: () => number;
    getMonthExpense: () => number;
    reset: () => void;
}

export const useCashFlowStore = create<CashFlowState>()(
    persist(
        (set, get) => ({
            transactions: SEED_TRANSACTIONS,

            addTransaction: (data) => {
                const tx: CashTransaction = { ...data, id: uuidv4() };
                set((s) => ({ transactions: [tx, ...s.transactions] }));
                return tx;
            },

            deleteTransaction: (id) =>
                set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

            getBalance: () => {
                const { transactions } = get();
                return transactions.reduce(
                    (sum, t) => (t.type === 'INCOME' ? sum + t.amount : sum - t.amount), 0
                );
            },

            getMonthIncome: () => {
                const now = new Date();
                return get().transactions
                    .filter((t) => {
                        const d = new Date(t.createdAt);
                        return t.type === 'INCOME' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    })
                    .reduce((sum, t) => sum + t.amount, 0);
            },

            getMonthExpense: () => {
                const now = new Date();
                return get().transactions
                    .filter((t) => {
                        const d = new Date(t.createdAt);
                        return t.type === 'EXPENSE' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    })
                    .reduce((sum, t) => sum + t.amount, 0);
            },

            reset: () => set({ transactions: [] }),
        }),
        { name: 'smartshop-cashflow' }
    )
);
