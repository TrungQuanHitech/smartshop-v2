import { useState, useMemo, useRef } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, Banknote, QrCode, CreditCard, Printer, X, Package, CheckCircle2, History, Percent, Camera } from 'lucide-react';
import { useProductStore } from '@/store/product.store';
import { usePosStore } from '@/store/pos.store';
import { usePartnerStore } from '@/store/partner.store';
import { useSettingsStore } from '@/store/settings.store';
import { useSaleTransaction } from '@/hooks/useSaleTransaction';
import { formatCurrency, generateVietQRUrl, cn } from '@/lib/utils';
import type { PaymentMethod } from '@/types';

export default function POS() {
    const products = useProductStore((s) => s.products);
    const categories = useProductStore((s) => s.categories);
    const partners = usePartnerStore((s) => s.partners);
    const customers = partners.filter(p => p.type === 'CUSTOMER');
    const settings = useSettingsStore((s) => s.settings);
    const { executeSale } = useSaleTransaction();

    const [viewMode, setViewMode] = useState<'POS' | 'HISTORY'>('POS');
    const [search, setSearch] = useState('');
    const [activeCat, setActiveCat] = useState('all');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
    const [amountPaidStr, setAmountPaidStr] = useState('');
    const [checkoutSuccessId, setCheckoutSuccessId] = useState<string | null>(null);

    const {
        cart, customer, discountTotal, vatPercent, orders,
        addToCart, removeFromCart, updateQuantity, setCustomer,
        setDiscountTotal, setVatPercent, addOrder, clearCart,
        getSubtotal, getVatAmount, getFinalTotal
    } = usePosStore();

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
            o.customer?.name.toLowerCase().includes(search.toLowerCase())
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
        const newOrder: any = {
            id: crypto.randomUUID(),
            orderNumber: orderNum,
            date: new Date().toISOString(),
            customer,
            items: [...cart],
            subtotal,
            discountTotal,
            vat: vatAmount,
            finalTotal,
            paymentMethod,
            amountPaid: paymentMethod === 'DEBT' ? 0 : (amountPaid || finalTotal),
            status: 'COMPLETED'
        };

        addOrder(newOrder);
        setCheckoutSuccessId(orderNum);

        // Success feedback
        setTimeout(() => {
            setCheckoutSuccessId(null);
            clearCart();
            setIsCheckoutOpen(false);
            setAmountPaidStr('');
        }, 1500);
    };

    const vietQRUrl = paymentMethod === 'TRANSFER' && settings.bankBin && settings.bankAccountNumber
        ? generateVietQRUrl(settings.bankBin, settings.bankAccountNumber, settings.bankAccountName, finalTotal, `Thanh toan don hang`)
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
                <button
                    onClick={() => setViewMode('POS')}
                    className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-t-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                        viewMode === 'POS' ? "bg-white text-indigo-600 shadow-[-4px_-4px_10px_rgba(0,0,0,0.05)] border-t border-x border-slate-100" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <ShoppingCart size={14} /> Bán hàng
                </button>
                <button
                    onClick={() => setViewMode('HISTORY')}
                    className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-t-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                        viewMode === 'HISTORY' ? "bg-white text-indigo-600 shadow-[-4px_-4px_10px_rgba(0,0,0,0.05)] border-t border-x border-slate-100" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <History size={14} /> Lịch sử
                </button>
            </div>

            {/* LEFT AREA: Products or History */}
            <div className="flex-1 flex flex-col min-w-0 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative z-10">
                <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row gap-3 bg-slate-50/50">
                    <div className="flex-1 flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder={viewMode === 'POS' ? "Tìm hàng hóa (F2)..." : "Tìm mã đơn, tên khách..."}
                                className="w-full pl-10 pr-16 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-700 transition-all font-mono"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {viewMode === 'POS' && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 text-slate-300">
                                    <div className="p-1 hover:text-indigo-500 cursor-pointer transition-colors"><Camera size={16} /></div>
                                    <div className="p-1 hover:text-indigo-500 cursor-pointer transition-colors"><QrCode size={16} /></div>
                                </div>
                            )}
                        </div>
                        {viewMode === 'POS' && (
                            <div className="flex gap-1.5 overflow-x-auto no-scrollbar max-w-[400px]">
                                <button
                                    onClick={() => setActiveCat('all')}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                                        activeCat === 'all' ? "bg-slate-900 border-slate-900 text-white shadow-lg" : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                                    )}
                                >
                                    Tất cả
                                </button>
                                {categories.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setActiveCat(c.id)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                                            activeCat === c.id ? "bg-slate-900 border-slate-900 text-white shadow-lg" : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                                        )}
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-auto no-scrollbar">
                    {viewMode === 'POS' ? (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-200 sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-5 py-4 text-center w-16">Ảnh</th>
                                    <th className="px-4 py-4">Tên sản phẩm</th>
                                    <th className="px-4 py-4 text-center w-24">Tồn</th>
                                    <th className="px-5 py-4 text-right w-32">Giá bán</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredProducts.map(p => (
                                    <tr
                                        key={p.id}
                                        onClick={() => addToCart({ productId: p.id, sku: p.sku, name: p.name, unitPrice: p.retailPrice, inStock: p.inStock })}
                                        className="cursor-pointer hover:bg-slate-50/80 transition-all group"
                                    >
                                        <td className="px-5 py-3 text-center">
                                            <div className="w-10 h-10 rounded-xl border border-slate-100 shadow-sm mx-auto overflow-hidden bg-slate-50 group-hover:scale-110 transition-transform">
                                                {p.imageBase64 ? (
                                                    <img src={p.imageBase64} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-full h-full p-2 text-slate-200" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-black text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{p.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono font-bold mt-0.5 uppercase tracking-widest">{p.sku}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-lg text-xs font-black",
                                                p.inStock <= 0 ? 'bg-rose-50 text-rose-500' : p.inStock <= p.lowStockAlert ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-600'
                                            )}>
                                                {p.inStock}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="font-black text-indigo-700 text-sm">{formatCurrency(p.retailPrice)}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-4 space-y-4">
                            {filteredOrders.length === 0 ? (
                                <div className="py-20 text-center opacity-30 grayscale flex flex-col items-center">
                                    <History size={48} className="mb-4" />
                                    <p className="font-black uppercase tracking-widest text-sm">Chưa có giao dịch nào</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredOrders.map(order => (
                                        <div key={order.id} className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm hover:shadow-md transition-all group flex flex-col gap-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-black text-indigo-700 text-sm mb-1 uppercase tracking-wider">{order.orderNumber}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(order.date).toLocaleString('vi-VN')}</div>
                                                </div>
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                    order.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700 text-[10px]" : "bg-rose-100 text-rose-700"
                                                )}>
                                                    {order.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'}
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-400 font-bold uppercase tracking-tight">Khách hàng</span>
                                                    <span className="font-black text-slate-700">{order.customer?.name || 'Khách vãng lai'}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-400 font-bold uppercase tracking-tight">Mặt hàng</span>
                                                    <span className="font-black text-slate-700">{order.items.length} SP</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-50">
                                                    <span className="text-slate-800 font-black uppercase tracking-widest text-[10px]">Tổng tiền</span>
                                                    <span className="font-black text-indigo-600">{formatCurrency(order.finalTotal)}</span>
                                                </div>
                                            </div>

                                            <button className="w-full py-2 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Chi tiết & In lại</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Cart Sidebar */}
            <div className="w-full lg:w-96 flex flex-col bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-2xl shrink-0 z-10 transition-all">
                <div className="p-5 bg-slate-900 text-white flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                            <ShoppingCart size={16} />
                        </div>
                        <span className="font-black uppercase tracking-widest text-[11px]">Giỏ hàng của bạn</span>
                    </div>
                    <button onClick={clearCart} className="p-2 hover:bg-rose-500 rounded-xl transition-all"><Trash2 size={16} /></button>
                </div>

                <div className="flex-1 overflow-auto no-scrollbar px-3">
                    {cart.map(item => (
                        <div key={item.productId} className="py-4 px-2 border-b border-slate-50 group">
                            <div className="flex justify-between items-start gap-3 mb-2">
                                <div className="font-black text-slate-800 text-[0.9rem] leading-tight flex-1 uppercase tracking-tight">{item.name}</div>
                                <button onClick={() => removeFromCart(item.productId)} className="text-slate-200 hover:text-rose-500 transition-colors"><X size={18} /></button>
                            </div>
                            <div className="flex justify-between items-center mt-3">
                                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-7 h-7 bg-white hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 shadow-sm transition-all font-black">-</button>
                                    <span className="font-black text-[0.85rem] w-6 text-center text-slate-800 font-mono">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= item.inStock} className="w-7 h-7 bg-white hover:bg-indigo-600 hover:text-white rounded-lg flex items-center justify-center text-slate-600 shadow-sm transition-all font-black text-xs">+</button>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-slate-900 text-[0.9rem] font-mono">{formatCurrency(item.subtotal)}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="py-32 flex flex-col items-center justify-center text-slate-300 gap-4 opacity-30">
                            <ShoppingCart size={64} strokeWidth={1} />
                            <p className="text-[10px] font-black uppercase tracking-widest">Giỏ hàng đang trống</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
                    <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-3">
                        <div className="flex justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest"><span>Tạm tính (Sl: {cart.length})</span><span className="font-mono">{formatCurrency(subtotal)}</span></div>

                        <div className="flex justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-1">Chiết khấu (%)</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    className="w-16 border-b-2 border-slate-100 bg-transparent text-right outline-none text-rose-500 font-black text-sm p-1 focus:border-rose-500 transition-all font-mono"
                                    value={discountTotal || ''}
                                    onChange={(e) => setDiscountTotal(parseFloat(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                                    placeholder="0"
                                />
                                <span className="text-rose-500 font-black">đ</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-1">Thuế VAT (%)</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    className="w-16 border-b-2 border-slate-100 bg-transparent text-right outline-none text-indigo-500 font-black text-sm p-1 focus:border-indigo-500 transition-all font-mono"
                                    value={vatPercent || ''}
                                    onChange={(e) => setVatPercent(parseFloat(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                                    placeholder="0"
                                />
                                <span className="text-indigo-500 font-black line-clamp-1">%</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
                            <span className="font-black text-slate-900 uppercase text-xs tracking-widest">Tổng cộng</span>
                            <span className="text-2xl font-black text-indigo-700 leading-none font-mono tracking-tighter">{formatCurrency(finalTotal)}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Chọn khách hàng</label>
                        <select
                            value={customer?.id || ''}
                            onChange={e => {
                                const found = customers.find(c => c.id === e.target.value) || null;
                                setCustomer(found);
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[0.85rem] font-bold shadow-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                        >
                            <option value="">Khách vãng lai (Lẻ)</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        {['CASH', 'TRANSFER', 'DEBT'].map(m => (
                            <button
                                key={m}
                                onClick={() => openCheckout(m as PaymentMethod)}
                                disabled={cart.length === 0}
                                className={cn(
                                    "flex-1 py-3 rounded-xl font-bold uppercase text-[0.7rem] tracking-tighter transition-all active:scale-95 shadow-lg",
                                    m === 'CASH' ? "bg-slate-900 text-white" : m === 'TRANSFER' ? "bg-white border-2 border-slate-900 text-slate-900" : "bg-orange-500 text-white"
                                )}
                            >
                                {m === 'CASH' ? 'Tiền mặt' : m === 'TRANSFER' ? 'Chuyển khoản' : 'Ghi nợ'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ===== CHECKOUT MODAL (REDESIGNED) ===== */}
            {isCheckoutOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsCheckoutOpen(false)}>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col lg:flex-row overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>

                        {/* Left Side: Receipt Preview */}
                        <div className="flex-1 bg-slate-50 p-8 overflow-y-auto no-scrollbar border-r border-slate-100 hidden lg:block">
                            <div className="text-center mb-6">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Xem trước hóa đơn</p>
                                <div className="bg-white shadow-xl rounded-2xl inline-block text-left p-0 transform scale-90 origin-top">
                                    <ReceiptTemplate
                                        companyName={settings.companyName}
                                        companyAddress={settings.companyAddress}
                                        companyPhone={settings.companyPhone}
                                        orderNum="HD-PREVIEW"
                                        orderDate={new Date().toISOString()}
                                        customerName={customer?.name}
                                        cart={cart}
                                        subtotal={subtotal}
                                        discountTotal={discountTotal}
                                        vat={vatAmount}
                                        finalTotal={finalTotal}
                                        amountPaid={amountPaid}
                                        paymentMethod={paymentMethod}
                                        vietQRUrl={vietQRUrl}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Payment Controls */}
                        <div className="w-full lg:w-[400px] p-8 flex flex-col bg-white">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Thanh toán</h2>
                                <button onClick={() => setIsCheckoutOpen(false)} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"><X size={20} /></button>
                            </div>

                            <div className="flex-1 space-y-6">
                                <div className="grid grid-cols-3 gap-2">
                                    {(['CASH', 'TRANSFER', 'DEBT'] as PaymentMethod[]).map(m => (
                                        <button
                                            key={m}
                                            onClick={() => {
                                                setPaymentMethod(m);
                                                setAmountPaidStr(m === 'TRANSFER' ? String(finalTotal) : '');
                                            }}
                                            className={cn(
                                                "py-3 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all",
                                                paymentMethod === m ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-lg shadow-indigo-100" : "border-slate-50 bg-slate-50 text-slate-400 grayscale hover:grayscale-0 hover:border-slate-200"
                                            )}
                                        >
                                            {m === 'CASH' && <Banknote size={20} />}
                                            {m === 'TRANSFER' && <QrCode size={20} />}
                                            {m === 'DEBT' && <CreditCard size={20} />}
                                            <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                                                {m === 'CASH' ? 'Tiền mặt' : m === 'TRANSFER' ? 'Chuyển khoản' : 'Ghi nợ'}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-50">
                                    {paymentMethod === 'TRANSFER' && (
                                        <div className="flex flex-col items-center gap-4 py-4 animate-in slide-in-from-bottom-4">
                                            {vietQRUrl ? (
                                                <div className="relative group">
                                                    <img src={vietQRUrl} alt="VietQR" className="w-48 h-48 rounded-[2rem] border-8 border-indigo-50 shadow-2xl transition-transform group-hover:scale-105" />
                                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl"><QrCode size={20} /></div>
                                                </div>
                                            ) : (
                                                <div className="text-center p-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 w-full">
                                                    <QrCode size={48} className="mx-auto text-slate-200 mb-2" />
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chưa có thông tin QR</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {paymentMethod === 'CASH' && (
                                        <div className="space-y-4 animate-in slide-in-from-bottom-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tiền khách đưa (VNĐ)</label>
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={amountPaidStr ? parseInt(amountPaidStr).toLocaleString('vi-VN') : ''}
                                                    onChange={(e) => setAmountPaidStr(e.target.value.replace(/[^0-9]/g, ''))}
                                                    placeholder="0"
                                                    className="w-full px-5 py-5 text-4xl font-black text-right bg-slate-50 border-none rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 text-indigo-700 shadow-inner"
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 gap-2">
                                                {[subtotal, 100000, 200000, 500000].map((amt) => (
                                                    <button key={amt} onClick={() => setAmountPaidStr(String(amt))} className="py-3 text-[10px] font-black rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                                        {amt >= 1000 ? `${(amt / 1000).toLocaleString()}K` : amt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 pt-4">
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng cần thu:</span>
                                            <span className="text-xl font-black text-slate-900 font-mono tracking-tighter">{formatCurrency(finalTotal)}</span>
                                        </div>
                                        {paymentMethod === 'CASH' && (
                                            <div className={cn(
                                                "flex justify-between items-center p-5 rounded-[1.5rem] transition-all border-l-8",
                                                change >= 0 ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-rose-50 border-rose-500 text-rose-700"
                                            )}>
                                                <span className="text-[10px] font-black uppercase tracking-widest">{change >= 0 ? 'Tiền thối lại' : 'Còn thiếu'}</span>
                                                <span className="text-2xl font-black font-mono">{formatCurrency(Math.abs(change))}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 flex gap-4 mt-auto">
                                <button onClick={() => setIsCheckoutOpen(false)} className="px-6 py-4 rounded-2xl bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all">Hủy</button>
                                <button
                                    onClick={() => {
                                        handleConfirm();
                                        window.print();
                                    }}
                                    disabled={(paymentMethod === 'CASH' && amountPaid < finalTotal) || (paymentMethod === 'DEBT' && !customer) || cart.length === 0}
                                    className="flex-1 py-4 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-slate-900/30 flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                                >
                                    <Printer size={18} /> Hoàn tất & In Hóa đơn
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Receipt */}
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
                    discountTotal={discountTotal}
                    vat={vatAmount}
                    finalTotal={finalTotal}
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
        <div id="invoice-print" className="p-10 font-mono text-black bg-white w-[80mm] mx-auto">
            <div className="text-center mb-6">
                <div className="font-black text-lg uppercase tracking-widest mb-1">{props.companyName}</div>
                <div className="text-[10px] leading-relaxed opacity-80">{props.companyAddress}</div>
                <div className="text-[10px] font-bold mt-1">Hotline: {props.companyPhone}</div>

                <div className="my-6 space-y-1">
                    <div className="font-black text-sm uppercase tracking-widest">HÓA ĐƠN BÁN LẺ</div>
                    <div className="text-[10px] font-bold text-slate-400 capitalize">{new Date(props.orderDate).toLocaleString('vi-VN')}</div>
                </div>

                <div className="text-[10px] flex justify-between border-b border-dashed border-slate-300 pb-2 mb-4">
                    <span className="font-bold">Mã HĐ: {props.orderNum}</span>
                    <span className="italic">{props.paymentMethod}</span>
                </div>
            </div>

            <div className="space-y-4 mb-6">
                {props.customerName && (
                    <div className="flex justify-between text-[10px] border-b border-slate-100 pb-1">
                        <span className="text-slate-400 uppercase font-black tracking-tighter">Khách hàng:</span>
                        <span className="font-black text-right">{props.customerName}</span>
                    </div>
                )}
            </div>

            <table className="w-full text-[11px] mb-6 border-collapse">
                <thead className="border-b-2 border-slate-900">
                    <tr>
                        <th className="text-left py-2 font-black uppercase">Tên hàng</th>
                        <th className="text-right py-2 font-black w-8">SL</th>
                        <th className="text-right py-2 font-black w-24">T.Tiền</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-slate-200">
                    {props.cart.map((item: any) => (
                        <tr key={item.productId}>
                            <td className="py-2 pr-2 leading-tight font-bold">{item.name}</td>
                            <td className="text-right py-2 font-bold font-mono">{item.quantity}</td>
                            <td className="text-right py-2 font-black font-mono">{formatCurrency(item.subtotal)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="space-y-2 text-[11px] border-t-2 border-slate-900 pt-4">
                <div className="flex justify-between text-slate-500">
                    <span>Tạm tính:</span>
                    <span className="font-bold">{formatCurrency(props.subtotal)}</span>
                </div>
                {props.discountTotal > 0 && (
                    <div className="flex justify-between text-rose-500 italic">
                        <span>Chiết khấu:</span>
                        <span className="font-black">-{formatCurrency(props.discountTotal)}</span>
                    </div>
                )}
                {props.vat > 0 && (
                    <div className="flex justify-between text-slate-500">
                        <span>Thuế VAT:</span>
                        <span className="font-bold">+{formatCurrency(props.vat)}</span>
                    </div>
                )}
                <div className="flex justify-between font-black text-sm uppercase pt-2 border-t border-dashed border-slate-200">
                    <span>TỔNG CỘNG:</span>
                    <span className="text-lg">{formatCurrency(props.finalTotal)}</span>
                </div>
            </div>

            {props.vietQRUrl && (
                <div className="mt-8 flex flex-col items-center">
                    <div className="text-[9px] font-black uppercase tracking-widest mb-3 text-slate-400">Quét mã chuyển khoản</div>
                    <img src={props.vietQRUrl} alt="QR" className="w-40 h-40 border-2 border-slate-100 rounded-xl shadow-lg" />
                </div>
            )}

            <div className="text-center mt-10 space-y-1">
                <div className="text-[10px] font-black uppercase tracking-widest italic opacity-50">Cảm ơn quý khách!</div>
                <div className="text-[8px] font-bold text-slate-400">Bản in từ SmartShop Cloud ERP</div>
            </div>
        </div>
    );
}

const AlertTriangle = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);
