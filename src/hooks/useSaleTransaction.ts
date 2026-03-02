// Business Logic Hook: useSaleTransaction
// Khi bán hàng: Trừ tồn kho + Tạo order + Tạo CashTransaction + Cập nhật nợ KH
import { useCallback } from 'react';
import { useProductStore } from '@/store/product.store';
import { useSaleStore, useCashFlowStore } from '@/store/sale.store';
import { usePartnerStore } from '@/store/partner.store';
import type { CartItem, Partner, PaymentMethod } from '@/types';

interface SaleInput {
    cart: CartItem[];
    customer: Partner | null;
    discountTotal: number;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    vatPercent?: number;
    notes?: string;
}

export function useSaleTransaction() {
    const { updateStock } = useProductStore();
    const { addOrder } = useSaleStore();
    const { addTransaction } = useCashFlowStore();
    const { adjustDebt } = usePartnerStore();

    const executeSale = useCallback((input: SaleInput) => {
        const { cart, customer, discountTotal, paymentMethod, amountPaid, vatPercent = 0, notes } = input;

        const subtotal = cart.reduce((sum, i) => sum + i.subtotal, 0);
        const vatAmount = Math.round(subtotal * vatPercent / 100);
        const totalAmount = subtotal - discountTotal + vatAmount;
        const debtAmount = Math.max(0, totalAmount - amountPaid);

        // 1. Tạo Sale Order
        const order = addOrder({
            customerId: customer?.id,
            customerName: customer?.name || 'Khách Vãng Lai',
            items: cart.map((i) => ({
                productId: i.productId,
                productName: i.name,
                sku: i.sku,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                discount: i.discount,
                subtotal: i.subtotal,
            })),
            subtotal,
            discountTotal,
            vatPercent,
            vatAmount,
            totalAmount,
            amountPaid,
            debtAmount,
            paymentMethod,
            status: 'COMPLETED',
            notes,
            createdAt: new Date().toISOString(),
        });

        // 2. Trừ tồn kho
        cart.forEach((item) => {
            updateStock(item.productId, -item.quantity);
        });

        // 3. Tạo CashTransaction (nếu khách trả tiền)
        if (amountPaid > 0) {
            addTransaction({
                type: 'INCOME',
                amount: amountPaid,
                title: `Bán hàng ${order.orderNumber}${customer ? ` - ${customer.name}` : ''}`,
                category: 'SALE',
                refId: order.id,
                refType: 'SALE_ORDER',
                paymentMethod: paymentMethod === 'TRANSFER' ? 'TRANSFER' : 'CASH',
                createdAt: new Date().toISOString(),
            });
        }

        // 4. Cập nhật công nợ khách hàng
        if (customer && debtAmount > 0) {
            adjustDebt(customer.id, debtAmount);
        }

        return order;
    }, [updateStock, addOrder, addTransaction, adjustDebt]);

    return { executeSale };
}
