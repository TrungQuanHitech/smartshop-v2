// Utility functions
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export const formatCurrency = (val: number): string =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

export const formatNumber = (val: number): string =>
    new Intl.NumberFormat('vi-VN').format(val);

export const formatDate = (dateStr: string, fmt = 'dd/MM/yyyy'): string => {
    try { return format(new Date(dateStr), fmt, { locale: vi }); }
    catch { return dateStr; }
};

export const formatDateTime = (dateStr: string): string => {
    try { return format(new Date(dateStr), 'HH:mm dd/MM/yyyy', { locale: vi }); }
    catch { return dateStr; }
};

export const formatRelative = (dateStr: string): string => {
    try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi }); }
    catch { return dateStr; }
};

export const cn = (...classes: (string | undefined | null | false)[]): string =>
    classes.filter(Boolean).join(' ');

export const generateVietQRUrl = (
    bankBin: string,
    accountNumber: string,
    accountName: string,
    amount: number,
    message: string
): string => {
    if (!bankBin || !accountNumber) return '';
    const params = new URLSearchParams({
        amount: String(amount),
        addInfo: message,
        accountName,
    });
    return `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact.png?${params}`;
};

export const sendTelegramMessage = async (
    botToken: string,
    chatId: string,
    message: string
): Promise<void> => {
    if (!botToken || !chatId) return;
    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
        });
    } catch { /* silent fail */ }
};

export const getRepairStatusLabel = (status: string): string => {
    const map: Record<string, string> = {
        RECEIVED: 'Đã tiếp nhận',
        DIAGNOSING: 'Đang chẩn đoán',
        REPAIRING: 'Đang sửa chữa',
        WAITING_PARTS: 'Chờ linh kiện',
        DONE: 'Hoàn thành',
        RETURNED: 'Đã trả máy',
        CANCELLED: 'Đã hủy',
    };
    return map[status] || status;
};

export const getRepairStatusColor = (status: string): string => {
    const map: Record<string, string> = {
        RECEIVED: 'bg-blue-100 text-blue-700',
        DIAGNOSING: 'bg-yellow-100 text-yellow-700',
        REPAIRING: 'bg-orange-100 text-orange-700',
        WAITING_PARTS: 'bg-red-100 text-red-700',
        DONE: 'bg-emerald-100 text-emerald-700',
        RETURNED: 'bg-slate-100 text-slate-600',
        CANCELLED: 'bg-gray-100 text-gray-500',
    };
    return map[status] || 'bg-slate-100 text-slate-600';
};
