import { useState, useMemo } from 'react';
import { Plus, Search, Truck, Package, Trash2 } from 'lucide-react';
import { useProductStore } from '@/store/product.store';
import { usePartnerStore } from '@/store/partner.store';
import { usePurchaseStore } from '@/store/purchase.store';
import { usePurchaseTransaction } from '@/hooks/usePurchaseTransaction';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

export default function Purchases() {
    const products = useProductStore((s) => s.products);
    const partners = usePartnerStore((s) => s.partners);
    const suppliers = partners.filter(p => p.type === 'SUPPLIER');
    const orders = usePurchaseStore((s) => s.orders);
    const { executePurchase } = usePurchaseTransaction();

    const [tab, setTab] = useState<'new' | 'history'>('new');
    const [supplierId, setSupplierId] = useState('');
    const [vatPercent, setVatPercent] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'DEBT'>('CASH');
    const [search, setSearch] = useState('');
    const [cartItems, setCartItems] = useState<{ productId: string; productName: string; name: string; sku: string; quantity: number; unitPrice: number }[]>([]);
    const [amountPaidStr, setAmountPaidStr] = useState('');

    const filteredProducts = useMemo(() =>
        products.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())),
        [products, search]
    );

    const addItem = (p: typeof products[0]) => {
        setCartItems((prev) => {
            const existing = prev.find((i) => i.productId === p.id);
            if (existing) return prev.map((i) => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { productId: p.id, productName: p.name, name: p.name, sku: p.sku, quantity: 1, unitPrice: p.importPrice }];
        });
    };

    const subtotal = cartItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const vatAmount = Math.round(subtotal * vatPercent / 100);
    const totalAmount = subtotal + vatAmount;
    const amountPaid = parseFloat(amountPaidStr.replace(/[^0-9]/g, '')) || 0;

    const handleSubmit = () => {
        if (cartItems.length === 0) return;
        const supplier = suppliers.find((s) => s.id === supplierId) || null;
        executePurchase({ items: cartItems, supplier, paymentMethod, amountPaid: paymentMethod === 'DEBT' ? 0 : Math.min(amountPaid, totalAmount), vatPercent });
        setCartItems([]);
        setSupplierId('');
        setAmountPaidStr('');
        setTab('history');
    };

    return (
        <div className="space-y-4 animate-in">
            <div className="flex gap-2">
                {[['new', 'Tạo Phiếu Nhập'], ['history', 'Lịch Sử Nhập']].map(([val, label]) => (
                    <button key={val} onClick={() => setTab(val as any)} className={cn('px-4 py-2 rounded-xl text-sm font-semibold transition-colors', tab === val ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300')}>
                        {label}
                    </button>
                ))}
            </div>

            {tab === 'new' ? (
                <div className="flex flex-col lg:flex-row gap-4 h-full">
                    {/* Product search */}
                    <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-3 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm sản phẩm..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 bg-slate-50" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {filteredProducts.map((p) => (
                                <div key={p.id} onClick={() => addItem(p)} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-transparent hover:border-indigo-200 hover:bg-indigo-50 cursor-pointer transition-colors group">
                                    <Package className="w-8 h-8 text-slate-300 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-slate-800 truncate">{p.name}</div>
                                        <div className="text-xs text-slate-500">{p.sku} • Giá nhập: {formatCurrency(p.importPrice)} • Tồn: {p.inStock}</div>
                                    </div>
                                    <button className="w-7 h-7 flex items-center justify-center bg-indigo-600 text-white rounded-lg opacity-0 group-hover:opacity-100 text-sm font-bold"><Plus className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Purchase order */}
                    <div className="w-full lg:w-[380px] bg-white rounded-xl border border-indigo-100 shadow-md flex flex-col">
                        <div className="p-4 border-b bg-indigo-50/50">
                            <h3 className="font-bold text-indigo-900 flex items-center gap-2"><Truck className="w-4 h-4" /> Phiếu Nhập Hàng</h3>
                        </div>
                        <div className="p-3 border-b">
                            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400">
                                <option value="">Chọn Nhà Cung Cấp...</option>
                                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                            {cartItems.length === 0 ? (
                                <div className="flex items-center justify-center h-24 text-slate-400 text-sm">Chọn sản phẩm để thêm vào phiếu nhập</div>
                            ) : cartItems.map((item) => (
                                <div key={item.productId} className="p-3">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-medium text-slate-800 flex-1">{item.name}</span>
                                        <button onClick={() => setCartItems((p) => p.filter((i) => i.productId !== item.productId))} className="p-1 text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                                            <button onClick={() => setCartItems((p) => p.map((i) => i.productId === item.productId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))} className="w-6 h-6 flex items-center justify-center bg-white rounded-md text-xs font-bold shadow-sm">-</button>
                                            <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                                            <button onClick={() => setCartItems((p) => p.map((i) => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i))} className="w-6 h-6 flex items-center justify-center bg-white rounded-md text-xs font-bold shadow-sm">+</button>
                                        </div>
                                        <span className="text-xs text-slate-400">×</span>
                                        <input type="number" value={item.unitPrice} onChange={(e) => setCartItems((p) => p.map((i) => i.productId === item.productId ? { ...i, unitPrice: +e.target.value } : i))} className="flex-1 px-2 py-1 text-xs text-right border border-slate-200 rounded-md focus:outline-none focus:border-indigo-400" />
                                        <span className="text-xs font-bold text-indigo-700 w-24 text-right">{formatCurrency(item.quantity * item.unitPrice)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 border-t space-y-2">
                            <div className="flex justify-between text-sm"><span className="text-slate-500">Tạm tính</span><span>{formatCurrency(subtotal)}</span></div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-500">VAT (%)</span>
                                <input type="number" value={vatPercent} onChange={(e) => setVatPercent(+e.target.value)} className="w-16 px-2 py-1 text-right text-sm border border-slate-200 rounded-md focus:outline-none focus:border-indigo-400" />
                                <span className="ml-auto font-semibold">{formatCurrency(vatAmount)}</span>
                            </div>
                            <div className="flex justify-between font-black text-base border-t pt-2"><span>TỔNG</span><span className="text-indigo-700">{formatCurrency(totalAmount)}</span></div>
                            <div className="flex gap-1.5">
                                {['CASH', 'TRANSFER', 'DEBT'].map((m) => (
                                    <button key={m} onClick={() => setPaymentMethod(m as any)} className={cn('flex-1 py-1.5 text-xs font-semibold rounded-lg border-2 transition-colors', paymentMethod === m ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500')}>
                                        {m === 'CASH' ? 'Tiền mặt' : m === 'TRANSFER' ? 'Chuyển khoản' : 'Ghi nợ'}
                                    </button>
                                ))}
                            </div>
                            {paymentMethod !== 'DEBT' && (
                                <input type="text" value={amountPaidStr} onChange={(e) => setAmountPaidStr(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Số tiền đã trả..." className="w-full px-3 py-2 text-sm text-right border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" />
                            )}
                            <button onClick={handleSubmit} disabled={cartItems.length === 0} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                Lưu Phiếu Nhập & Cập Nhật Kho
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Mã phiếu</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nhà cung cấp</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tổng tiền</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Đã trả</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ngày nhập</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-10 text-slate-400">Chưa có phiếu nhập nào</td></tr>
                                ) : orders.map((o) => (
                                    <tr key={o.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-mono font-semibold text-indigo-600">{o.orderNumber}</td>
                                        <td className="px-4 py-3 text-slate-700">{o.supplierName || 'Không rõ'}</td>
                                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(o.totalAmount)}</td>
                                        <td className="px-4 py-3 text-right">
                                            {o.debtAmount > 0 ? (
                                                <span className="text-orange-600 font-semibold">Nợ {formatCurrency(o.debtAmount)}</span>
                                            ) : (
                                                <span className="text-emerald-600 font-semibold text-xs">Đã thanh toán</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(o.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
