import { useState } from 'react';
import { Plus, Wrench, Search, Edit2 } from 'lucide-react';
import { useServiceStore } from '@/store/service.store';
import { usePartnerStore } from '@/store/partner.store';
import { useCashFlowStore } from '@/store/sale.store';
import { formatCurrency, formatDate, getRepairStatusLabel, getRepairStatusColor, cn } from '@/lib/utils';
import type { RepairStatus, RepairTicket } from '@/types';

const STATUSES: RepairStatus[] = ['RECEIVED', 'DIAGNOSING', 'REPAIRING', 'WAITING_PARTS', 'DONE', 'RETURNED', 'CANCELLED'];

function RepairModal({ ticket, onClose }: { ticket?: RepairTicket; onClose: () => void }) {
    const { addRepairTicket, updateRepairTicket } = useServiceStore();
    const customers = usePartnerStore((s) => s.getCustomers());
    const { addTransaction } = useCashFlowStore();
    const [form, setForm] = useState({
        customerId: ticket?.customerId || '',
        customerName: ticket?.customerName || '',
        customerPhone: ticket?.customerPhone || '',
        deviceName: ticket?.deviceName || '',
        deviceBrand: ticket?.deviceBrand || '',
        deviceSerial: ticket?.deviceSerial || '',
        problemDescription: ticket?.problemDescription || '',
        technicianNotes: ticket?.technicianNotes || '',
        estimatedCost: ticket?.estimatedCost || undefined as number | undefined,
        finalCost: ticket?.finalCost || undefined as number | undefined,
        status: ticket?.status || 'RECEIVED' as RepairStatus,
        receivedAt: ticket?.receivedAt || new Date().toISOString().slice(0, 16),
        estimatedReturnAt: ticket?.estimatedReturnAt || '',
    });

    const handleCustomerSelect = (id: string) => {
        const c = customers.find((c) => c.id === id);
        setForm((f) => ({ ...f, customerId: id, customerName: c?.name || '', customerPhone: c?.phone || '' }));
    };

    const handleSubmit = () => {
        if (!form.customerName || !form.deviceName || !form.problemDescription) return;
        const isReturning = ticket && form.status === 'RETURNED' && ticket.status !== 'RETURNED';

        if (ticket) updateRepairTicket(ticket.id, { ...form, returnedAt: form.status === 'RETURNED' ? new Date().toISOString() : ticket.returnedAt });
        else addRepairTicket({ ...form, receivedAt: form.receivedAt || new Date().toISOString() });

        // Liên kết Sổ quỹ: Khi trả máy có chi phí thực tế -> tạo giao dịch THU
        if (isReturning && form.finalCost && form.finalCost > 0) {
            const ticketNum = ticket?.ticketNumber || '';
            addTransaction({
                type: 'INCOME',
                amount: form.finalCost,
                title: `Thu tiền sửa chữa ${ticketNum} - ${form.customerName}`,
                category: 'SERVICE',
                paymentMethod: 'CASH',
                createdAt: new Date().toISOString(),
            });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in" onClick={(e) => e.stopPropagation()}>
                <div className="p-5 border-b sticky top-0 bg-white flex items-center justify-between">
                    <h2 className="font-bold text-lg text-slate-800">{ticket ? `Cập Nhật ${ticket.ticketNumber}` : 'Tạo Phiếu Sửa Chữa Mới'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <div className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Chọn Khách Hàng</label>
                            <select value={form.customerId} onChange={(e) => handleCustomerSelect(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400">
                                <option value="">— Khách mới/vãng lai —</option>
                                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Tên khách *</label>
                            <input value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" placeholder="Họ và tên..." />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Số điện thoại</label>
                            <input value={form.customerPhone} onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" placeholder="09xxxxxxxx" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Thiết bị *</label>
                            <input value={form.deviceName} onChange={(e) => setForm((f) => ({ ...f, deviceName: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" placeholder="Laptop Dell XPS 15..." />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Số Serial</label>
                            <input value={form.deviceSerial} onChange={(e) => setForm((f) => ({ ...f, deviceSerial: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 font-mono" placeholder="SN/IMEI..." />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Mô tả lỗi *</label>
                            <textarea value={form.problemDescription} onChange={(e) => setForm((f) => ({ ...f, problemDescription: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 resize-none" placeholder="Khách mô tả triệu chứng lỗi..." />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Ghi chú kỹ thuật</label>
                            <textarea value={form.technicianNotes} onChange={(e) => setForm((f) => ({ ...f, technicianNotes: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 resize-none" placeholder="Nhận định của kỹ thuật viên..." />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Chi phí dự kiến</label>
                            <input type="number" value={form.estimatedCost || ''} onChange={(e) => setForm((f) => ({ ...f, estimatedCost: +e.target.value || undefined }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Chi phí thực tế</label>
                            <input type="number" value={form.finalCost || ''} onChange={(e) => setForm((f) => ({ ...f, finalCost: +e.target.value || undefined }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" placeholder="0" />
                        </div>
                        {ticket && (
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Trạng thái</label>
                                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as RepairStatus }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400">
                                    {STATUSES.map((s) => <option key={s} value={s}>{getRepairStatusLabel(s)}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-5 pt-0 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold">Hủy</button>
                    <button onClick={handleSubmit} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold">{ticket ? 'Cập Nhật' : 'Tạo Phiếu'}</button>
                </div>
            </div>
        </div>
    );
}

export default function RepairService() {
    const tickets = useServiceStore((s) => s.repairTickets);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<RepairStatus | 'all'>('all');
    const [editingTicket, setEditingTicket] = useState<RepairTicket | undefined>();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filtered = tickets.filter((t) => {
        const matchStatus = statusFilter === 'all' || t.status === statusFilter;
        const matchSearch = !search || t.customerName.toLowerCase().includes(search.toLowerCase()) || t.deviceName.toLowerCase().includes(search.toLowerCase()) || t.ticketNumber.includes(search);
        return matchStatus && matchSearch;
    });

    return (
        <div className="space-y-4 animate-in">
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => setStatusFilter('all')} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors', statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600')}>Tất cả</button>
                    {['RECEIVED', 'REPAIRING', 'DONE', 'RETURNED'].map((s) => (
                        <button key={s} onClick={() => setStatusFilter(s as RepairStatus)} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors', statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600')}>
                            {getRepairStatusLabel(s)}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm phiếu sửa..." className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-white w-48" />
                    </div>
                    <button onClick={() => { setEditingTicket(undefined); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">
                        <Plus className="w-4 h-4" /> Tạo Phiếu
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-slate-400 bg-white rounded-xl border">Chưa có phiếu sửa chữa nào</div>
                ) : filtered.map((t) => (
                    <div key={t.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-indigo-200 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <span className="text-xs font-mono font-bold text-indigo-600">{t.ticketNumber}</span>
                                <div className="font-semibold text-slate-800 mt-0.5">{t.deviceName}</div>
                            </div>
                            <span className={cn('px-2 py-1 rounded-full text-[11px] font-semibold', getRepairStatusColor(t.status))}>{getRepairStatusLabel(t.status)}</span>
                        </div>
                        <div className="text-sm text-slate-600 mb-1">👤 {t.customerName}{t.customerPhone ? ` • ${t.customerPhone}` : ''}</div>
                        <div className="text-xs text-slate-400 line-clamp-2 mb-3">{t.problemDescription}</div>
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-slate-400">{formatDate(t.receivedAt)}</div>
                            {t.finalCost != null && <div className="font-bold text-indigo-700 text-sm">{formatCurrency(t.finalCost)}</div>}
                        </div>
                        <button onClick={() => { setEditingTicket(t); setIsModalOpen(true); }} className="mt-3 w-full py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1.5">
                            <Edit2 className="w-3 h-3" /> Cập Nhật Trạng Thái
                        </button>
                    </div>
                ))}
            </div>

            {isModalOpen && <RepairModal ticket={editingTicket} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
}
