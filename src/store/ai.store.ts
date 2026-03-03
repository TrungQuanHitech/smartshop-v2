import { create } from 'zustand';
import { useSettingsStore } from './settings.store';
import { useProductStore } from './product.store';
import { useSaleStore, useCashFlowStore } from './sale.store';
import { usePartnerStore } from './partner.store';
import { usePurchaseStore } from './purchase.store';
import { formatCurrency } from '@/lib/utils';

export type AICMD =
    | { type: 'ADD_TO_CART'; productId: string | null; productName?: string; quantity: number; price?: number }
    | { type: 'SET_CUSTOMER'; customerId: string | null; customerName?: string }
    | { type: 'ADD_PURCHASE_ITEM'; productId: string | null; productName?: string; quantity: number; price: number }
    | { type: 'SET_SUPPLIER'; supplierId: string | null; supplierName?: string }
    | { type: 'ADD_TRANSACTION'; title: string; amount: number; transactionType: 'INCOME' | 'EXPENSE'; category: string }
    | { type: 'NAVIGATE'; path: string; query?: string }
    | { type: 'SHOW_REPORT'; reportType: string };

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface AIState {
    messages: Message[];
    isProcessing: boolean;
    lastCommand: AICMD | null;
    globalSearch: string;
    addMessage: (msg: Message) => void;
    clearHistory: () => void;
    setGlobalSearch: (search: string) => void;
    processMessage: (text: string) => Promise<void>;
    executeCommand: (cmd: AICMD) => void;
}

export const useAIStore = create<AIState>((set, get) => ({
    messages: [
        { role: 'system', content: 'Bạn là Trợ lý AI Toàn năng của SmartShop ERP. Nhiệm vụ của bạn là giúp người dùng quản lý cửa hàng: bán hàng, nhập hàng, thu chi và xem báo cáo. Hãy trả lời ngắn gọn và thực hiện hành động khi được yêu cầu.' }
    ],
    isProcessing: false,
    lastCommand: null,
    globalSearch: '',

    addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

    setGlobalSearch: (search) => set({ globalSearch: search }),

    clearHistory: () => set({
        messages: [{ role: 'system', content: 'Bạn là Trợ lý AI Toàn năng của SmartShop ERP. Nhiệm vụ của bạn là giúp người dùng quản lý cửa hàng: bán hàng, nhập hàng, thu chi và xem báo cáo. Hãy trả lời ngắn gọn và thực hiện hành động khi được yêu cầu.' }]
    }),

    processMessage: async (text) => {
        const { settings } = useSettingsStore.getState();

        // Lấy dữ liệu thực tế từ các Store
        const products = useProductStore.getState().products;
        const lowStock = useProductStore.getState().getLowStockProducts();
        const partners = usePartnerStore.getState().partners;
        const todayRevenue = useSaleStore.getState().getTodayRevenue();
        const totalDebt = useSaleStore.getState().getTotalDebt();
        const balance = useCashFlowStore.getState().getBalance();

        const stats = `
            DỮ LIỆU CỬA HÀNG THỰC TẾ (Sử dụng dữ liệu này để trả lời, TUYỆT ĐỐI KHÔNG TỰ BỊA):
            - Doanh thu hôm nay: ${formatCurrency(todayRevenue)}
            - Tổng tiền quỹ hiện tại: ${formatCurrency(balance)}
            - Tổng nợ khách hàng: ${formatCurrency(totalDebt)}
            - Sản phẩm sắp hết hàng: ${lowStock.map(p => `${p.name} (còn ${p.inStock})`).join(', ') || 'Không có'}
            
            DANH SÁCH SẢN PHẨM:
            ${products.slice(0, 20).map(p => `- [id: ${p.id}] ${p.name} (Giá: ${formatCurrency(p.retailPrice)}, Kho: ${p.inStock})`).join('\n')}
            
            DANH SÁCH ĐỐI TÁC:
            ${partners.slice(0, 20).map(p => `- [id: ${p.id}] ${p.name} (Loại: ${p.type}, Nợ: ${formatCurrency(p.totalDebt)})`).join('\n')}
        `;

        if (!settings.groqApiKey) {
            get().addMessage({ role: 'assistant', content: 'Vui lòng cấu hình Groq API Key trong phần Cài đặt để sử dụng trợ lý AI.' });
            return;
        }

        set({ isProcessing: true });
        const userMsg: Message = { role: 'user', content: text };
        set((s) => ({ messages: [...s.messages, userMsg] }));

        try {
            const prompt = `
                Dựa trên câu lệnh của người dùng: "${text}"
                
                THÔNG TIN HỆ THỐNG HIỆN TẠI (Sử dụng để đối chiếu và trả lời):
                ${stats}

                Nhiệm vụ:
                1. Nếu người dùng hỏi về tình hình kinh doanh, hãy trả lời chính xác dựa trên số liệu thực tế được cung cấp.
                2. Nếu người dùng yêu cầu hành động (bán hàng, nhập hàng...):
                   - Cố gắng tìm PRODUCT_ID và PARTNER_ID (Khách hàng cho Bán, NCC cho Nhập) khớp nhất.
                   - Đối với NHẬP HÀNG: Luôn yêu cầu thông tin Nhà Cung Cấp. Nếu người dùng không nói NCC, hãy chọn NCC khớp nhất hoặc hỏi lại. Tuy nhiên, để tự động hóa, hãy cố gắng suy luận từ ngữ cảnh.
                3. Nếu không tìm thấy ID chính xác, hãy trả về null cho ID và điền tên vào trường Name tương ứng.
                4. Phản hồi JSON DUY NHẤT.

                Cấu trúc JSON:
                {
                   "action": "ADD_TO_CART" | "SET_CUSTOMER" | "ADD_PURCHASE_ITEM" | "SET_SUPPLIER" | "ADD_TRANSACTION" | "NAVIGATE" | "SEARCH" | null,
                   "data": { ...params },
                   "response": "Câu trả lời ngắn gọn, xác nhận đã thực hiện hành động (VD: Đã nhập 2 RAM cho bạn từ NCC Viễn Sơn)"
                }

                Tham số action:
                - ADD_TO_CART: { productId, productName, quantity, price }
                - SET_CUSTOMER: { customerId, customerName }
                - ADD_PURCHASE_ITEM: { productId, productName, quantity, price } (Dùng cho nhập hàng)
                - ADD_TRANSACTION: { title, amount, transactionType: 'INCOME'|'EXPENSE', category }
                - NAVIGATE: { path: '/pos' | '/inventory' | '/purchases' | '/partners' | '/cashflow' | '/reports', query?: string }

                Lưu ý: Để Nhập hàng thành công, cần cả ADD_PURCHASE_ITEM và SET_SUPPLIER. Bạn có thể trả về action là ADD_PURCHASE_ITEM và trong response báo là đã chọn NCC.
                
                Ví dụ: "Nhập 10 chuột từ NCC Phong Vũ giá 150k" -> {"action": "ADD_PURCHASE_ITEM", "data": {"productId": "p-5", "quantity": 10, "price": 150000, "supplierId": "sup-1"}, "response": "Đã tạo phiếu nhập 10 Chuột Logitech từ Nhà cung cấp Phong Vũ với giá 150.000đ/cái."}
            `;

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${settings.groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: settings.groqModel,
                    messages: [
                        ...get().messages.slice(-5),
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.1
                })
            });

            const data = await response.json();
            const content = data.choices[0].message.content;

            try {
                const jsonMatch = content.match(/\{.*\}/s);
                if (jsonMatch) {
                    const actionData = JSON.parse(jsonMatch[0]);
                    const responseText = actionData.response || content;

                    if (actionData.action) {
                        set({ lastCommand: { type: actionData.action, ...actionData.data } });
                        if (actionData.action === 'SEARCH' || (actionData.action === 'NAVIGATE' && actionData.data?.query)) {
                            set({ globalSearch: actionData.data.query });
                        }
                    }
                    get().addMessage({ role: 'assistant', content: responseText });
                } else {
                    get().addMessage({ role: 'assistant', content });
                }
            } catch (e) {
                get().addMessage({ role: 'assistant', content });
            }

        } catch (error) {
            get().addMessage({ role: 'assistant', content: 'Có lỗi xảy ra khi kết nối với AI. Vui lòng kiểm tra lại kết nối hoặc API Key.' });
        } finally {
            set({ isProcessing: false });
        }
    },

    executeCommand: (cmd) => {
        set({ lastCommand: null });
    }
}));
