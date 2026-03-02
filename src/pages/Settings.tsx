import { useState } from 'react';
import { Save, Eye, EyeOff } from 'lucide-react';
import { useSettingsStore } from '@/store/settings.store';
import type { AppSettings } from '@/types';

interface FieldProps {
    label: string;
    value: string | number;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    secret?: boolean;
    hint?: string;
}

function Field({ label, value, onChange, placeholder, type = 'text', secret = false, hint }: FieldProps) {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
            <div className="relative">
                <input
                    type={secret && !show ? 'password' : type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 bg-white"
                />
                {secret && (
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
            </div>
            {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
        </div>
    );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-slate-50/50">
                <h3 className="font-bold text-slate-800">{title}</h3>
                {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
        </div>
    );
}

export default function Settings() {
    const { settings, updateSettings } = useSettingsStore();
    const [form, setForm] = useState<AppSettings>({ ...settings });
    const [saved, setSaved] = useState(false);

    const set = (key: keyof AppSettings) => (value: string | number) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleSave = () => {
        updateSettings(form);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-5 animate-in max-w-3xl mx-auto">
            <Section title="🏢 Thông Tin Doanh Nghiệp" description="Hiển thị trên hóa đơn và báo cáo">
                <div className="md:col-span-2"><Field label="Tên công ty" value={form.companyName} onChange={set('companyName')} /></div>
                <div className="md:col-span-2"><Field label="Địa chỉ" value={form.companyAddress} onChange={set('companyAddress')} /></div>
                <Field label="Số điện thoại" value={form.companyPhone} onChange={set('companyPhone')} placeholder="0xxxxxxxxx" />
                <Field label="Email" value={form.companyEmail || ''} onChange={set('companyEmail')} placeholder="email@company.vn" />
                <Field label="Thuế VAT mặc định (%)" value={form.vatPercent} onChange={(v) => set('vatPercent')(parseFloat(v) || 0)} type="number" />
            </Section>

            <Section title="📱 VietQR - Thanh Toán QR" description="Thiết lập để hiển thị QR chuyển khoản tự động trong POS">
                <Field label="Tên ngân hàng" value={form.bankName} onChange={set('bankName')} placeholder="Vietcombank, Techcombank..." />
                <Field label="Mã ngân hàng (BIN)" value={form.bankBin} onChange={set('bankBin')} placeholder="970436" hint="Tra mã BIN tại: vietqr.io/danh-sach-ngan-hang" />
                <Field label="Số tài khoản" value={form.bankAccountNumber} onChange={set('bankAccountNumber')} placeholder="1234567890" />
                <Field label="Tên chủ tài khoản" value={form.bankAccountName} onChange={set('bankAccountName')} placeholder="NGUYEN VAN A" />
            </Section>

            <Section title="🤖 Groq AI Assistant" description="Nhập API Key để bật tính năng trợ lý kinh doanh AI">
                <Field label="Groq API Key" value={form.groqApiKey} onChange={set('groqApiKey')} placeholder="gsk_..." secret hint="Lấy API Key miễn phí tại: console.groq.com" />
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Model Groq</label>
                    <select value={form.groqModel} onChange={(e) => set('groqModel')(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400">
                        <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Recommended)</option>
                        <option value="llama-3.1-8b-instant">Llama 3.1 8B (Fastest)</option>
                        <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                    </select>
                </div>
            </Section>

            <Section title="📲 Telegram Bot Notifications" description="Nhận thông báo đơn hàng và biến động số dư qua Telegram">
                <Field label="Bot Token" value={form.telegramBotToken} onChange={set('telegramBotToken')} placeholder="123456:ABC-DEF..." secret hint="Tạo bot qua @BotFather trên Telegram" />
                <Field label="Chat ID" value={form.telegramChatId} onChange={set('telegramChatId')} placeholder="-100xxxxxxxxxx" hint="Lấy Chat ID từ bot @userinfobot" />
            </Section>

            <Section title="📊 Google Sheets Sync" description="Đồng bộ dữ liệu 2 chiều với Google Sheets qua Apps Script">
                <Field label="Google Sheet ID" value={form.googleSheetId} onChange={set('googleSheetId')} placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" />
                <div className="md:col-span-2"><Field label="Google Apps Script Web App URL" value={form.googleAppsScriptUrl} onChange={set('googleAppsScriptUrl')} placeholder="https://script.google.com/macros/s/..." /></div>
            </Section>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-600/20"
                >
                    <Save className="w-4 h-4" />
                    {saved ? '✓ Đã lưu!' : 'Lưu Cài Đặt'}
                </button>
            </div>
        </div>
    );
}
