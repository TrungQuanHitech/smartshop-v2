import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { PurchaseOrder } from '@/types';

interface PurchaseState {
    orders: PurchaseOrder[];
    addOrder: (order: Omit<PurchaseOrder, 'id' | 'orderNumber'>) => PurchaseOrder;
    cancelOrder: (id: string) => void;
    getOrderById: (id: string) => PurchaseOrder | undefined;
    getMonthExpense: () => number;
}

export const usePurchaseStore = create<PurchaseState>()(
    persist(
        (set, get) => ({
            orders: [],

            addOrder: (data) => {
                const count = get().orders.length + 1;
                const order: PurchaseOrder = {
                    ...data,
                    id: uuidv4(),
                    orderNumber: `PN${new Date().getFullYear()}${String(count).padStart(4, '0')}`,
                };
                set((s) => ({ orders: [order, ...s.orders] }));
                return order;
            },

            cancelOrder: (id) =>
                set((s) => ({
                    orders: s.orders.map((o) => (o.id === id ? { ...o, status: 'CANCELLED' } : o)),
                })),

            getOrderById: (id) => get().orders.find((o) => o.id === id),

            getMonthExpense: () => {
                const now = new Date();
                return get().orders
                    .filter((o) => {
                        const d = new Date(o.createdAt);
                        return o.status === 'COMPLETED' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    })
                    .reduce((sum, o) => sum + o.amountPaid, 0);
            },
        }),
        { name: 'smartshop-purchases' }
    )
);
