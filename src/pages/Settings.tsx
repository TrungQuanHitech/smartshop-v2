import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, RefreshCw, CheckCircle2, LogOut, ExternalLink, Database, Cloud, AlertCircle, Loader2 } from 'lucide-react';
import { useSettingsStore } from '@/store/settings.store';
import { useGoogleStore } from '@/store/google.store';
import { useProductStore } from '@/store/product.store';
import { usePartnerStore } from '@/store/partner.store';
import { useSaleStore, useCashFlowStore } from '@/store/sale.store';
import { useServiceStore } from '@/store/service.store';
import { useGoogleAuth, useGoogleSheets } from '@/hooks/useGoogleSheets';
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

// =================== GOOGLE SYNC PANEL ===================
function GoogleSyncPanel() {
    const { signIn, signOut, user } = useGoogleAuth();
    const { syncAll, isSyncing, lastSyncAt } = useGoogleSheets();
    const { syncLog } = useGoogleStore();
    const { settings, updateSettings } = useSettingsStore();
    const [newSheetId, setNewSheetId] = useState(settings.googleSheetId || '');
    const [clientId, setClientId] = useState(settings.googleClientId || '');
    const [syncedSheetId, setSyncedSheetId] = useState<string | null>(null);

    const handleSaveClientId = () => {
        updateSettings({ googleClientId: clientId.trim() });
    };

    const handleSync = async () => {
        const result = await syncAll(newSheetId || undefined);
        if (result) {
            setSyncedSheetId(result);
            setNewSheetId(result);
            updateSettings({ googleSheetId: result });
        }
    };

    const hasClientId = !!settings.googleClientId?.trim();

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-blue-600" />
                    Google Sheets Sync
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Đồng bộ toàn bộ dữ liệu ERP lên Google Sheets với 8 tab chuyên nghiệp</p>
            </div>

            <div className="p-5 space-y-5">
                {/* Step 0: Google Client ID */}
                <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full ${hasClientId ? 'bg-emerald-500' : 'bg-blue-600'} text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5`}>
                        {hasClientId ? '✓' : '1'}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-700 mb-1">Nhập Google Client ID</p>
                        <p className="text-xs text-slate-400 mb-2">
                            Tạo miễn phí tại: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">console.cloud.google.com <ExternalLink className="w-3 h-3" /></a>
                        </p>
                        <div className="flex gap-2">
                            <input
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                placeholder="xxxxxx.apps.googleusercontent.com"
                                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 font-mono"
                            />
                            <button
                                onClick={handleSaveClientId}
                                disabled={!clientId.trim()}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                                Lưu
                            </button>
                        </div>
                        {hasClientId && (
                            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Client ID đã được lưu
                            </p>
                        )}
                        <details className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
                            <summary className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100">
                                📖 Hướng dẫn lấy Google Client ID (miễn phí, 5 phút)
                            </summary>
                            <div className="px-3 py-2.5 text-xs text-slate-600 space-y-1.5 bg-white">
                                <p><strong>1.</strong> Truy cập <a href="https://console.cloud.google.com" target="_blank" className="text-blue-600 hover:underline">console.cloud.google.com</a> → Tạo Project mới</p>
                                <p><strong>2.</strong> Vào <strong>APIs & Services → Library</strong> → Bật <strong>Google Sheets API</strong> và <strong>Google Drive API</strong></p>
                                <p><strong>3.</strong> Vào <strong>APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID</strong></p>
                                <p><strong>4.</strong> Application type: <strong>Web application</strong></p>
                                <p><strong>5.</strong> Authorized JavaScript origins: thêm <code className="bg-slate-100 px-1 rounded">http://localhost:3001</code></p>
                                <p><strong>6.</strong> Copy Client ID và dán vào ô trên → nhấn Lưu</p>
                            </div>
                        </details>
                    </div>
                </div>

                {/* Step 2: Google Login */}
                <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full ${user ? 'bg-emerald-500' : hasClientId ? 'bg-blue-600' : 'bg-slate-300'} text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5`}>
                        {user ? '✓' : '2'}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-700 mb-2">Đăng nhập Tài khoản Google</p>
                        {user ? (
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                </div>
                                <button onClick={signOut} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                                    <LogOut className="w-3.5 h-3.5" /> Đăng xuất
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={signIn}
                                disabled={!hasClientId}
                                className="flex items-center gap-3 px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-semibold text-slate-700 shadow-sm"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                {hasClientId ? 'Đăng nhập với Google' : 'Nhập Client ID ở bước 1 trước'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Step 3: Sheet ID */}
                <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full ${user ? 'bg-blue-600' : 'bg-slate-300'} text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5`}>3</div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-700 mb-2">Google Spreadsheet <span className="text-slate-400 font-normal text-xs">(Tùy chọn)</span></p>
                        <input
                            value={newSheetId}
                            onChange={(e) => setNewSheetId(e.target.value)}
                            placeholder="Để trống → tự động tạo Spreadsheet mới"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 bg-white font-mono"
                            disabled={!user}
                        />
                        <p className="text-xs text-slate-400 mt-1">Để trống để hệ thống tự tạo file Google Sheets mới với 8 tab màu chuyên nghiệp</p>
                    </div>
                </div>

                {/* Step 4: Sync */}
                <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full ${user ? 'bg-blue-600' : 'bg-slate-300'} text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5`}>4</div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-700 mb-2">Đồng bộ Dữ liệu</p>
                        <button
                            onClick={handleSync}
                            disabled={!user || isSyncing}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
                        >
                            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            {isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ Toàn bộ Dữ liệu'}
                        </button>
                        {lastSyncAt && (
                            <p className="text-xs text-slate-400 mt-1.5">
                                ✅ Đồng bộ lần cuối: {new Date(lastSyncAt).toLocaleString('vi-VN')}
                            </p>
                        )}
                        {(syncedSheetId || settings.googleSheetId) && (
                            <a
                                href={`https://docs.google.com/spreadsheets/d/${syncedSheetId || settings.googleSheetId}/edit`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-600 hover:underline"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Mở Google Spreadsheet
                            </a>
                        )}
                    </div>
                </div>

                {/* Log Output */}
                {syncLog.length > 0 && (
                    <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs space-y-0.5 max-h-40 overflow-y-auto">
                        {syncLog.map((log, i) => (
                            <div key={i} className={`${log.includes('❌') ? 'text-red-400' : log.includes('✅') || log.includes('🎉') ? 'text-emerald-400' : 'text-slate-300'}`}>
                                {log}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// =================== MAIN SETTINGS PAGE ===================
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

            <Section title="💾 Sao lưu & Khôi phục Cấu hình" description="Lưu trữ cài đặt của bạn lên Google Sheets để sử dụng trên thiết bị khác">
                <div className="md:col-span-2 flex flex-wrap gap-3">
                    <button
                        onClick={() => {
                            const { loadSettingsFromSheet } = useGoogleSheets();
                            loadSettingsFromSheet();
                        }}
                        className="flex-1 py-3 bg-white border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <Database className="w-4 h-4 text-indigo-600" />
                        Khôi phục từ Google Sheets
                    </button>
                </div>
                <p className="md:col-span-2 text-xs text-slate-400 italic">
                    * Lưu ý: Khi nhấn "Đồng bộ Toàn bộ Dữ liệu" ở dưới, mọi cài đặt hiện tại sẽ được lưu vào tab ⚙️ SYSTEM của Google Sheets.
                </p>
            </Section>

            {/* Google Sync Panel - Standalone, full-width */}
            <GoogleSyncPanel />

            <Section title="⚠️ Vùng Nguy Hiểm (Danger Zone)" description="Các hành động không thể hoàn tác">
                <div className="md:col-span-2 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-red-800">Xóa Toàn bộ Dữ liệu Ứng dụng</p>
                        <p className="text-xs text-red-600 mt-0.5">Xóa sạch sản phẩm, đơn hàng, khách hàng, giao dịch... Cấu hình cài đặt vẫn được giữ lại.</p>
                    </div>
                    <button
                        onClick={() => {
                            if (window.confirm('CẢNH BÁO: Hành động này sẽ xóa tất cả dữ liệu (không bao gồm Cài đặt). Bạn có chắc chắn muốn tiếp tục?')) {
                                useProductStore.getState().reset();
                                usePartnerStore.getState().reset();
                                useSaleStore.getState().reset();
                                useCashFlowStore.getState().reset();
                                useServiceStore.getState().reset();
                                alert('Đã reset dữ liệu thành công!');
                                window.location.reload();
                            }
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm shadow-red-200"
                    >
                        <Database className="w-4 h-4" />
                        Xóa Ngay
                    </button>
                </div>
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
