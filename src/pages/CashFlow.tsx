import { useState, useEffect } from 'react';
import { Plus, Wallet, ArrowDownRight, ArrowUpRight, Trash2, Search } from 'lucide-react';
import { useCashFlowStore } from '@/store/sale.store';
import { useAIStore } from '@/store/ai.store';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import type { TransactionType } from '@/types';

function TxModal({ onClose }: { onClose: () => void }) {
    const { addTransaction } = useCashFlowStore();
    const [form, setForm] = useState({
        type: 'INCOME' as TransactionType,
        amount: '',
        title: '',
        description: '',
        category: 'OTHER',
        paymentMethod: 'CASH' as 'CASH' | 'TRANSFER',
    });

    const handleSubmit = () => {
        const amount = parseFloat(form.amount.replace(/[^0-9]/g, '')) || 0;
        if (!form.title || amount <= 0) return;
        addTransaction({ ...form, amount, createdAt: new Date().toISOString() });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in" onClick={(e) => e.stopPropagation()}>
                <div className="p-5 border-b">
                    <h2 className="font-bold text-lg text-slate-800">Lập Phiếu {form.type === 'INCOME' ? 'Thu' : 'Chi'}</h2>
                </div>
                <div className="p-5 space-y-3">
                    <div className="flex gap-2">
                        {(['INCOME', 'EXPENSE'] as const).map((t) => (
                            <button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))} className={cn('flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors', form.type === t ? (t === 'INCOME' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-400 bg-red-50 text-red-700') : 'border-slate-200 text-slate-500 hover:border-slate-300')}>
                                {t === 'INCOME' ? '↓ Thu tiền' : '↑ Chi tiền'}
                            </button>
                        ))}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Số tiền *</label>
                        <input type="text" autoFocus value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value.replace(/[^0-9]/g, '') }))} placeholder="0" className="w-full px-3 py-2.5 text-xl font-bold text-right border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Nội dung *</label>
                        <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Mô tả ngắn gọn..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Phương thức</label>
                        <select value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value as any }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400">
                            <option value="CASH">Tiền mặt</option>
                            <option value="TRANSFER">Chuyển khoản</option>
                        </select>
                    </div>
                </div>
                <div className="p-5 pt-0 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold">Hủy</button>
                    <button onClick={handleSubmit} className={cn('flex-1 py-2.5 rounded-xl text-white font-bold transition-colors', form.type === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600')}>Lưu</button>
                </div>
            </div>
        </div>
    );
}

export default function CashFlow() {
    const { transactions, addTransaction, deleteTransaction, getBalance, getMonthIncome, getMonthExpense } = useCashFlowStore();
    const { lastCommand, executeCommand, globalSearch, setGlobalSearch } = useAIStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'INCOME' | 'EXPENSE'>('all');

    // Sync with Global AI Search
    useEffect(() => {
        if (globalSearch) {
            setSearch(globalSearch);
            setGlobalSearch('');
        }
    }, [globalSearch, setGlobalSearch]);

    // AI Command Executor
    useEffect(() => {
        if (!lastCommand) return;

        if (lastCommand.type === 'ADD_TRANSACTION') {
            const { title, amount, transactionType, category } = lastCommand as any;
            if (title && amount > 0) {
                addTransaction({
                    title,
                    amount,
                    type: transactionType || 'EXPENSE',
                    category: category || 'OTHER',
                    paymentMethod: 'CASH',
                    createdAt: new Date().toISOString()
                });
            }
            executeCommand(lastCommand);
        }
    }, [lastCommand, addTransaction, executeCommand]);

    const filtered = transactions.filter((t) => {
        const matchType = typeFilter === 'all' || t.type === typeFilter;
        const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
        return matchType && matchSearch;
    });

    return (
        <div className="space-y-4 animate-in">
            {/* KPI */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-600 text-white rounded-xl p-4">
                    <p className="text-emerald-200 text-xs font-semibold uppercase">Tổng Thu Tháng</p>
                    <p className="text-2xl font-black mt-1">{formatCurrency(getMonthIncome())}</p>
                </div>
                <div className="bg-red-500 text-white rounded-xl p-4">
                    <p className="text-red-200 text-xs font-semibold uppercase">Tổng Chi Tháng</p>
                    <p className="text-2xl font-black mt-1">{formatCurrency(getMonthExpense())}</p>
                </div>
                <div className="bg-indigo-600 text-white rounded-xl p-4">
                    <p className="text-indigo-200 text-xs font-semibold uppercase">Tồn Quỹ</p>
                    <p className="text-2xl font-black mt-1">{formatCurrency(getBalance())}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-2">
                    {[['all', 'Tất cả'], ['INCOME', 'Thu'], ['EXPENSE', 'Chi']].map(([val, label]) => (
                        <button key={val} onClick={() => setTypeFilter(val as any)} className={cn('px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors', typeFilter === val ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300')}>
                            {label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm giao dịch..." className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-white w-44" />
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">
                        <Plus className="w-4 h-4" /> Lập Phiếu
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Thời gian</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Loại</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nội dung</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Số tiền</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Phương thức</th>
                                <th className="px-4 py-3 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-10 text-slate-400">Chưa có giao dịch nào</td></tr>
                            ) : filtered.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50 group">
                                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">{formatDateTime(t.createdAt)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1', t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600')}>
                                            {t.type === 'INCOME' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                            {t.type === 'INCOME' ? 'THU' : 'CHI'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-800">{t.title}</td>
                                    <td className={cn('px-4 py-3 text-right font-bold font-mono', t.type === 'INCOME' ? 'text-emerald-600' : 'text-red-500')}>
                                        {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">{t.paymentMethod === 'CASH' ? '💵 Tiền mặt' : '🏦 Chuyển khoản'}</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => { if (confirm('Xóa giao dịch?')) deleteTransaction(t.id); }} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && <TxModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
}
