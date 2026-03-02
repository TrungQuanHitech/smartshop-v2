import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { TrendingUp, ShoppingCart, Package, AlertTriangle, Wallet, CreditCard, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { useSaleStore } from '@/store/sale.store';
import { useCashFlowStore } from '@/store/sale.store';
import { useProductStore } from '@/store/product.store';
import { usePartnerStore } from '@/store/partner.store';
import { formatCurrency, formatDateTime } from '@/lib/utils';

function KpiCard({ title, value, sub, icon: Icon, color, trend }: {
    title: string; value: string; sub?: string;
    icon: React.ElementType; color: string; trend?: 'up' | 'down' | 'neutral';
}) {
    return (
        <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
                    <p className="text-2xl font-black text-slate-800 mt-1 leading-tight">{value}</p>
                    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const orders = useSaleStore((s) => s.orders);
    const getTodayRevenue = useSaleStore((s) => s.getTodayRevenue);
    const getMonthRevenue = useSaleStore((s) => s.getMonthRevenue);
    const products = useProductStore((s) => s.products);
    const getLowStock = useProductStore((s) => s.getLowStockProducts);
    const getBalance = useCashFlowStore((s) => s.getBalance);
    const getMonthIncome = useCashFlowStore((s) => s.getMonthIncome);
    const getMonthExpense = useCashFlowStore((s) => s.getMonthExpense);
    const getDebtors = usePartnerStore((s) => s.getDebtors);

    const lowStock = getLowStock();
    const debtors = getDebtors();
    const totalCustomerDebt = debtors.reduce((sum, p) => sum + p.totalDebt, 0);

    // Doanh thu 7 ngày gần nhất
    const revenueChart = useMemo(() => {
        const days: { date: string; revenue: number; orders: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toDateString();
            const dayOrders = orders.filter(
                (o) => o.status === 'COMPLETED' && new Date(o.createdAt).toDateString() === dateStr
            );
            days.push({
                date: `${d.getDate()}/${d.getMonth() + 1}`,
                revenue: dayOrders.reduce((sum, o) => sum + o.amountPaid, 0) / 1_000_000,
                orders: dayOrders.length,
            });
        }
        return days;
    }, [orders]);

    // Top 5 sản phẩm bán chạy
    const topProducts = useMemo(() => {
        const map: Record<string, { name: string; qty: number }> = {};
        orders.filter((o) => o.status === 'COMPLETED').forEach((o) => {
            o.items.forEach((item) => {
                if (!map[item.productId]) map[item.productId] = { name: item.productName, qty: 0 };
                map[item.productId].qty += item.quantity;
            });
        });
        return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5);
    }, [orders]);

    const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    return (
        <div className="space-y-6 animate-in">
            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Doanh Thu Hôm Nay" value={formatCurrency(getTodayRevenue())} sub="Đã thanh toán" icon={TrendingUp} color="bg-indigo-100 text-indigo-600" />
                <KpiCard title="Doanh Thu Tháng" value={formatCurrency(getMonthRevenue())} sub={`${orders.filter(o => o.status === 'COMPLETED').length} đơn`} icon={ShoppingCart} color="bg-emerald-100 text-emerald-600" />
                <KpiCard title="Tồn Quỹ" value={formatCurrency(getBalance())} sub={`Thu: ${formatCurrency(getMonthIncome())} / Chi: ${formatCurrency(getMonthExpense())}`} icon={Wallet} color="bg-blue-100 text-blue-600" />
                <KpiCard title="Phải Thu KH" value={formatCurrency(totalCustomerDebt)} sub={`${debtors.length} khách đang nợ`} icon={CreditCard} color="bg-orange-100 text-orange-600" />
            </div>

            {/* Alert cảnh báo */}
            {lowStock.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <div className="flex-1">
                        <span className="text-sm font-semibold text-orange-700">{lowStock.length} sản phẩm sắp hết kho!</span>
                        <span className="text-xs text-orange-500 ml-2">{lowStock.slice(0, 3).map(p => p.name).join(', ')}{lowStock.length > 3 ? '...' : ''}</span>
                    </div>
                    <Link to="/inventory" className="text-xs text-orange-600 font-semibold hover:underline flex-shrink-0">Xem kho →</Link>
                </div>
            )}

            {/* Charts + Recent */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-slate-800">Doanh Thu 7 Ngày Gần Nhất</h3>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md">Triệu đồng</span>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={revenueChart}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                            <Tooltip
                                formatter={(v) => [`${v}M`, 'Doanh thu']}
                                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                            />
                            <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2.5} dot={{ r: 4, fill: '#4F46E5' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
                    <h3 className="font-bold text-slate-800 mb-4">Top Sản Phẩm Bán Chạy</h3>
                    {topProducts.length === 0 ? (
                        <div className="text-center text-slate-400 text-sm py-8">Chưa có dữ liệu bán hàng</div>
                    ) : (
                        <div className="space-y-3">
                            {topProducts.map((p, idx) => (
                                <div key={p.name} className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{idx + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-slate-800 truncate">{p.name}</div>
                                    </div>
                                    <span className="text-sm font-bold text-indigo-700">{p.qty} SP</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Đơn Hàng Gần Đây</h3>
                    <Link to="/pos" className="text-sm text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Tạo đơn mới
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Mã đơn</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Khách hàng</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tổng tiền</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Trạng thái</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Thời gian</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentOrders.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-slate-400">Chưa có đơn hàng nào</td></tr>
                            ) : (
                                recentOrders.map((o) => (
                                    <tr key={o.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-mono font-semibold text-indigo-600">{o.orderNumber}</td>
                                        <td className="px-4 py-3 text-slate-700">{o.customerName || 'Khách Vãng Lai'}</td>
                                        <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(o.totalAmount)}</td>
                                        <td className="px-4 py-3">
                                            {o.debtAmount > 0 ? (
                                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">Còn nợ {formatCurrency(o.debtAmount)}</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Đã thanh toán</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 text-xs">{formatDateTime(o.createdAt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Lập Đơn Bán', href: '/pos', icon: ShoppingCart, color: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
                    { label: 'Nhập Hàng', href: '/purchases', icon: Package, color: 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700' },
                    { label: 'Thu / Chi', href: '/cashflow', icon: Wallet, color: 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700' },
                    { label: 'Phiếu Sửa', href: '/service/repair', icon: ArrowUpRight, color: 'bg-white border border-slate-200 text-slate-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700' },
                ].map((a) => (
                    <Link key={a.href} to={a.href} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm ${a.color}`}>
                        <a.icon className="w-4 h-4" />
                        {a.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}
