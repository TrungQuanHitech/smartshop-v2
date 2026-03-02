import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, Package, AlertTriangle } from 'lucide-react';
import { useProductStore } from '@/store/product.store';
import { cn, formatDate } from '@/lib/utils';

const PAGE_TITLES: Record<string, string> = {
    '/': 'Tổng Quan',
    '/pos': 'Bán Hàng (POS)',
    '/inventory': 'Kho Hàng',
    '/purchases': 'Nhập Hàng',
    '/partners': 'Khách Hàng & NCC',
    '/cashflow': 'Sổ Quỹ',
    '/service/repair': 'Phiếu Sửa Chữa',
    '/service/rental': 'Hợp Đồng Cho Thuê',
    '/reports': 'Báo Cáo',
    '/settings': 'Cài Đặt Hệ Thống',
};

interface HeaderProps {
    onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
    const { pathname } = useLocation();
    const products = useProductStore((s) => s.products);
    const lowStockProducts = products.filter(p => p.inStock <= p.lowStockAlert);
    const [showAlerts, setShowAlerts] = useState(false);
    const pageTitle = PAGE_TITLES[pathname] || 'SmartShop ERP';
    const today = formatDate(new Date().toISOString(), 'EEEE, dd/MM/yyyy');

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 sticky top-0 z-20">
            <button
                onClick={onMenuToggle}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
                <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1">
                <h1 className="font-bold text-slate-800 text-lg leading-tight">{pageTitle}</h1>
                <p className="text-xs text-slate-400 capitalize">{today}</p>
            </div>

            {/* Alert bell */}
            <div className="relative">
                <button
                    className={cn(
                        'p-2 rounded-lg transition-colors relative',
                        lowStockProducts.length > 0
                            ? 'text-orange-500 hover:bg-orange-50'
                            : 'text-slate-400 hover:bg-slate-100'
                    )}
                    onClick={() => setShowAlerts(!showAlerts)}
                >
                    <Bell className="w-5 h-5" />
                    {lowStockProducts.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                </button>

                {showAlerts && lowStockProducts.length > 0 && (
                    <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in">
                        <div className="px-4 py-3 border-b bg-orange-50 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-semibold text-orange-700">
                                {lowStockProducts.length} sản phẩm sắp hết hàng
                            </span>
                        </div>
                        <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                            {lowStockProducts.map((p) => (
                                <div key={p.id} className="px-4 py-2.5 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                                        <Package className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-slate-800 truncate">{p.name}</div>
                                        <div className="text-xs text-slate-500">{p.sku}</div>
                                    </div>
                                    <span className="text-sm font-bold text-red-600">{p.inStock} còn</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                A
            </div>
        </header>
    );
}
