import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Users, Building2 } from 'lucide-react';
import { usePartnerStore } from '@/store/partner.store';
import { useCashFlowStore } from '@/store/sale.store';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { Partner, PartnerType } from '@/types';

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
                                                <div className="font-medium text-slate-800">{p.name}</div>
                                                {p.notes && <div className="text-xs text-slate-400">{p.notes}</div>}
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
        </div>
    );
}
