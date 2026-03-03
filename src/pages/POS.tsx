import { useState, useMemo, useEffect, useRef } from 'react';
import {
    Search, ShoppingCart, User as UserIcon, Trash2,
    Plus, Minus, CreditCard, Banknote, History,
    Printer, ArrowRight, Package, Calculator, CheckCircle2,
    QrCode, X, ReceiptText, Camera
} from 'lucide-react';
import { useProductStore } from '@/store/product.store';
import { usePosStore } from '@/store/pos.store';
import { usePartnerStore } from '@/store/partner.store';
import { useSaleStore } from '@/store/sale.store';
import { useSaleTransaction } from '@/hooks/useSaleTransaction';
import { useSettingsStore } from '@/store/settings.store';
import { useAIStore } from '@/store/ai.store';
import { formatCurrency, formatDate, generateVietQRUrl, cn } from '@/lib/utils';
import type { Product, Partner, CartItem, PaymentMethod, SaleOrder } from '@/types';

export default function POS() {
    const settings = useSettingsStore((s) => s.settings);
    const { updateStock } = useProductStore();
    const { adjustDebt } = usePartnerStore();
    const { executeSale } = useSaleTransaction();
    const { lastCommand, executeCommand, globalSearch, setGlobalSearch } = useAIStore();

    const products = useProductStore((s) => s.products);
    const categories = useProductStore((s) => s.categories);
    const partners = usePartnerStore((s) => s.partners);
    const customers = partners.filter(p => p.type === 'CUSTOMER');
    const orders = useSaleStore((s) => s.orders);

    const [viewMode, setViewMode] = useState<'POS' | 'HISTORY'>('POS');
    const [search, setSearch] = useState('');
    const [activeCat, setActiveCat] = useState('all');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
    const [amountPaidStr, setAmountPaidStr] = useState('');
    const [checkoutSuccessId, setCheckoutSuccessId] = useState<string | null>(null);

    const {
        cart, customer, discountTotal, vatPercent,
        addToCart, removeFromCart, updateQuantity, setCustomer,
        setDiscountTotal, setVatPercent, addOrder, clearCart,
        getSubtotal, getVatAmount, getFinalTotal
    } = usePosStore();

    // Sync with Global AI Search
    useEffect(() => {
        if (globalSearch) {
            setSearch(globalSearch);
            setGlobalSearch('');
        }
    }, [globalSearch, setGlobalSearch]);

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchCat = activeCat === 'all' || p.categoryId === activeCat;
            const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
            return matchCat && matchSearch;
        });
    }, [products, search, activeCat]);

    const filteredOrders = useMemo(() => {
        if (!search) return orders;
        return orders.filter(o =>
            o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
            (o.customerName || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [orders, search]);

    const finalTotal = getFinalTotal();
    const subtotal = getSubtotal();
    const vatAmount = getVatAmount();
    const amountPaid = parseFloat(amountPaidStr.replace(/[^0-9]/g, '')) || 0;
    const change = amountPaid - finalTotal;

    const openCheckout = (method: PaymentMethod) => {
        setPaymentMethod(method);
        setAmountPaidStr(method === 'TRANSFER' ? String(finalTotal) : '');
        setIsCheckoutOpen(true);
    };

    const handleConfirm = () => {
        const orderNum = `HD-${Date.now().toString().slice(-6)}`;
        const actualAmountPaid = paymentMethod === 'DEBT' ? 0 : (amountPaidStr ? amountPaid : finalTotal);
        const debtAmount = Math.max(0, finalTotal - actualAmountPaid);

        const newOrder: SaleOrder = {
            id: crypto.randomUUID(),
            orderNumber: orderNum,
            createdAt: new Date().toISOString(),
            customerId: customer?.id,
            customerName: customer?.name,
            items: cart.map(item => ({
                productId: item.productId,
                productName: item.name,
                sku: item.sku,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,
                subtotal: item.subtotal
            })),
            subtotal,
            discountTotal: discountTotal || 0,
            vatPercent: (vatPercent || 0),
            vatAmount: vatAmount,
            totalAmount: finalTotal,
            paymentMethod,
            amountPaid: actualAmountPaid,
            debtAmount,
            status: 'COMPLETED'
        };

        addOrder(newOrder);
        cart.forEach(item => updateStock(item.productId, -item.quantity));
        if (customer && debtAmount > 0) adjustDebt(customer.id, debtAmount);

        setCheckoutSuccessId(orderNum);
        setTimeout(() => {
            setCheckoutSuccessId(null);
            clearCart();
            setIsCheckoutOpen(false);
            setAmountPaidStr('');
        }, 1500);
    };

    const vietQRUrl = paymentMethod === 'TRANSFER' && settings.bankBin && settings.bankAccountNumber
        ? generateVietQRUrl(settings.bankBin, settings.bankAccountNumber, settings.bankAccountName, finalTotal, `Thanh toán đơn hàng ${checkoutSuccessId || 'POS'}`)
        : '';

    return (
        <div className="flex flex-col lg:flex-row h-full gap-3 overflow-hidden relative" style={{ height: 'calc(100vh - 84px)' }}>
            {/* Success Toast */}
            {checkoutSuccessId && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 bg-indigo-600 text-white border-2 border-indigo-400">
                    <CheckCircle2 size={24} className="text-white" />
                    <div>
                        <p className="font-black text-[0.85rem] uppercase tracking-wide">Thanh toán thành công</p>
                        <p className="font-bold text-[0.9rem] text-indigo-100">Đã tạo đơn hàng: {checkoutSuccessId}</p>
                    </div>
                </div>
            )}

            {/* Header / Tabs */}
            <div className="absolute top-[-56px] right-0 flex gap-2">
                <button onClick={() => setViewMode('POS')} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-t-2xl font-black text-[10px] uppercase tracking-widest transition-all", viewMode === 'POS' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}>
                    <ShoppingCart size={14} /> Bán hàng
                </button>
                <button onClick={() => setViewMode('HISTORY')} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-t-2xl font-black text-[10px] uppercase tracking-widest transition-all", viewMode === 'HISTORY' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}>
                    <History size={14} /> Lịch sử
                </button>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative z-10">
                <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row gap-3 bg-slate-50/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Tìm kiếm sản phẩm hoặc đơn hàng..." className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    {viewMode === 'POS' && (
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                            <button onClick={() => setActiveCat('all')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase border", activeCat === 'all' ? "bg-slate-900 border-slate-900 text-white" : "bg-white text-slate-400")}>Tất cả</button>
                            {categories.map(c => <button key={c.id} onClick={() => setActiveCat(c.id)} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase border", activeCat === c.id ? "bg-slate-900 border-slate-900 text-white" : "bg-white text-slate-400")}>{c.name}</button>)}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-auto">
                    {viewMode === 'POS' ? (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest sticky top-0">
                                <tr>
                                    <th className="px-5 py-3 w-16">Ảnh</th>
                                    <th className="px-4 py-3">Tên sản phẩm</th>
                                    <th className="px-4 py-3 text-center">Tồn</th>
                                    <th className="px-5 py-3 text-right">Giá</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredProducts.map(p => (
                                    <tr key={p.id} onClick={() => addToCart({ productId: p.id, sku: p.sku, name: p.name, unitPrice: p.retailPrice, inStock: p.inStock })} className="cursor-pointer hover:bg-slate-50 group">
                                        <td className="px-5 py-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden">
                                                {p.imageBase64 ? <img src={p.imageBase64} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-2 text-slate-300" />}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-700 uppercase text-xs">{p.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-black", p.inStock <= p.lowStockAlert ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-600")}>{p.inStock}</span>
                                        </td>
                                        <td className="px-5 py-3 text-right font-black text-indigo-600 text-sm">{formatCurrency(p.retailPrice)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredOrders.map(order => (
                                <div key={order.id} className="bg-white border rounded-[1.5rem] p-5 shadow-sm space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-black text-indigo-700 text-xs uppercase">{order.orderNumber}</div>
                                            <div className="text-[9px] text-slate-400">{new Date(order.createdAt).toLocaleString()}</div>
                                        </div>
                                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full uppercase">Hoàn thành</span>
                                    </div>
                                    <div className="flex justify-between text-xs"><span>Khách hàng</span><span className="font-bold">{order.customerName || 'Khách vãng lai'}</span></div>
                                    <div className="flex justify-between text-xs pt-2 border-t font-black"><span>Tổng tiền</span><span className="text-indigo-600">{formatCurrency(order.totalAmount)}</span></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Cart Sidebar */}
            <div className="w-full lg:w-96 bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-xl flex flex-col shrink-0">
                <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                    <span className="font-black uppercase text-[10px] tracking-widest">Giỏ hàng</span>
                    <button onClick={clearCart} className="p-2 hover:bg-rose-500 rounded-lg"><Trash2 size={16} /></button>
                </div>
                <div className="flex-1 overflow-auto px-4">
                    {cart.map(item => (
                        <div key={item.productId} className="py-4 border-b border-slate-50 flex justify-between items-center">
                            <div className="flex-1 min-w-0 pr-2">
                                <div className="font-bold text-slate-800 text-xs truncate uppercase tracking-tight">{item.name}</div>
                                <div className="text-[10px] text-slate-400 mt-1">{formatCurrency(item.unitPrice)}</div>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                                <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-6 h-6 bg-white rounded flex items-center justify-center font-bold shadow-sm">-</button>
                                <span className="w-6 text-center text-[11px] font-bold">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-6 h-6 bg-white rounded flex items-center justify-center font-bold shadow-sm">+</button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-5 bg-slate-50 border-t space-y-4">
                    <div className="bg-white p-4 rounded-2xl border space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase text-slate-400"><span>Tổng cộng</span><span className="text-slate-900">{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between items-end pt-2 border-t">
                            <span className="font-black text-xs uppercase">Thành tiền</span>
                            <span className="text-xl font-black text-indigo-700 leading-none">{formatCurrency(finalTotal)}</span>
                        </div>
                    </div>
                    <select value={customer?.id || ''} onChange={e => setCustomer(customers.find(c => c.id === e.target.value) || null)} className="w-full p-2 bg-white border rounded-xl text-xs font-bold outline-none">
                        <option value="">Khách vãng lai</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="flex gap-2">
                        <button disabled={cart.length === 0} onClick={() => openCheckout('CASH')} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase shadow-lg">Tiền mặt</button>
                        <button disabled={cart.length === 0} onClick={() => openCheckout('TRANSFER')} className="flex-1 py-3 bg-white border-2 border-slate-900 rounded-xl font-black text-[10px] uppercase">Chuyển khoản</button>
                    </div>
                </div>
            </div>

            {/* Checkout Modal */}
            {isCheckoutOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsCheckoutOpen(false)}>
                    <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="font-black uppercase text-lg">Thanh toán</h2>
                            <button onClick={() => setIsCheckoutOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex gap-2">
                                {(['CASH', 'TRANSFER', 'DEBT'] as const).map(m => (
                                    <button key={m} onClick={() => setPaymentMethod(m)} className={cn("flex-1 py-3 rounded-xl border-2 font-black text-[10px] uppercase transition-all", paymentMethod === m ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 bg-slate-50 text-slate-400")}>{m === 'CASH' ? 'Tiền mặt' : m === 'TRANSFER' ? 'Chuyển khoản' : 'Ghi nợ'}</button>
                                ))}
                            </div>
                            {paymentMethod === 'CASH' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Tiền khách đưa</label>
                                    <input type="text" value={amountPaidStr} onChange={e => setAmountPaidStr(e.target.value.replace(/[^0-9]/g, ''))} className="w-full p-4 text-3xl font-black text-right bg-slate-50 rounded-2xl outline-none" placeholder="0" />
                                </div>
                            )}
                            <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase opacity-60">Tổng thanh toán</span>
                                <span className="text-2xl font-black">{formatCurrency(finalTotal)}</span>
                            </div>
                            <button onClick={() => { handleConfirm(); window.print(); }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Hoàn tất & In hóa đơn</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Print Section */}
            <div className="hidden print:block">
                <ReceiptTemplate
                    companyName={settings.companyName}
                    companyAddress={settings.companyAddress}
                    companyPhone={settings.companyPhone}
                    orderNum={checkoutSuccessId || '---'}
                    orderDate={new Date().toISOString()}
                    customerName={customer?.name}
                    cart={cart}
                    subtotal={subtotal}
                    discountTotal={discountTotal || 0}
                    vatAmount={vatAmount}
                    totalAmount={finalTotal}
                    amountPaid={amountPaid}
                    paymentMethod={paymentMethod}
                    vietQRUrl={vietQRUrl}
                />
            </div>
        </div>
    );
}

function ReceiptTemplate(props: any) {
    return (
        <div id="invoice-print" className="p-4 font-mono text-black bg-white w-[80mm]">
            <div className="text-center mb-4 pb-4 border-b border-dashed">
                <div className="font-black text-sm uppercase">{props.companyName}</div>
                <div className="text-[9px] mb-1">{props.companyAddress}</div>
                <div className="text-[10px] font-bold">Hotline: {props.companyPhone}</div>
            </div>
            <div className="text-center mb-4">
                <div className="font-black text-xs uppercase mb-1">HÓA ĐƠN BÁN LẺ</div>
                <div className="text-[9px]">{new Date(props.orderDate).toLocaleString()}</div>
            </div>
            <table className="w-full text-[10px] mb-4">
                <thead className="border-b"><tr><th className="text-left py-1">Tên hàng</th><th className="text-right">SL</th><th className="text-right">Tiền</th></tr></thead>
                <tbody>
                    {props.cart.map((item: any) => (
                        <tr key={item.productId} className="border-b border-dashed"><td className="py-1">{item.name}</td><td className="text-right">{item.quantity}</td><td className="text-right">{formatCurrency(item.subtotal)}</td></tr>
                    ))}
                </tbody>
            </table>
            <div className="text-[10px] space-y-1">
                <div className="flex justify-between"><span>Tạm tính:</span><span>{formatCurrency(props.subtotal)}</span></div>
                <div className="flex justify-between font-black text-sm pt-2 border-t"><span>TỔNG CỘNG:</span><span>{formatCurrency(props.totalAmount)}</span></div>
            </div>
            <div className="text-center mt-6 text-[8px] italic opacity-50">Cảm ơn quý khách!</div>
        </div>
    );
}
