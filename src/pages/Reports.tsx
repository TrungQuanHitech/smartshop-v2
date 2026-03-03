import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';
import { useSaleStore } from '@/store/sale.store';
import { useProductStore } from '@/store/product.store';
import { useCashFlowStore } from '@/store/sale.store';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#4F46E5', '#0891b2', '#16a34a', '#d97706', '#dc2626', '#8b5cf6'];

export default function Reports() {
    const orders = useSaleStore((s) => s.orders);
    const products = useProductStore((s) => s.products);
    const categories = useProductStore((s) => s.categories);
    const transactions = useCashFlowStore((s) => s.transactions);
    const getBalance = useCashFlowStore((s) => s.getBalance);

    const completedOrders = orders.filter((o) => o.status === 'COMPLETED');

    // Revenue by category
    const revenueByCategory = useMemo(() => {
        const map: Record<string, number> = {};
        completedOrders.forEach((o) => {
            o.items.forEach((item) => {
                const p = products.find((p) => p.id === item.productId);
                const catName = categories.find((c) => c.id === p?.categoryId)?.name || 'Khác';
                map[catName] = (map[catName] || 0) + item.subtotal;
            });
        });
        return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [orders, products, categories]);

    // Monthly revenue last 6 months
    const monthlyRevenue = useMemo(() => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const m = d.getMonth(); const y = d.getFullYear();
            const monthOrders = completedOrders.filter((o) => { const od = new Date(o.createdAt); return od.getMonth() === m && od.getFullYear() === y; });
            const rev = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
            const cost = monthOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => { const p = products.find((p) => p.id === i.productId); return s + (p?.importPrice || 0) * i.quantity; }, 0), 0);
            months.push({ month: `T${m + 1}/${y}`, revenue: Math.round(rev / 1_000_000), profit: Math.round((rev - cost) / 1_000_000) });
        }
        return months;
    }, [orders, products]);

    // Doanh thu gộp = Tổng tiền các đơn hàng (bao gồm cả nợ chưa thu)
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalDebt = completedOrders.reduce((sum, o) => sum + o.debtAmount, 0);
    const totalCogs = completedOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => { const p = products.find((p) => p.id === i.productId); return s + (p?.importPrice || 0) * i.quantity; }, 0), 0);
    const grossProfit = totalRevenue - totalCogs;

    // Chi phí vận hành (không tính chi từ nhập hàng, chỉ tính chi tiêu vận hành thực tế)
    const operatingExpense = transactions
        .filter(t => t.type === 'EXPENSE' && t.category !== 'PURCHASE')
        .reduce((sum, t) => sum + t.amount, 0);
    const netProfit = grossProfit - operatingExpense;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return (
        <div className="space-y-6 animate-in">
            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng Doanh Thu', value: formatCurrency(totalRevenue), color: 'text-indigo-700', sub: `Thu được: ${formatCurrency(totalRevenue - totalDebt)}` },
                    { label: 'Lợi Nhuận Gộp', value: formatCurrency(grossProfit), color: 'text-emerald-700', sub: `COGS: ${formatCurrency(totalCogs)}` },
                    { label: 'Lợi Nhuận Ròng', value: formatCurrency(netProfit), color: netProfit >= 0 ? 'text-violet-700' : 'text-red-600', sub: `Biên LN: ${profitMargin.toFixed(1)}%` },
                    { label: 'Tồn Quỹ', value: formatCurrency(getBalance()), color: 'text-blue-700', sub: `Phải thu: ${formatCurrency(totalDebt)}` },
                ].map((kpi) => (
                    <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase">{kpi.label}</p>
                        <p className={`text-xl font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
                        {kpi.sub && <p className="text-xs text-slate-400 mt-0.5">{kpi.sub}</p>}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Monthly Revenue Bar Chart */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <h3 className="font-bold text-slate-800 mb-4">Doanh Thu & Lợi Nhuận 6 Tháng (Triệu VNĐ)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={monthlyRevenue}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <Tooltip formatter={(v, n) => [`${v}M`, n === 'revenue' ? 'Doanh thu' : 'Lợi nhuận']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                            <Legend formatter={(v) => v === 'revenue' ? 'Doanh thu' : 'Lợi nhuận'} />
                            <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="profit" fill="#16a34a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Revenue by Category Pie */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <h3 className="font-bold text-slate-800 mb-4">Doanh Thu Theo Danh Mục</h3>
                    {revenueByCategory.length === 0 ? (
                        <div className="flex items-center justify-center h-[250px] text-slate-400 text-sm">Chưa có dữ liệu bán hàng</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={revenueByCategory} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                                    {revenueByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(v) => formatCurrency(v as number)} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}
