import { useState } from 'react';
import { Plus, FileText, Calculator, Edit2 } from 'lucide-react';
import { useServiceStore } from '@/store/service.store';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { RentalContract } from '@/types';

function CounterModal({ contract, onClose }: { contract: RentalContract; onClose: () => void }) {
    const { addCounterLog, updateRentalContract } = useServiceStore();
    const [mono, setMono] = useState('');
    const [color, setColor] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    const counterMono = parseInt(mono) || 0;
    const counterColor = parseInt(color) || 0;
    const usedMono = Math.max(0, counterMono - (contract.lastCounterMono || 0));
    const usedColor = Math.max(0, counterColor - (contract.lastCounterColor || 0));
    const excessMono = Math.max(0, usedMono - contract.freePagesMono);
    const excessColor = Math.max(0, usedColor - contract.freePagesColor);
    const charge = contract.monthlyFee + excessMono * contract.pricePerPageMono + excessColor * contract.pricePerPageColor;

    const handleSave = () => {
        if (!mono) return;
        addCounterLog({ contractId: contract.id, date, counterMono, counterColor, usedMono, usedColor, excessMono, excessColor, chargeAmount: charge });
        updateRentalContract(contract.id, { lastCounterMono: counterMono, lastCounterColor: counterColor, lastCounterDate: date });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in" onClick={(e) => e.stopPropagation()}>
                <div className="p-5 border-b">
                    <h2 className="font-bold text-slate-800">Chốt Counter - {contract.machineModel}</h2>
                    <p className="text-xs text-slate-500 mt-1">{contract.customerName}</p>
                </div>
                <div className="p-5 space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Ngày chốt</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Counter Đen/Trắng hiện tại</label>
                        <input type="number" value={mono} onChange={(e) => setMono(e.target.value)} placeholder={`Trước: ${contract.lastCounterMono}`} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Counter Màu hiện tại</label>
                        <input type="number" value={color} onChange={(e) => setColor(e.target.value)} placeholder={`Trước: ${contract.lastCounterColor}`} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" />
                    </div>
                    {mono && (
                        <div className="bg-indigo-50 rounded-xl p-3 text-sm space-y-1.5 border border-indigo-100">
                            <div className="flex justify-between"><span className="text-slate-500">Đã in (Đen/Trắng):</span><span className="font-semibold">{usedMono.toLocaleString()} trang</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Vượt định mức B/W:</span><span className={cn('font-semibold', excessMono > 0 ? 'text-red-500' : 'text-emerald-600')}>{excessMono.toLocaleString()} trang</span></div>
                            {excessColor > 0 && <div className="flex justify-between"><span className="text-slate-500">Vượt định mức Màu:</span><span className="font-semibold text-red-500">{excessColor.toLocaleString()} trang</span></div>}
                            <div className="pt-1.5 border-t flex justify-between text-base font-black"><span>Thành Tiền:</span><span className="text-indigo-700">{formatCurrency(charge)}</span></div>
                        </div>
                    )}
                </div>
                <div className="p-5 pt-0 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold">Hủy</button>
                    <button onClick={handleSave} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold">Lưu & Tính Tiền</button>
                </div>
            </div>
        </div>
    );
}

function ContractModal({ onClose }: { onClose: () => void }) {
    const { addRentalContract } = useServiceStore();
    const [form, setForm] = useState({
        customerName: '', customerPhone: '', machineModel: '', machineSerial: '',
        startDate: new Date().toISOString().slice(0, 10),
        monthlyFee: 0, freePagesMono: 1000, freePagesColor: 0,
        pricePerPageMono: 300, pricePerPageColor: 1000,
        lastCounterMono: 0, lastCounterColor: 0, isActive: true, notes: '',
    });

    const handleSubmit = () => {
        if (!form.customerName || !form.machineModel) return;
        addRentalContract(form);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in" onClick={(e) => e.stopPropagation()}>
                <div className="p-5 border-b sticky top-0 bg-white"><h2 className="font-bold text-lg text-slate-800">Tạo Hợp Đồng Cho Thuê Mới</h2></div>
                <div className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { key: 'customerName', label: 'Tên khách hàng *', placeholder: 'Họ và tên...' },
                            { key: 'customerPhone', label: 'Số điện thoại', placeholder: '09xxxxxxxx' },
                            { key: 'machineModel', label: 'Model máy *', placeholder: 'Canon iR2006N...' },
                            { key: 'machineSerial', label: 'Số Serial', placeholder: 'SN...' },
                            { key: 'monthlyFee', label: 'Phí thuê cố định (VNĐ/tháng)', placeholder: '0', type: 'number' },
                            { key: 'freePagesMono', label: 'Trang miễn phí B/W', placeholder: '1000', type: 'number' },
                            { key: 'freePagesColor', label: 'Trang miễn phí Màu', placeholder: '0', type: 'number' },
                            { key: 'pricePerPageMono', label: 'Giá/trang B/W vượt (VNĐ)', placeholder: '300', type: 'number' },
                            { key: 'pricePerPageColor', label: 'Giá/trang Màu vượt (VNĐ)', placeholder: '1000', type: 'number' },
                            { key: 'lastCounterMono', label: 'Counter B/W ban đầu', placeholder: '0', type: 'number' },
                        ].map(({ key, label, placeholder, type }) => (
                            <div key={key}>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
                                <input type={type || 'text'} value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: type === 'number' ? +e.target.value : e.target.value }))} placeholder={placeholder} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-5 pt-0 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold">Hủy</button>
                    <button onClick={handleSubmit} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold">Tạo Hợp Đồng</button>
                </div>
            </div>
        </div>
    );
}

export default function RentalService() {
    const contracts = useServiceStore((s) => s.rentalContracts);
    const counterLogs = useServiceStore((s) => s.counterLogs);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [counterModal, setCounterModal] = useState<RentalContract | null>(null);

    return (
        <div className="space-y-4 animate-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="font-bold text-slate-800">Hợp Đồng Cho Thuê Máy</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Quản lý thuê máy Photocopy/In - Theo dõi counter và tính tiền vượt định mức</p>
                </div>
                <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">
                    <Plus className="w-4 h-4" /> Thêm Hợp Đồng
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {contracts.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-slate-400 bg-white rounded-xl border">Chưa có hợp đồng nào</div>
                ) : contracts.map((c) => {
                    const logs = counterLogs.filter((l) => l.contractId === c.id);
                    return (
                        <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <span className="text-xs font-mono font-bold text-indigo-600">{c.contractNumber}</span>
                                    <div className="font-semibold text-slate-800">{c.machineModel}</div>
                                    <div className="text-xs text-slate-500">{c.machineSerial}</div>
                                </div>
                                <span className={cn('px-2 py-1 rounded-full text-[11px] font-semibold', c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                                    {c.isActive ? 'Đang thuê' : 'Kết thúc'}
                                </span>
                            </div>
                            <div className="text-sm text-slate-700 mb-1">👤 {c.customerName} • {c.customerPhone}</div>
                            <div className="text-xs text-slate-500 mb-3">Từ {formatDate(c.startDate)} • Phí: {formatCurrency(c.monthlyFee)}/tháng</div>
                            <div className="bg-slate-50 rounded-lg p-2.5 text-xs space-y-1 mb-3">
                                <div className="flex justify-between"><span className="text-slate-500">Counter B/W hiện tại:</span><span className="font-mono font-bold">{c.lastCounterMono.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Miễn phí B/W:</span><span>{c.freePagesMono.toLocaleString()} trang • {formatCurrency(c.pricePerPageMono)}/trang vượt</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Số lần chốt counter:</span><span className="font-semibold">{logs.length} lần</span></div>
                            </div>
                            <button onClick={() => setCounterModal(c)} className="w-full py-2 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-1.5">
                                <Calculator className="w-3.5 h-3.5" /> Chốt Counter & Tính Tiền
                            </button>
                        </div>
                    );
                })}
            </div>

            {isAddOpen && <ContractModal onClose={() => setIsAddOpen(false)} />}
            {counterModal && <CounterModal contract={counterModal} onClose={() => setCounterModal(null)} />}
        </div>
    );
}
