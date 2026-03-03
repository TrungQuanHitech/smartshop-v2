import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Users, Building2, History as HistoryIcon, FileText, ChevronRight } from 'lucide-react';
import { usePartnerStore } from '@/store/partner.store';
import { useSaleStore, useCashFlowStore } from '@/store/sale.store';
import { usePurchaseStore } from '@/store/purchase.store';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { Partner, PartnerType, SaleOrder, PurchaseOrder } from '@/types';

function OrderDetailModal({ order, onClose }: { order: SaleOrder | PurchaseOrder; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[120] flex items-center justify-center p-4 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <FileText size={20} />
                        </div>
                        <div>
                            <div className="font-black text-slate-900 uppercase tracking-tighter text-base">Chi tiết {order.orderNumber}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(order.createdAt)}</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">✕</button>
                </div>

                <div className="p-5 overflow-y-auto max-h-[60vh] no-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                <th className="pb-3">Sản phẩm</th>
                                <th className="pb-3 text-center">SL</th>
                                <th className="pb-3 text-right">Đơn giá</th>
                                <th className="pb-3 text-right">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {order.items.map((item: any, idx: number) => (
                                <tr key={idx} className="text-sm">
                                    <td className="py-3 pr-2">
                                        <div className="font-bold text-slate-800 leading-tight">{item.productName}</div>
                                        <div className="text-[10px] text-slate-400 font-medium">SKU: {item.sku}</div>
                                    </td>
                                    <td className="py-3 text-center font-bold text-slate-600">x{item.quantity}</td>
                                    <td className="py-3 text-right text-slate-500">{formatCurrency(item.unitPrice)}</td>
                                    <td className="py-3 text-right font-black text-slate-900">{formatCurrency(item.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-5 pt-5 border-t-2 border-dashed border-slate-100 space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                            <span>Tạm tính:</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        {(order as SaleOrder).vatAmount > 0 && (
                            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                                <span>VAT ({(order as SaleOrder).vatPercent}%):</span>
                                <span>{formatCurrency((order as SaleOrder).vatAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2">
                            <span className="font-black text-slate-900 uppercase tracking-tighter">Tổng thanh toán:</span>
                            <span className="text-xl font-black text-indigo-700">{formatCurrency(order.totalAmount)}</span>
                        </div>
                    </div>
                </div>

                <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <div className="flex-1 text-[10px] font-bold text-slate-400 uppercase leading-snug">
                        Thanh toán bằng: <span className="text-slate-700">{order.paymentMethod}</span><br />
                        Trạng thái: <span className={order.status === 'COMPLETED' ? 'text-emerald-600' : 'text-rose-600'}>{order.status}</span>
                    </div>
                    <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Đóng</button>
                </div>
            </div>
        </div>
    );
}

function PartnerHistoryModal({ partner, onClose }: { partner: Partner; onClose: () => void }) {
    const saleOrders = useSaleStore((s) => s.orders);
    const purchaseOrders = usePurchaseStore((s) => s.orders);

    const [selectedOrder, setSelectedOrder] = useState<SaleOrder | PurchaseOrder | null>(null);

    const history = partner.type === 'CUSTOMER'
        ? saleOrders.filter(o => o.customerId === partner.id)
        : purchaseOrders.filter(o => o.supplierId === partner.id);

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="font-black text-slate-900 uppercase tracking-tighter text-xl">Lịch sử giao dịch</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{partner.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                    {history.length === 0 ? (
                        <div className="py-20 text-center opacity-20 grayscale flex flex-col items-center gap-4">
                            <HistoryIcon size={64} strokeWidth={1} />
                            <p className="font-black uppercase tracking-widest text-xs">Chưa có lịch sử giao dịch</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((order: any) => (
                                <button
                                    key={order.id}
                                    onClick={() => setSelectedOrder(order)}
                                    className="w-full group p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all flex items-center justify-between text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-700 uppercase tracking-tight text-sm">{order.orderNumber}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(order.createdAt)}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-indigo-700 text-sm">{formatCurrency(order.totalAmount)}</div>
                                        <div className={cn(
                                            "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md inline-block mt-1",
                                            order.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                        )}>
                                            {order.status === 'COMPLETED' ? 'Thành công' : 'Đã hủy'}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="px-8 py-3 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all">Đóng</button>
                </div>
            </div>

            {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
        </div>
    );
}

function PartnerModal({ partner, onClose }: { partner?: Partner; onClose: () => void }) {
    const { addPartner, updatePartner } = usePartnerStore();
    const [form, setForm] = useState({
        name: partner?.name || '',
        phone: partner?.phone || '',
        email: partner?.email || '',
        address: partner?.address || '',
        type: partner?.type || 'CUSTOMER' as PartnerType,
        totalDebt: partner?.totalDebt || 0,
        notes: partner?.notes || '',
    });

    const handleSubmit = () => {
        if (!form.name) return;
        if (partner) updatePartner(partner.id, form);
        else addPartner(form);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in" onClick={(e) => e.stopPropagation()}>
                <div className="p-5 border-b flex items-center justify-between">
                    <h2 className="font-bold text-lg text-slate-800">{partner ? 'Sửa Đối Tác' : 'Thêm Đối Tác Mới'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <div className="p-5 space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Loại *</label>
                        <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PartnerType }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400">
                            <option value="CUSTOMER">Khách Hàng</option>
                            <option value="SUPPLIER">Nhà Cung Cấp</option>
                        </select>
                    </div>
                    {[
                        { key: 'name', label: 'Tên *', placeholder: 'Tên đầy đủ hoặc công ty...' },
                        { key: 'phone', label: 'Số điện thoại', placeholder: '09xxxxxxxx' },
                        { key: 'email', label: 'Email', placeholder: 'email@example.com' },
                        { key: 'address', label: 'Địa chỉ', placeholder: 'Địa chỉ...' },
                    ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
                            <input value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" />
                        </div>
                    ))}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Ghi chú</label>
                        <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 resize-none" />
                    </div>
                </div>
                <div className="p-5 pt-0 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50">Hủy</button>
                    <button onClick={handleSubmit} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold">{partner ? 'Cập Nhật' : 'Thêm Đối Tác'}</button>
                </div>
            </div>
        </div>
    );
}

export default function Partners() {
    const partners = usePartnerStore((s) => s.partners);
    const deletePartner = usePartnerStore((s) => s.deletePartner);
    const { addTransaction } = useCashFlowStore();
    const { adjustDebt } = usePartnerStore();

    const [tab, setTab] = useState<'all' | 'CUSTOMER' | 'SUPPLIER'>('all');
    const [search, setSearch] = useState('');
    const [editingPartner, setEditingPartner] = useState<Partner | undefined>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [debtModal, setDebtModal] = useState<{ partner: Partner } | null>(null);
    const [historyPartner, setHistoryPartner] = useState<Partner | null>(null);
    const [debtAmount, setDebtAmount] = useState('');

    const filtered = partners.filter((p) => {
        const matchTab = tab === 'all' || p.type === tab;
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.phone || '').includes(search);
        return matchTab && matchSearch;
    });

    const handlePayDebt = () => {
        if (!debtModal) return;
        const amount = parseFloat(debtAmount.replace(/[^0-9]/g, '')) || 0;
        if (amount <= 0) return;
        const isCustomer = debtModal.partner.type === 'CUSTOMER';
        adjustDebt(debtModal.partner.id, isCustomer ? -amount : amount);
        addTransaction({
            type: isCustomer ? 'INCOME' : 'EXPENSE',
            amount,
            title: `Thanh toán nợ - ${debtModal.partner.name}`,
            category: 'DEBT_PAYMENT',
            paymentMethod: 'CASH',
            createdAt: new Date().toISOString(),
        });
        setDebtModal(null);
        setDebtAmount('');
    };

    return (
        <div className="space-y-4 animate-in">
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-2">
                    {[['all', 'Tất cả'], ['CUSTOMER', 'Khách Hàng'], ['SUPPLIER', 'Nhà Cung Cấp']].map(([val, label]) => (
                        <button key={val} onClick={() => setTab(val as any)} className={cn('px-4 py-2 rounded-xl text-sm font-semibold transition-colors', tab === val ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300')}>
                            {label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm..." className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-white w-52" />
                    </div>
                    <button onClick={() => { setEditingPartner(undefined); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">
                        <Plus className="w-4 h-4" /> Thêm Đối Tác
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Đối tác</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Liên hệ</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Loại</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Công nợ</th>
                                <th className="px-4 py-3 w-24"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-10 text-slate-400">Không có đối tác nào</td></tr>
                            ) : filtered.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50 group">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold', p.type === 'CUSTOMER' ? 'bg-indigo-500' : 'bg-purple-500')}>
                                                {p.name.charAt(0)}
                                            </div>
                                            <div>
                                                <button
                                                    onClick={() => setHistoryPartner(p)}
                                                    className="font-black text-slate-700 uppercase tracking-tight hover:text-indigo-600 transition-colors text-left"
                                                >
                                                    {p.name}
                                                </button>
                                                {p.notes && <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight opacity-70">{p.notes}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">
                                        <div>{p.phone}</div>
                                        {p.email && <div className="text-xs text-slate-400">{p.email}</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', p.type === 'CUSTOMER' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700')}>
                                            {p.type === 'CUSTOMER' ? 'Khách hàng' : 'Nhà cung cấp'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {Math.abs(p.totalDebt) > 0 ? (
                                            <button onClick={() => setDebtModal({ partner: p })} className="hover:underline font-bold" title="Click để thanh toán nợ">
                                                <span className={p.totalDebt > 0 ? 'text-orange-600' : 'text-red-600'}>
                                                    {p.totalDebt > 0 ? `+${formatCurrency(p.totalDebt)}` : formatCurrency(p.totalDebt)}
                                                </span>
                                            </button>
                                        ) : (<span className="text-emerald-600 font-medium text-xs">Không nợ</span>)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingPartner(p); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => { if (confirm('Xóa đối tác này?')) deletePartner(p.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Debt payment modal */}
            {debtModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDebtModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in" onClick={(e) => e.stopPropagation()}>
                        <div className="p-5 border-b">
                            <h3 className="font-bold text-slate-800">Thanh Toán Nợ</h3>
                            <p className="text-sm text-slate-500 mt-1">{debtModal.partner.name}</p>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="bg-slate-50 rounded-xl p-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Số nợ hiện tại:</span>
                                    <span className="font-bold text-orange-600">{formatCurrency(Math.abs(debtModal.partner.totalDebt))}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Số tiền thanh toán</label>
                                <input autoFocus type="text" value={debtAmount} onChange={(e) => setDebtAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Nhập số tiền..." className="w-full px-3 py-2.5 text-lg font-bold text-right border-2 border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500" />
                            </div>
                        </div>
                        <div className="p-5 pt-0 flex gap-3">
                            <button onClick={() => setDebtModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold">Hủy</button>
                            <button onClick={handlePayDebt} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white font-bold">Xác Nhận Thanh Toán</button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && <PartnerModal partner={editingPartner} onClose={() => setIsModalOpen(false)} />}
            {historyPartner && <PartnerHistoryModal partner={historyPartner} onClose={() => setHistoryPartner(null)} />}
        </div>
    );
}
