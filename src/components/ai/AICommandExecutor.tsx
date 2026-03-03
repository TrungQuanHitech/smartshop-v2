import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAIStore } from '@/store/ai.store';
import { useProductStore } from '@/store/product.store';
import { usePartnerStore } from '@/store/partner.store';
import { usePurchaseStore } from '@/store/purchase.store';
import { useSaleStore, useCashFlowStore } from '@/store/sale.store';
import { usePurchaseTransaction } from '@/hooks/usePurchaseTransaction';
import { useSaleTransaction } from '@/hooks/useSaleTransaction';
import { usePosStore } from '@/store/pos.store';

export function AICommandExecutor() {
    const navigate = useNavigate();
    const { lastCommand, executeCommand, setGlobalSearch } = useAIStore();

    // Stores
    const products = useProductStore((s) => s.products);
    const partners = usePartnerStore((s) => s.partners);
    const { addTransaction } = useCashFlowStore();

    // Transactions
    const { executePurchase } = usePurchaseTransaction();
    const { executeSale } = useSaleTransaction();

    // POS/Purchase Cart States (To sync if user is on page)
    const posSetCustomer = usePosStore((s) => s.setCustomer);
    const posAddToCart = usePosStore((s) => s.addToCart);

    useEffect(() => {
        if (!lastCommand) return;

        console.log('AI Global Executor:', lastCommand);

        switch (lastCommand.type) {
            case 'NAVIGATE':
                navigate(lastCommand.path);
                if (lastCommand.query) {
                    setGlobalSearch(lastCommand.query);
                }
                executeCommand(lastCommand);
                break;

            case 'ADD_PURCHASE_ITEM': {
                const { productId, productName, quantity, price, supplierId, supplierName } = lastCommand as any;
                const product = products.find(p => p.id === productId || p.name.toLowerCase().includes(productName?.toLowerCase()));
                const supplier = partners.find(p => p.id === supplierId || (p.type === 'SUPPLIER' && supplierName && p.name.toLowerCase().includes(supplierName.toLowerCase())));

                if (product && supplier) {
                    // THỰC THI NHẬP HÀNG NGAY LẬP TỨC
                    executePurchase({
                        items: [{
                            productId: product.id,
                            productName: product.name,
                            sku: product.sku,
                            quantity: quantity || 1,
                            unitPrice: price || product.importPrice
                        }],
                        supplier,
                        paymentMethod: 'CASH',
                        amountPaid: (quantity || 1) * (price || product.importPrice),
                        vatPercent: 0
                    });
                    console.log('AI: Auto-executed Purchase for', product.name);
                } else if (product) {
                    // Nếu thiếu NCC, chuyển sang trang Nhập hàng để người dùng chọn
                    navigate('/purchases');
                    // Lưu ý: Sync cartItems ở Purchases.tsx sẽ xử lý tiếp nếu nó lắng nghe lastCommand
                }
                executeCommand(lastCommand);
                break;
            }

            case 'ADD_TO_CART': {
                const { productId, productName, quantity, price, customerId, customerName } = lastCommand as any;
                const product = products.find(p => p.id === productId || p.name.toLowerCase().includes(productName?.toLowerCase()));

                if (product) {
                    // Nếu đang ở POS thì dùng store, nếu không thì navigate qua
                    posAddToCart({
                        productId: product.id,
                        sku: product.sku,
                        name: product.name,
                        unitPrice: price || product.retailPrice,
                        inStock: product.inStock
                    });

                    if (customerId || customerName) {
                        const customer = partners.find(p => p.id === customerId || (p.type === 'CUSTOMER' && customerName && p.name.toLowerCase().includes(customerName.toLowerCase())));
                        if (customer) posSetCustomer(customer);
                    }

                    if (window.location.pathname !== '/pos') {
                        navigate('/pos');
                    }
                }
                executeCommand(lastCommand);
                break;
            }

            case 'ADD_TRANSACTION': {
                const { title, amount, transactionType, category } = lastCommand as any;
                addTransaction({
                    title,
                    amount,
                    type: transactionType || 'EXPENSE',
                    category: category || 'OTHER',
                    paymentMethod: 'CASH',
                    createdAt: new Date().toISOString()
                });
                executeCommand(lastCommand);
                break;
            }

            default:
                // Các lệnh khác có thể để mặc định hoặc bàn giao cho page xử lý
                break;
        }
    }, [lastCommand, navigate, executeCommand, products, partners, executePurchase, executeSale, addTransaction, posAddToCart, posSetCustomer, setGlobalSearch]);

    return null;
}
