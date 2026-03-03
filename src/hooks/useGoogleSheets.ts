// Hook: useGoogleSheets
// Xử lý toàn bộ logic đồng bộ dữ liệu SmartShop ERP <-> Google Sheets
// Sử dụng Google Apps Script Web App làm cầu nối (proxy)

import { useCallback } from 'react';
import { useGoogleStore } from '@/store/google.store';
import { useSettingsStore } from '@/store/settings.store';
import { useProductStore } from '@/store/product.store';
import { useSaleStore, useCashFlowStore } from '@/store/sale.store';
import { usePartnerStore } from '@/store/partner.store';
import { usePurchaseStore } from '@/store/purchase.store';
import { useServiceStore } from '@/store/service.store';
import { formatCurrency } from '@/lib/utils';

// --------------------------------
// Khởi tạo Google OAuth (sử dụng Google Identity Services)
// --------------------------------
declare global {
    interface Window {
        google: any;
        gapi: any;
    }
}

export function useGoogleAuth() {
    const { setUser, user } = useGoogleStore();
    const { settings } = useSettingsStore();

    const loadGIS = (): Promise<void> => {
        return new Promise((resolve) => {
            if (window.google?.accounts) { resolve(); return; }
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = () => resolve();
            document.head.appendChild(script);
        });
    };

    const signIn = useCallback(async () => {
        const clientId = settings.googleClientId?.trim();
        if (!clientId) {
            alert('⚠️ Vui lòng nhập Google Client ID trong phần Cài Đặt → Google Sheets Sync trước khi đăng nhập!');
            return;
        }
        try {
            await loadGIS();
            window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file profile email',
                callback: async (resp: any) => {
                    if (resp.error) { console.error(resp); alert('Đăng nhập thất bại: ' + resp.error); return; }
                    try {
                        // Lấy thông tin người dùng
                        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                            headers: { Authorization: `Bearer ${resp.access_token}` }
                        }).then(r => r.json());
                        setUser({
                            email: userInfo.email,
                            name: userInfo.name,
                            picture: userInfo.picture,
                            accessToken: resp.access_token,
                        });
                    } catch (e) {
                        console.error('Failed to get user info', e);
                    }
                }
            }).requestAccessToken();
        } catch (e: any) {
            alert('Lỗi tải Google Identity Services: ' + e?.message);
        }
    }, [settings.googleClientId, setUser]);

    const signOut = useCallback(() => {
        if (user?.accessToken && window.google?.accounts) {
            window.google.accounts.oauth2.revoke(user.accessToken);
        }
        setUser(null);
    }, [user, setUser]);

    return { signIn, signOut, user };
}


// --------------------------------
// Hook đồng bộ dữ liệu
// --------------------------------
export function useGoogleSheets() {
    const { user, isSyncing, setSyncing, setLastSync, addLog, clearLog, lastSyncAt } = useGoogleStore();
    const { settings } = useSettingsStore();

    // Stores
    const products = useProductStore((s) => s.products);
    const categories = useProductStore((s) => s.categories);
    const saleOrders = useSaleStore((s) => s.orders);
    const transactions = useCashFlowStore((s) => s.transactions);
    const partners = usePartnerStore((s) => s.partners);
    const purchaseOrders = usePurchaseStore((s) => s.orders);
    const repairTickets = useServiceStore((s) => s.repairTickets);
    const rentalContracts = useServiceStore((s) => s.rentalContracts);
    const counterLogs = useServiceStore((s) => s.counterLogs);

    // Hàm gọi Google Sheets API trực tiếp
    const sheetsRequest = useCallback(async (method: string, range: string, values?: any[][], spreadsheetId?: string) => {
        const id = spreadsheetId || settings.googleSheetId;
        if (!id || !user?.accessToken) throw new Error('Thiếu Sheet ID hoặc chưa đăng nhập Google');

        const url = method === 'clear'
            ? `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent(range)}:clear`
            : `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent(range)}`;

        const options: RequestInit = {
            method: method === 'clear' ? 'POST' : (values ? 'PUT' : 'GET'),
            headers: {
                'Authorization': `Bearer ${user.accessToken}`,
                'Content-Type': 'application/json',
            },
        };
        if (values) {
            options.body = JSON.stringify({ values, majorDimension: 'ROWS' });
        }

        const resp = await fetch(values
            ? `${url}?valueInputOption=USER_ENTERED`
            : url, options);
        if (!resp.ok) throw new Error(await resp.text());
        return resp.json();
    }, [user, settings.googleSheetId]);

    // Tạo Google Spreadsheet mới
    const createSpreadsheet = useCallback(async (): Promise<string> => {
        if (!user?.accessToken) throw new Error('Chưa đăng nhập Google');
        const companyName = settings.companyName || 'SmartShop ERP';
        const resp = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${user.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                properties: { title: `📊 ${companyName} - SmartShop ERP Data` },
                sheets: [
                    { properties: { title: '📊 DASHBOARD', sheetId: 0, index: 0, tabColor: { red: 0.31, green: 0.28, blue: 0.90 } } },
                    { properties: { title: '📦 PRODUCTS', sheetId: 1, index: 1, tabColor: { red: 0.09, green: 0.57, blue: 0.31 } } },
                    { properties: { title: '💰 SALES', sheetId: 2, index: 2, tabColor: { red: 0.18, green: 0.34, blue: 0.90 } } },
                    { properties: { title: '🛒 PURCHASES', sheetId: 3, index: 3, tabColor: { red: 0.95, green: 0.47, blue: 0.14 } } },
                    { properties: { title: '💸 CASHFLOW', sheetId: 4, index: 4, tabColor: { red: 0.22, green: 0.68, blue: 0.55 } } },
                    { properties: { title: '👥 CONTACTS', sheetId: 5, index: 5, tabColor: { red: 0.60, green: 0.20, blue: 0.80 } } },
                    { properties: { title: '🛠 SERVICES', sheetId: 6, index: 6, tabColor: { red: 0.87, green: 0.68, blue: 0.09 } } },
                    { properties: { title: '⚙️ SYSTEM', sheetId: 7, index: 7, tabColor: { red: 0.50, green: 0.50, blue: 0.50 } } },
                ]
            })
        });
        if (!resp.ok) throw new Error(await resp.text());
        const data = await resp.json();
        return data.spreadsheetId;
    }, [user, settings.companyName]);

    // ===== SYNC FUNCTIONS =====

    const syncProducts = useCallback(async (sheetId: string) => {
        addLog('📦 Đang đồng bộ Kho hàng...');
        const header = [['MÃ SP', 'TÊN SẢN PHẨM', 'DANH MỤC', 'SKU', 'GIÁ VỐN', 'GIÁ BÁN', 'TỒN KHO', 'GIÁ TRỊ TỒN', 'MÔ TẢ']];
        const rows = products.map(p => {
            const cat = categories.find(c => c.id === p.categoryId)?.name || '';
            return [p.id, p.name, cat, p.sku, p.importPrice, p.retailPrice, p.inStock, p.inStock * p.importPrice, p.description || ''];
        });
        await sheetsRequest('clear', "'📦 PRODUCTS'!A:Z", undefined, sheetId);
        await sheetsRequest('PUT', "'📦 PRODUCTS'!A1", [...header, ...rows], sheetId);
        addLog(`✅ Kho hàng: ${products.length} sản phẩm`);
    }, [products, categories, sheetsRequest, addLog]);

    const syncSales = useCallback(async (sheetId: string) => {
        addLog('💰 Đang đồng bộ Đơn hàng bán...');
        const header = [['MÃ ĐƠN', 'NGÀY', 'KHÁCH HÀNG', 'TẠM TÍNH', 'GIẢM GIÁ', 'VAT', 'TỔNG TIỀN', 'ĐÃ TRẢ', 'CÒN NỢ', 'THANH TOÁN', 'TRẠNG THÁI']];
        const rows = saleOrders.map(o => [
            o.orderNumber,
            new Date(o.createdAt).toLocaleDateString('vi-VN'),
            o.customerName || 'Khách vãng lai',
            o.subtotal, o.discountTotal, o.vatAmount,
            o.totalAmount, o.amountPaid, o.debtAmount,
            o.paymentMethod === 'CASH' ? 'Tiền mặt' : o.paymentMethod === 'TRANSFER' ? 'Chuyển khoản' : 'Ghi nợ',
            o.status === 'COMPLETED' ? 'Hoàn thành' : o.status === 'CANCELLED' ? 'Đã hủy' : 'Chờ xử lý'
        ]);
        await sheetsRequest('clear', "'💰 SALES'!A:Z", undefined, sheetId);
        await sheetsRequest('PUT', "'💰 SALES'!A1", [...header, ...rows], sheetId);
        addLog(`✅ Bán hàng: ${saleOrders.length} đơn`);
    }, [saleOrders, sheetsRequest, addLog]);

    const syncPurchases = useCallback(async (sheetId: string) => {
        addLog('🛒 Đang đồng bộ Nhập hàng...');
        const header = [['MÃ PHIẾU', 'NGÀY', 'NHÀ CUNG CẤP', 'TẠM TÍNH', 'VAT', 'TỔNG TIỀN', 'ĐÃ TRẢ', 'CÒN NỢ', 'THANH TOÁN', 'TRẠNG THÁI']];
        const rows = purchaseOrders.map(o => [
            o.orderNumber,
            new Date(o.createdAt).toLocaleDateString('vi-VN'),
            o.supplierName || 'Không rõ',
            o.subtotal, o.vatAmount, o.totalAmount, o.amountPaid, o.debtAmount,
            o.paymentMethod === 'CASH' ? 'Tiền mặt' : o.paymentMethod === 'TRANSFER' ? 'Chuyển khoản' : 'Ghi nợ',
            o.status === 'COMPLETED' ? 'Hoàn thành' : o.status === 'CANCELLED' ? 'Đã hủy' : 'Chờ xử lý'
        ]);
        await sheetsRequest('clear', "'🛒 PURCHASES'!A:Z", undefined, sheetId);
        await sheetsRequest('PUT', "'🛒 PURCHASES'!A1", [...header, ...rows], sheetId);
        addLog(`✅ Nhập hàng: ${purchaseOrders.length} phiếu`);
    }, [purchaseOrders, sheetsRequest, addLog]);

    const syncCashFlow = useCallback(async (sheetId: string) => {
        addLog('💸 Đang đồng bộ Sổ quỹ...');
        const header = [['NGÀY', 'LOẠI', 'TIÊU ĐỀ', 'DANH MỤC', 'SỐ TIỀN', 'HÌNH THỨC', 'SỐ DƯ LŨY KẾ']];
        let balance = 0;
        // Sắp xếp theo thời gian tăng dần để tính số dư lũy kế
        const sorted = [...transactions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const rows = sorted.map(t => {
            balance += t.type === 'INCOME' ? t.amount : -t.amount;
            return [
                new Date(t.createdAt).toLocaleDateString('vi-VN'),
                t.type === 'INCOME' ? 'THU' : 'CHI',
                t.title,
                t.category,
                t.amount,
                t.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản',
                balance
            ];
        });
        await sheetsRequest('clear', "'💸 CASHFLOW'!A:Z", undefined, sheetId);
        await sheetsRequest('PUT', "'💸 CASHFLOW'!A1", [...header, ...rows], sheetId);
        addLog(`✅ Sổ quỹ: ${transactions.length} giao dịch`);
    }, [transactions, sheetsRequest, addLog]);

    const syncContacts = useCallback(async (sheetId: string) => {
        addLog('👥 Đang đồng bộ Đối tác...');
        const header = [['MÃ', 'TÊN', 'LOẠI', 'SỐ ĐIỆN THOẠI', 'EMAIL', 'ĐỊA CHỈ', 'CÔNG NỢ']];
        const rows = partners.map(p => [
            p.id, p.name,
            p.type === 'CUSTOMER' ? 'Khách hàng' : 'Nhà cung cấp',
            p.phone || '', p.email || '', p.address || '',
            p.totalDebt
        ]);
        await sheetsRequest('clear', "'👥 CONTACTS'!A:Z", undefined, sheetId);
        await sheetsRequest('PUT', "'👥 CONTACTS'!A1", [...header, ...rows], sheetId);
        addLog(`✅ Đối tác: ${partners.length} liên hệ`);
    }, [partners, sheetsRequest, addLog]);

    const syncServices = useCallback(async (sheetId: string) => {
        addLog('🛠 Đang đồng bộ Dịch vụ...');
        const repairHeader = [['MÃ PHIẾU', 'KHÁCH HÀNG', 'ĐT', 'THIẾT BỊ', 'MÔ TẢ LỖI', 'CHI PHÍ DỰ KIẾN', 'CHI PHÍ THỰC TẾ', 'TRẠNG THÁI', 'NGÀY NHẬN']];
        const repairRows = repairTickets.map(t => [
            t.ticketNumber, t.customerName, t.customerPhone || '', t.deviceName, t.problemDescription,
            t.estimatedCost || 0, t.finalCost || 0,
            t.status === 'RETURNED' ? 'Đã trả máy' : t.status === 'DONE' ? 'Hoàn thành' : t.status === 'REPAIRING' ? 'Đang sửa' : 'Đã tiếp nhận',
            new Date(t.receivedAt).toLocaleDateString('vi-VN')
        ]);
        const rentalHeader = [[], ['HỢP ĐỒNG CHO THUÊ'], ['MÃ HĐ', 'KHÁCH HÀNG', 'MODEL MÁY', 'NGÀY THUÊ', 'PHÍ/THÁNG', 'COUNTER BW', 'COUNTER MÀU', 'TRẠNG THÁI']];
        const rentalRows = rentalContracts.map(c => [
            c.contractNumber, c.customerName, c.machineModel,
            new Date(c.startDate).toLocaleDateString('vi-VN'),
            c.monthlyFee, c.lastCounterMono, c.lastCounterColor,
            c.isActive ? 'Đang thuê' : 'Kết thúc'
        ]);
        await sheetsRequest('clear', "'🛠 SERVICES'!A:Z", undefined, sheetId);
        await sheetsRequest('PUT', "'🛠 SERVICES'!A1", [...repairHeader, ...repairRows, ...rentalHeader, ...rentalRows], sheetId);
        addLog(`✅ Dịch vụ: ${repairTickets.length} phiếu sửa, ${rentalContracts.length} hợp đồng thuê`);
    }, [repairTickets, rentalContracts, sheetsRequest, addLog]);

    const syncDashboard = useCallback(async (sheetId: string) => {
        addLog('📊 Đang tạo Dashboard...');
        const now = new Date();
        const todaySales = saleOrders.filter(o => o.status === 'COMPLETED' && new Date(o.createdAt).toDateString() === now.toDateString());
        const todayRevenue = todaySales.reduce((s, o) => s + o.amountPaid, 0);
        const totalRevenue = saleOrders.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + o.totalAmount, 0);
        const totalDebt = partners.filter(p => p.type === 'CUSTOMER').reduce((s, p) => s + p.totalDebt, 0);
        const totalOwed = partners.filter(p => p.type === 'SUPPLIER').reduce((s, p) => s + Math.abs(p.totalDebt), 0);
        const balance = transactions.reduce((s, t) => t.type === 'INCOME' ? s + t.amount : s - t.amount, 0);
        const lowStockList = products.filter(p => p.inStock <= 5).sort((a, b) => a.inStock - b.inStock).slice(0, 5);
        const topDebtors = partners.filter(p => p.type === 'CUSTOMER' && p.totalDebt > 0).sort((a, b) => b.totalDebt - a.totalDebt).slice(0, 5);

        const dashboardData = [
            ['📊 SMARTSHOP ERP - DASHBOARD', '', '', '', `Cập nhật: ${now.toLocaleString('vi-VN')}`],
            [],
            ['CHỈ SỐ CHÍNH', '', '', '', ''],
            ['Doanh thu hôm nay', todayRevenue, '', 'Tồn quỹ hiện tại', balance],
            ['Tổng doanh thu', totalRevenue, '', 'Phải thu KH', totalDebt],
            ['Số đơn hoàn tất', saleOrders.filter(o => o.status === 'COMPLETED').length, '', 'Phải trả NCC', totalOwed],
            [],
            ['⚠️ CẢNH BÁO TỒN KHO THẤP (≤5)', '', '', '💳 TOP KHÁCH HÀNG NỢ NHIỀU', ''],
            ['Tên sản phẩm', 'Tồn kho', '', 'Khách hàng', 'Số nợ'],
            ...Array.from({ length: 5 }, (_, i) => [
                lowStockList[i]?.name || '-',
                lowStockList[i]?.inStock ?? '',
                '',
                topDebtors[i]?.name || '-',
                topDebtors[i]?.totalDebt ?? ''
            ])
        ];
        await sheetsRequest('clear', "'📊 DASHBOARD'!A:Z", undefined, sheetId);
        await sheetsRequest('PUT', "'📊 DASHBOARD'!A1", dashboardData, sheetId);
        addLog('✅ Dashboard đã cập nhật');
    }, [saleOrders, products, partners, transactions, sheetsRequest, addLog]);

    const syncSystemSheet = useCallback(async (sheetId: string) => {
        const s = useSettingsStore.getState().settings;
        const catData = [
            ['⚙️ SYSTEM CONFIG - Danh mục & Cấu hình'],
            [],
            ['DANH MỤC SẢN PHẨM'],
            ['ID', 'TÊN DANH MỤC'],
            ...categories.map(c => [c.id, c.name]),
            [],
            ['CẤU HÌNH HỆ THỐNG'],
            ['KEY', 'VALUE', 'DESCRIPTION'],
            ['companyName', s.companyName, 'Tên công ty'],
            ['companyAddress', s.companyAddress, 'Địa chỉ'],
            ['companyPhone', s.companyPhone, 'Điện thoại'],
            ['companyEmail', s.companyEmail || '', 'Email'],
            ['bankName', s.bankName, 'Tên ngân hàng'],
            ['bankBin', s.bankBin, 'Mã ngân hàng (BIN)'],
            ['bankAccountNumber', s.bankAccountNumber, 'Số tài khoản'],
            ['bankAccountName', s.bankAccountName, 'Tên chủ tài khoản'],
            ['groqApiKey', s.groqApiKey, 'Groq API Key'],
            ['groqModel', s.groqModel, 'Groq Model'],
            ['telegramBotToken', s.telegramBotToken, 'Telegram Bot Token'],
            ['telegramChatId', s.telegramChatId, 'Telegram Chat ID'],
            ['vatPercent', s.vatPercent, 'VAT (%)'],
            ['googleClientId', s.googleClientId, 'Google Client ID'],
        ];
        await sheetsRequest('clear', "'⚙️ SYSTEM'!A:Z", undefined, sheetId);
        await sheetsRequest('PUT', "'⚙️ SYSTEM'!A1", catData, sheetId);
    }, [categories, sheetsRequest]);

    const loadSettingsFromSheet = useCallback(async () => {
        if (!user || !settings.googleSheetId) return;
        setSyncing(true);
        addLog('📥 Đang tải cài đặt từ Google Sheets...');
        try {
            const data = await sheetsRequest('GET', "'⚙️ SYSTEM'!A8:B30");
            if (data.values) {
                const updates: any = {};
                data.values.forEach((row: string[]) => {
                    const [key, val] = row;
                    if (key && val !== undefined) {
                        updates[key] = key === 'vatPercent' ? parseFloat(val) : val;
                    }
                });
                useSettingsStore.getState().updateSettings(updates);
                addLog('✅ Đã khôi phục cài đặt thành công!');
            }
        } catch (err: any) {
            addLog(`❌ Lỗi tải cài đặt: ${err.message}`);
        } finally {
            setSyncing(false);
        }
    }, [user, settings.googleSheetId, sheetsRequest, addLog, setSyncing]);

    // Hàm đồng bộ toàn bộ
    const syncAll = useCallback(async (targetSheetId?: string) => {
        if (isSyncing) return;
        setSyncing(true);
        clearLog();
        addLog(`🚀 Bắt đầu đồng bộ lúc ${new Date().toLocaleTimeString('vi-VN')}`);

        try {
            let sheetId = targetSheetId || settings.googleSheetId;

            // Tạo mới nếu chưa có
            if (!sheetId) {
                addLog('📝 Tạo Google Spreadsheet mới...');
                sheetId = await createSpreadsheet();
                useSettingsStore.getState().updateSettings({ googleSheetId: sheetId });
                addLog(`✅ Đã tạo Spreadsheet: ${sheetId}`);
            }

            await syncDashboard(sheetId);
            await syncProducts(sheetId);
            await syncSales(sheetId);
            await syncPurchases(sheetId);
            await syncCashFlow(sheetId);
            await syncContacts(sheetId);
            await syncServices(sheetId);
            await syncSystemSheet(sheetId);

            const timestamp = new Date().toISOString();
            setLastSync(timestamp);
            addLog(`🎉 Đồng bộ hoàn tất! Sheet ID: ${sheetId}`);

            return sheetId;
        } catch (err: any) {
            addLog(`❌ Lỗi: ${err?.message || 'Không xác định'}`);
            console.error('Sync error:', err);
        } finally {
            setSyncing(false);
        }
    }, [
        isSyncing, settings.googleSheetId, createSpreadsheet,
        syncDashboard, syncProducts, syncSales, syncPurchases,
        syncCashFlow, syncContacts, syncServices, syncSystemSheet,
        setSyncing, clearLog, addLog, setLastSync
    ]);

    return {
        syncAll,
        loadSettingsFromSheet,
        isSyncing,
        lastSyncAt,
    };
}
