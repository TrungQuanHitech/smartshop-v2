import { create } from 'zustand';
import type { CartItem, Partner } from '@/types';

type PaymentMethod = 'Cash' | 'Card' | 'Transfer' | 'Other';

export interface Order {
    id: string;
    orderNumber: string;
    date: string;
    customer: Partner | null;
    items: CartItem[];
    subtotal: number;
    discountTotal: number;
    vat: number;
    finalTotal: number;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    status: 'COMPLETED' | 'CANCELLED';
}

interface PosState {
    cart: CartItem[];
    customer: Partner | null;
    discountTotal: number;
    vatPercent: number;
    orders: Order[];

    addToCart: (item: Omit<CartItem, 'quantity' | 'discount' | 'subtotal'>) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, qty: number) => void;
    setItemDiscount: (productId: string, discount: number) => void;
    setCustomer: (customer: Partner | null) => void;
    setDiscountTotal: (amt: number) => void;
    setVatPercent: (percent: number) => void;
    addOrder: (order: Order) => void;
    clearCart: () => void;
    getSubtotal: () => number;
    getVatAmount: () => number;
    getFinalTotal: () => number;
}

export const usePosStore = create<PosState>()((set, get) => ({
    cart: [],
    customer: null,
    discountTotal: 0,
    vatPercent: 0,
    orders: JSON.parse(localStorage.getItem('pos_orders') || '[]'),

    addToCart: (newItem) =>
        set((s) => {
            const existing = s.cart.find((i) => i.productId === newItem.productId);
            if (existing) {
                return {
                    cart: s.cart.map((i) =>
                        i.productId === newItem.productId
                            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice - i.discount }
                            : i
                    ),
                };
            }
            return {
                cart: [
                    ...s.cart,
                    { ...newItem, quantity: 1, discount: 0, subtotal: newItem.unitPrice },
                ],
            };
        }),

    removeFromCart: (productId) =>
        set((s) => ({ cart: s.cart.filter((i) => i.productId !== productId) })),

    updateQuantity: (productId, qty) =>
        set((s) => ({
            cart: s.cart
                .map((i) =>
                    i.productId === productId
                        ? { ...i, quantity: Math.max(1, qty), subtotal: Math.max(1, qty) * i.unitPrice - i.discount }
                        : i
                )
                .filter((i) => i.quantity > 0),
        })),

    setItemDiscount: (productId, discount) =>
        set((s) => ({
            cart: s.cart.map((i) =>
                i.productId === productId
                    ? { ...i, discount, subtotal: i.quantity * i.unitPrice - discount }
                    : i
            ),
        })),

    setCustomer: (customer) => set({ customer }),
    setDiscountTotal: (discountTotal) => set({ discountTotal }),
    setVatPercent: (vatPercent) => set({ vatPercent }),

    addOrder: (order) => set((s) => {
        const newOrders = [order, ...s.orders];
        localStorage.setItem('pos_orders', JSON.stringify(newOrders));
        return { orders: newOrders };
    }),

    clearCart: () => set({ cart: [], customer: null, discountTotal: 0, vatPercent: 0 }),

    getSubtotal: () => get().cart.reduce((sum, i) => sum + i.subtotal, 0),
    getVatAmount: () => {
        const sub = get().getSubtotal() - get().discountTotal;
        return (sub * get().vatPercent) / 100;
    },
    getFinalTotal: () => {
        const subAfterDiscount = get().getSubtotal() - get().discountTotal;
        const vatAmt = (subAfterDiscount * get().vatPercent) / 100;
        return Math.max(0, subAfterDiscount + vatAmt);
    },
}));
