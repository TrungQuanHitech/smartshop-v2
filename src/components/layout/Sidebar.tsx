import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, ShoppingCart, Package, Truck, Users,
    Wallet, Wrench, FileText, BarChart3, Settings, LogOut,
    ChevronRight, Store, Building2
} from 'lucide-react';
import { useSettingsStore } from '@/store/settings.store';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { label: 'Tổng Quan', href: '/', icon: LayoutDashboard },
    { label: 'Bán Hàng (POS)', href: '/pos', icon: ShoppingCart },
    { label: 'Kho Hàng', href: '/inventory', icon: Package },
    { label: 'Nhập Hàng', href: '/purchases', icon: Truck },
    { label: 'Khách / NCC', href: '/partners', icon: Users },
    { label: 'Sổ Quỹ', href: '/cashflow', icon: Wallet },
];

const SERVICE_ITEMS = [
    { label: 'Phiếu Sửa Chữa', href: '/service/repair', icon: Wrench },
    { label: 'Cho Thuê Máy', href: '/service/rental', icon: FileText },
];

const BOTTOM_ITEMS = [
    { label: 'Báo Cáo', href: '/reports', icon: BarChart3 },
    { label: 'Cài Đặt', href: '/settings', icon: Settings },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const settings = useSettingsStore((s) => s.settings);

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        cn(
            'flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all text-[0.85rem]',
            isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        );

    return (
        <>
            {/* Overlay mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 w-56 bg-slate-900 text-white flex flex-col z-50 transition-transform duration-200 ease-out shadow-2xl no-print',
                    'lg:static lg:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Logo */}
                <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg">S</div>
                    <h1 className="font-bold text-sm tracking-tight uppercase truncate">SmartShop ERP</h1>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
                    {/* Main */}
                    {NAV_ITEMS.map((item) => (
                        <NavLink key={item.href} to={item.href} end={item.href === '/'} className={navLinkClass} onClick={onClose}>
                            <item.icon className="w-4.5 h-4.5 shrink-0" />
                            <span className="font-semibold truncate uppercase tracking-tighter">{item.label}</span>
                        </NavLink>
                    ))}

                    {/* Dịch Vụ */}
                    <div className="px-5 pt-4 pb-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Dịch Vụ</span>
                    </div>
                    {SERVICE_ITEMS.map((item) => (
                        <NavLink key={item.href} to={item.href} className={navLinkClass} onClick={onClose}>
                            <item.icon className="w-4.5 h-4.5 shrink-0" />
                            <span className="font-semibold truncate uppercase tracking-tighter">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom */}
                <div className="border-t border-slate-800 py-3 space-y-0.5">
                    {BOTTOM_ITEMS.map((item) => (
                        <NavLink key={item.href} to={item.href} className={navLinkClass} onClick={onClose}>
                            <item.icon className="w-4.5 h-4.5 shrink-0" />
                            <span className="font-semibold truncate uppercase tracking-tighter">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </aside>
        </>
    );
}
