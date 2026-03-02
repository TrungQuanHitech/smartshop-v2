// Business Logic Hook: usePurchaseTransaction
// Nhập hàng: Cộng tồn kho + Tạo đơn nhập + Ghi Chi + Cập nhật nợ NCC
import { useCallback } from 'react';
import { useProductStore } from '@/store/product.store';
import { usePurchaseStore } from '@/store/purchase.store';
import { useCashFlowStore } from '@/store/sale.store';
import { usePartnerStore } from '@/store/partner.store';
import type { Partner, PaymentMethod } from '@/types';

interface PurchaseItemInput {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
}

interface PurchaseInput {
    items: PurchaseItemInput[];
    supplier: Partner | null;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    vatPercent?: number;
    notes?: string;
}

export function usePurchaseTransaction() {
    const { updateStock } = useProductStore();
    const { addOrder } = usePurchaseStore();
    const { addTransaction } = useCashFlowStore();
    const { adjustDebt } = usePartnerStore();

    const executePurchase = useCallback((input: PurchaseInput) => {
        const { items, supplier, paymentMethod, amountPaid, vatPercent = 0, notes } = input;

        const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
        const vatAmount = Math.round(subtotal * vatPercent / 100);
        const totalAmount = subtotal + vatAmount;
        const debtAmount = Math.max(0, totalAmount - amountPaid);

        // 1. Tạo Purchase Order
        const order = addOrder({
            supplierId: supplier?.id,
            supplierName: supplier?.name,
            items: items.map((i) => ({ ...i, subtotal: i.quantity * i.unitPrice })),
            subtotal,
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

        // 2. Cộng tồn kho
        items.forEach((item) => {
            updateStock(item.productId, item.quantity);
        });

        // 3. Ghi Chi nếu đã trả tiền
        if (amountPaid > 0) {
            addTransaction({
                type: 'EXPENSE',
                amount: amountPaid,
                title: `Nhập hàng ${order.orderNumber}${supplier ? ` - ${supplier.name}` : ''}`,
                category: 'PURCHASE',
                refId: order.id,
                refType: 'PURCHASE_ORDER',
                paymentMethod: paymentMethod === 'TRANSFER' ? 'TRANSFER' : 'CASH',
                createdAt: new Date().toISOString(),
            });
        }

        // 4. Cộng nợ NCC (âm = mình nợ NCC)
        if (supplier && debtAmount > 0) {
            adjustDebt(supplier.id, -debtAmount);
        }

        return order;
    }, [updateStock, addOrder, addTransaction, adjustDebt]);

    return { executePurchase };
}
