import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Partner, PartnerType } from '@/types';

const SEED_PARTNERS: Partner[] = [
    {
        id: 'cus-1', name: 'Anh Tuấn - IT Cần Thơ', phone: '0901234567',
        email: 'tuan.it@gmail.com', address: '123 Nguyễn Trãi, Cần Thơ',
        type: 'CUSTOMER', totalDebt: 15000000,
        notes: 'Khách VIP, mua thường xuyên', createdAt: new Date().toISOString(),
    },
    {
        id: 'cus-2', name: 'Chị Mai - Kế Toán MISA', phone: '0987654321',
        type: 'CUSTOMER', totalDebt: 0, createdAt: new Date().toISOString(),
    },
    {
        id: 'cus-3', name: 'Công ty TNHH ABC Tech', phone: '02838320853',
        type: 'CUSTOMER', totalDebt: 5500000, createdAt: new Date().toISOString(),
    },
    {
        id: 'sup-1', name: 'Công ty Phong Vũ (Nha Trang)', phone: '18006867',
        email: 'nhatrang@phongvu.vn', type: 'SUPPLIER', totalDebt: -45000000,
        notes: 'Nhà cung cấp laptop và phụ kiện chính', createdAt: new Date().toISOString(),
    },
    {
        id: 'sup-2', name: 'Công ty TNHH Viễn Sơn', phone: '0915111222',
        type: 'SUPPLIER', totalDebt: -12500000, createdAt: new Date().toISOString(),
    },
];

interface PartnerState {
    partners: Partner[];
    addPartner: (data: Omit<Partner, 'id' | 'createdAt'>) => Partner;
    updatePartner: (id: string, updates: Partial<Partner>) => void;
    deletePartner: (id: string) => void;
    adjustDebt: (id: string, amount: number) => void; // +amount nếu khách trả / NCC nợ thêm
    getPartnerById: (id: string) => Partner | undefined;
    getCustomers: () => Partner[];
    getSuppliers: () => Partner[];
    getDebtors: () => Partner[]; // Khách nợ mình (totalDebt > 0)
    getCreditors: () => Partner[]; // Mình nợ NCC (totalDebt < 0)
}

export const usePartnerStore = create<PartnerState>()(
    persist(
        (set, get) => ({
            partners: SEED_PARTNERS,

            addPartner: (data) => {
                const partner: Partner = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
                set((s) => ({ partners: [partner, ...s.partners] }));
                return partner;
            },

            updatePartner: (id, updates) =>
                set((s) => ({
                    partners: s.partners.map((p) => (p.id === id ? { ...p, ...updates } : p)),
                })),

            deletePartner: (id) =>
                set((s) => ({ partners: s.partners.filter((p) => p.id !== id) })),

            adjustDebt: (id, amount) =>
                set((s) => ({
                    partners: s.partners.map((p) =>
                        p.id === id ? { ...p, totalDebt: p.totalDebt + amount } : p
                    ),
                })),

            getPartnerById: (id) => get().partners.find((p) => p.id === id),
            getCustomers: () => get().partners.filter((p) => p.type === 'CUSTOMER'),
            getSuppliers: () => get().partners.filter((p) => p.type === 'SUPPLIER'),
            getDebtors: () => get().partners.filter((p) => p.totalDebt > 0),
            getCreditors: () => get().partners.filter((p) => p.totalDebt < 0),
        }),
        { name: 'smartshop-partners' }
    )
);
