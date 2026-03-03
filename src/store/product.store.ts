import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Product, Category } from '@/types';

// ===================== SEED DATA =====================
const SEED_CATEGORIES: Category[] = [
    { id: 'cat-1', name: 'Laptop', color: '#4F46E5' },
    { id: 'cat-2', name: 'Máy In', color: '#0891b2' },
    { id: 'cat-3', name: 'Máy Photocopy', color: '#7c3aed' },
    { id: 'cat-4', name: 'Linh Kiện', color: '#b45309' },
    { id: 'cat-5', name: 'Phụ Kiện', color: '#16a34a' },
    { id: 'cat-6', name: 'Máy Tính Bàn', color: '#dc2626' },
];

const SEED_PRODUCTS: Product[] = [
    {
        id: 'p-1', sku: 'LAP-DELL-XPS13-9315', name: 'Laptop Dell XPS 13 9315',
        description: 'Dòng laptop cao cấp mỏng nhẹ, vỏ nhôm nguyên khối bền bỉ.', categoryId: 'cat-1',
        specs: {
            'CPU': 'i7-1250U',
            'RAM': '16GB LPDDR5',
            'SSD': '512GB NVMe',
            'SCREEN': '13.4 inch FHD+ IPS'
        },
        inStock: 5, lowStockAlert: 3, importPrice: 24500000, retailPrice: 32500000,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
        id: 'p-2', sku: 'LAP-APPLE-AIRM2-8256', name: 'Laptop MacBook Air M2 2022',
        description: 'Thiết kế mới vuông vức, chip M2 cực mạnh và tiết kiệm điện.', categoryId: 'cat-1',
        specs: {
            'Chip': 'Apple M2 8-Core',
            'RAM': '8GB Unified Memory',
            'SSD': '256GB SSD',
            'SCREEN': '13.6 inch Liquid Retina'
        },
        inStock: 8, lowStockAlert: 5, importPrice: 22000000, retailPrice: 26900000,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
        id: 'p-6', sku: 'PC-TQHT-G1-3060', name: 'PC Gaming Trung Quân Hi-Tech G1',
        description: 'Máy bộ chuyên chơi game và đồ họa trung cấp.', categoryId: 'cat-6',
        specs: {
            'Main': 'B660M Gaming',
            'CPU': 'Core i5-12400F',
            'VGA': 'RTX 3060 12GB',
            'RAM': '16GB DDR4 3200'
        },
        inStock: 3, lowStockAlert: 1, importPrice: 15500000, retailPrice: 19800000,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
        id: 'p-3', sku: 'PRT-CANON-LBP2900', name: 'Máy in Canon LBP 2900',
        description: 'Huyền thoại máy in văn phòng, bền bỉ, dễ nạp mực.', categoryId: 'cat-2',
        specs: {
            'Speed': '12 ppm',
            'Resolution': '2400 x 600 dpi',
            'Memory': '2MB',
            'Paper': '150 sheets'
        },
        inStock: 15, lowStockAlert: 5, importPrice: 3200000, retailPrice: 3950000,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
        id: 'p-5', sku: 'ACC-LOGI-MX3S', name: 'Chuột Logitech MX Master 3S',
        description: 'Chuột không dây cao cấp nhất cho công việc văn phòng.', categoryId: 'cat-5',
        specs: {
            'Sensor': 'Darkfield 8000 DPI',
            'Buttons': '7 buttons',
            'Battery': '70 days',
            'Connect': 'Logi Bolt / Bluetooth'
        },
        inStock: 12, lowStockAlert: 3, importPrice: 1850000, retailPrice: 2450000,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
];

// ===================== STORE =====================
interface ProductState {
    products: Product[];
    categories: Category[];
    addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
    updateProduct: (id: string, updates: Partial<Product>) => void;
    deleteProduct: (id: string) => void;
    updateStock: (id: string, delta: number) => void; // +/- tồn kho
    addCategory: (name: string, color?: string) => Category;
    updateCategory: (id: string, updates: Partial<Category>) => void;
    deleteCategory: (id: string) => void;
    getProductById: (id: string) => Product | undefined;
    getLowStockProducts: () => Product[];
    reset: () => void;
}

export const useProductStore = create<ProductState>()(
    persist(
        (set, get) => ({
            products: SEED_PRODUCTS,
            categories: SEED_CATEGORIES,

            addProduct: (data) => {
                const now = new Date().toISOString();
                const product: Product = { ...data, id: uuidv4(), createdAt: now, updatedAt: now };
                set((s) => ({ products: [product, ...s.products] }));
                return product;
            },

            updateProduct: (id, updates) =>
                set((s) => ({
                    products: s.products.map((p) =>
                        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
                    ),
                })),

            deleteProduct: (id) =>
                set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

            updateStock: (id, delta) =>
                set((s) => ({
                    products: s.products.map((p) =>
                        p.id === id ? { ...p, inStock: Math.max(0, p.inStock + delta), updatedAt: new Date().toISOString() } : p
                    ),
                })),

            addCategory: (name, color) => {
                const cat: Category = { id: uuidv4(), name, color };
                set((s) => ({ categories: [...s.categories, cat] }));
                return cat;
            },

            updateCategory: (id, updates) =>
                set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),

            deleteCategory: (id) =>
                set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

            getProductById: (id) => get().products.find((p) => p.id === id),

            getLowStockProducts: () => get().products.filter((p) => p.inStock <= p.lowStockAlert),

            reset: () => set({ products: [], categories: SEED_CATEGORIES }),
        }),
        { name: 'smartshop-products' }
    )
);
