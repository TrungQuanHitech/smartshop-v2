import { useState, useMemo } from 'react';
import { Plus, Search, Package, Edit2, Trash2, AlertTriangle, ImageOff, ChevronDown, ChevronUp, Barcode, Printer } from 'lucide-react';
import { useProductStore } from '@/store/product.store';
import { formatCurrency, cn } from '@/lib/utils';
import type { Product } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

function ProductModal({ product, onClose }: { product?: Product; onClose: () => void }) {
    const categories = useProductStore((s) => s.categories);
    const addProduct = useProductStore((s) => s.addProduct);
    const updateProduct = useProductStore((s) => s.updateProduct);

    const [form, setForm] = useState({
        sku: product?.sku || '',
        name: product?.name || '',
        description: product?.description || '',
        categoryId: product?.categoryId || (categories[0]?.id || ''),
        inStock: product?.inStock ?? 0,
        lowStockAlert: product?.lowStockAlert ?? 5,
        importPrice: product?.importPrice ?? 0,
        retailPrice: product?.retailPrice ?? 0,
        imageBase64: product?.imageBase64 || '',
        specs: product?.specs || {},
    });

    // Temporary state for dynamic specs list (array form for easier editing)
    const [specList, setSpecList] = useState<{ key: string; value: string }[]>(
        Object.entries(form.specs).map(([key, value]) => ({ key, value }))
    );

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setForm((f) => ({ ...f, imageBase64: reader.result as string }));
        reader.readAsDataURL(file);
    };

    const addSpecRow = () => setSpecList([...specList, { key: '', value: '' }]);
    const removeSpecRow = (index: number) => setSpecList(specList.filter((_, i) => i !== index));
    const updateSpecRow = (index: number, field: 'key' | 'value', val: string) => {
        const newList = [...specList];
        newList[index][field] = val;
        setSpecList(newList);
    };

    const generateSKU = () => {
        const prefix = categories.find(c => c.id === form.categoryId)?.name.substring(0, 3).toUpperCase() || 'PRO';
        const random = Math.floor(1000 + Math.random() * 9000);
        setForm(f => ({ ...f, sku: `${prefix}-${random}` }));
    };

    const handleSubmit = () => {
        if (!form.name || !form.sku) return;

        // Convert specList back to object
        const finalSpecs: { [key: string]: string } = {};
        specList.forEach(item => {
            if (item.key.trim()) finalSpecs[item.key.trim()] = item.value;
        });

        const finalData = { ...form, specs: finalSpecs };
        if (product) updateProduct(product.id, finalData);
        else addProduct(finalData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-8 py-6 border-b flex items-center justify-between bg-white shrink-0">
                    <h2 className="font-extrabold text-xl text-slate-800 uppercase tracking-tight">
                        {product ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors">✕</button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                    <div className="flex gap-8">
                        {/* Left: Image Upload Section */}
                        <div className="w-48 shrink-0 space-y-4">
                            <div className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 relative group">
                                {form.imageBase64 ? (
                                    <img src={form.imageBase64} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <ImageOff className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Chưa có ảnh</p>
                                    </div>
                                )}
                                <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                    <span className="text-white text-[10px] font-black uppercase tracking-widest bg-slate-900/50 px-3 py-1.5 rounded-full">Thay đổi</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>
                            </div>

                            <div className="space-y-4 pt-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Mã SKU</label>
                                    <div className="relative">
                                        <input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="w-full px-4 py-2.5 text-xs font-mono font-bold bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-slate-700" placeholder="DELL-001" />
                                        <button onClick={generateSKU} className="absolute right-2 top-2 p-1 text-slate-300 hover:text-indigo-500 transition-colors" title="Tạo mã ngẫu nhiên">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Main Info Form */}
                        <div className="flex-1 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tên hàng hóa *</label>
                                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-4 py-3 text-sm font-bold bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-slate-800" placeholder="Ví dụ: Laptop Dell XPS 13 9315" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Phân loại</label>
                                    <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="w-full px-4 py-3 text-sm font-bold bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-slate-700">
                                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tồn kho</label>
                                    <input type="number" value={form.inStock} onChange={(e) => setForm((f) => ({ ...f, inStock: +e.target.value }))} className="w-full px-4 py-3 text-sm font-bold bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-slate-700" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Giá vốn (Nhập)</label>
                                    <input type="number" value={form.importPrice} onChange={(e) => setForm((f) => ({ ...f, importPrice: +e.target.value }))} className="w-full px-4 py-3 text-sm font-bold bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-mono" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Giá bán (Lẻ)</label>
                                    <input type="number" value={form.retailPrice} onChange={(e) => setForm((f) => ({ ...f, retailPrice: +e.target.value }))} className="w-full px-4 py-3 text-sm font-bold bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-indigo-700 font-mono" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Specs Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4 px-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông số kỹ thuật</label>
                            <button onClick={addSpecRow} className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors">
                                <Plus className="w-3.5 h-3.5" /> Thêm dòng
                            </button>
                        </div>
                        <div className="space-y-3">
                            {specList.map((spec, index) => (
                                <div key={index} className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                        <input
                                            value={spec.key}
                                            onChange={(e) => updateSpecRow(index, 'key', e.target.value)}
                                            className="px-4 py-2.5 text-xs font-bold bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-slate-500"
                                            placeholder="Tên (CPU, RAM...)"
                                        />
                                        <input
                                            value={spec.value}
                                            onChange={(e) => updateSpecRow(index, 'value', e.target.value)}
                                            className="px-4 py-2.5 text-xs font-bold bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                                            placeholder="Giá trị..."
                                        />
                                    </div>
                                    <button onClick={() => removeSpecRow(index)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                            {specList.length === 0 && (
                                <p className="text-center py-4 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black text-slate-300 uppercase tracking-widest">Chưa có thông số</p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Mô tả chi tiết</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-3 text-sm font-medium bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-slate-600 resize-none"
                            placeholder="Nhập mô tả sản phẩm..."
                        />
                    </div>
                </div>

                <div className="px-8 py-6 bg-slate-50 flex gap-4 shrink-0">
                    <button onClick={onClose} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm">Hủy bỏ</button>
                    <button onClick={handleSubmit} className="flex-1 py-4 bg-slate-900 hover:bg-black rounded-2xl text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-200">
                        Lưu sản phẩm
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

import BarcodeComponent from 'react-barcode';

function BarcodeModal({ product, onClose }: { product: Product; onClose: () => void }) {
    const [quantity, setQuantity] = useState(1);
    const [showPrice, setShowPrice] = useState(true);
    const [showName, setShowName] = useState(true);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const content = `
            <html>
                <head>
                    <title>In Mã Vạch - ${product.name}</title>
                    <style>
                        @page { size: auto; margin: 0; }
                        body { margin: 0; font-family: sans-serif; }
                        .print-container { 
                            display: grid; 
                            grid-template-columns: repeat(auto-fill, 40mm); 
                            gap: 5mm; 
                            padding: 5mm; 
                        }
                        .label {
                            width: 38mm;
                            height: 25mm;
                            padding: 1mm;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            text-align: center;
                            overflow: hidden;
                            box-sizing: border-box;
                        }
                        .name { font-size: 7pt; font-weight: bold; margin-bottom: 1px; height: 2.4em; overflow: hidden; line-height: 1.2; }
                        .price { font-size: 9pt; font-weight: 800; color: #000; margin-bottom: 1px; }
                        .barcode-wrapper { width: 100%; display: flex; justify-content: center; overflow: hidden; }
                        .barcode-wrapper svg { max-width: 100%; height: auto !important; }
                        .sku { font-size: 6pt; color: #666; margin-top: 1px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        ${Array(quantity).fill(0).map(() => `
                            <div class="label">
                                ${showName ? `<div class="name">${product.name}</div>` : ''}
                                ${showPrice ? `<div class="price">${formatCurrency(product.retailPrice)}</div>` : ''}
                                <div class="barcode-wrapper" id="barcode-${product.id}"></div>
                                <div class="sku">${product.sku}</div>
                            </div>
                        `).join('')}
                    </div>
                </body>
            </html>
        `;

        printWindow.document.write(content);

        // Render barcode using BarcodeComponent manually for the print window or just use SVG
        // A simpler way is to clone the SVG from the preview
        const barcodeSvg = document.getElementById('preview-barcode')?.querySelector('svg')?.outerHTML;
        if (barcodeSvg) {
            printWindow.document.body.querySelectorAll('[id^="barcode-"]').forEach(el => {
                el.innerHTML = barcodeSvg;
            });
        }

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-8 py-6 border-b flex items-center justify-between shrink-0">
                    <h2 className="font-extrabold text-xl text-slate-800 uppercase tracking-tight">In Mã Vạch Sản Phẩm</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400">✕</button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Preview Area */}
                    <div className="bg-slate-50 rounded-2xl p-8 flex items-center justify-center border-2 border-dashed border-slate-200">
                        <div className="w-48 bg-white p-4 shadow-xl rounded-xl border border-slate-100 flex flex-col items-center text-center">
                            {showName && <div className="text-[10px] font-bold text-slate-800 mb-1 line-clamp-2">{product.name}</div>}
                            {showPrice && <div className="text-sm font-black text-indigo-700 mb-2">{formatCurrency(product.retailPrice)}</div>}
                            <div className="w-full grayscale brightness-90 flex justify-center overflow-hidden" id="preview-barcode">
                                <BarcodeComponent
                                    value={product.sku}
                                    width={1.0}
                                    height={30}
                                    fontSize={10}
                                    margin={0}
                                    displayValue={false}
                                />
                            </div>
                            <div className="text-[8px] font-mono font-bold text-slate-400 mt-1 uppercase">{product.sku}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Số lượng tem cần in</label>
                            <input
                                type="number"
                                min={1}
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, +e.target.value))}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                        <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                            <input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-none bg-white shadow-sm" />
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Hiện tên SP</span>
                        </label>
                        <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                            <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-none bg-white shadow-sm" />
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Hiện giá bán</span>
                        </label>
                    </div>
                </div>

                <div className="px-8 py-6 bg-slate-50 flex gap-4 shrink-0">
                    <button onClick={onClose} className="flex-1 py-4 bg-white border border-slate-200 rounded-xl text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-50">Hủy bỏ</button>
                    <button onClick={handlePrint} className="flex-1 py-4 bg-slate-900 hover:bg-black rounded-xl text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-slate-200">
                        <Printer className="w-4 h-4" /> Bắt đầu in
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default function Inventory() {
    const products = useProductStore((s) => s.products);
    const categories = useProductStore((s) => s.categories);
    const deleteProduct = useProductStore((s) => s.deleteProduct);

    const [search, setSearch] = useState('');
    const [activeCat, setActiveCat] = useState('all');
    const [editingProduct, setEditingProduct] = useState<Product | undefined>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
    const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<Product | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filtered = useMemo(() => products.filter((p) => {
        const matchCat = activeCat === 'all' || p.categoryId === activeCat;
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    }), [products, search, activeCat]);

    const getCategory = (id: string) => categories.find((c) => c.id === id);

    return (
        <div className="space-y-4 animate-in">
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm theo SKU hoặc tên..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-white shadow-sm" />
                </div>
                <button
                    onClick={() => { setEditingProduct(undefined); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" /> THÊM MỚI
                </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {[{ id: 'all', name: 'Tất cả' }, ...categories].map((c) => (
                    <button key={c.id} onClick={() => setActiveCat(c.id)}
                        className={cn('px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border-2', activeCat === c.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200')}>
                        {c.name}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50/50 border-b">
                            <tr>
                                <th className="text-left px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ảnh</th>
                                <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sản phẩm</th>
                                <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phân loại</th>
                                <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mô tả</th>
                                <th className="text-center px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tồn</th>
                                <th className="text-right px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá vốn</th>
                                <th className="text-right px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá bán</th>
                                <th className="px-5 py-4 w-24"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-20 text-slate-400 font-medium">Không tìm thấy sản phẩm phù hợp</td></tr>
                            ) : filtered.map((p) => {
                                const isExpanded = expandedId === p.id;
                                const cat = getCategory(p.categoryId);
                                return (
                                    <React.Fragment key={p.id}>
                                        <tr onClick={() => setExpandedId(isExpanded ? null : p.id)} className={cn('group cursor-pointer transition-colors', isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50/80')}>
                                            <td className="px-5 py-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                                                    {p.imageBase64 ? <img src={p.imageBase64} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-slate-300" />}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-slate-800 leading-tight">{p.name}</div>
                                                <div className="text-[10px] font-mono text-slate-400 mt-0.5">{p.sku}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter" style={{ backgroundColor: (cat?.color || '#eee') + '15', color: cat?.color || '#666' }}>
                                                    {cat?.name || 'KHÁC'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-xs text-slate-500 italic truncate max-w-[200px]">{p.description || 'Chưa có mô tả'}</div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className={cn('text-sm font-black', p.inStock <= p.lowStockAlert ? 'text-orange-600' : 'text-slate-700')}>{p.inStock}</div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="text-xs text-slate-400 font-medium">{formatCurrency(p.importPrice)}</div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="text-sm font-black text-indigo-700">{formatCurrency(p.retailPrice)}</div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={(e) => { e.stopPropagation(); setSelectedBarcodeProduct(p); setIsBarcodeModalOpen(true); }} className="p-1.5 text-slate-300 hover:text-indigo-600 rounded-lg" title="In mã vạch"><Barcode className="w-4 h-4" /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingProduct(p); setIsModalOpen(true); }} className="p-1.5 text-slate-300 hover:text-indigo-600 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); if (confirm('Xóa sản phẩm này?')) deleteProduct(p.id); }} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-400 ml-1" /> : <ChevronDown className="w-4 h-4 text-slate-300 ml-1" />}
                                                </div>
                                            </td>
                                        </tr>
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={8} className="p-0 border-none">
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-slate-50/30">
                                                            <div className="p-8 flex gap-10">
                                                                {/* Left: Big Image */}
                                                                <div className="w-64 h-64 rounded-3xl bg-white border border-slate-200 p-2 shadow-xl flex-shrink-0">
                                                                    <div className="w-full h-full rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden">
                                                                        {p.imageBase64 ? <img src={p.imageBase64} alt="" className="w-full h-full object-cover" /> : <Package className="w-16 h-16 text-slate-200" />}
                                                                    </div>
                                                                </div>

                                                                {/* Right: Info */}
                                                                <div className="flex-1 space-y-8">
                                                                    <div>
                                                                        <h3 className="text-2xl font-black text-slate-800 mb-2">{p.name}</h3>
                                                                        <div className="flex gap-2">
                                                                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold font-mono tracking-wider">{p.sku}</span>
                                                                            <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">{cat?.name}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-20">
                                                                        {/* Description */}
                                                                        <div>
                                                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Mô tả sản phẩm</label>
                                                                            <p className="text-sm text-slate-600 leading-relaxed">{p.description || 'Sản phẩm chưa có mô tả chi tiết từ nhà sản xuất.'}</p>
                                                                        </div>

                                                                        {/* Specs */}
                                                                        <div>
                                                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Thông số kỹ thuật</label>
                                                                            <div className="grid grid-cols-2 gap-3">
                                                                                {p.specs && Object.entries(p.specs).length > 0 ? Object.entries(p.specs).map(([key, value]) => (
                                                                                    <div key={key} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">{key}</div>
                                                                                        <div className="text-xs font-black text-slate-700">{value}</div>
                                                                                    </div>
                                                                                )) : (
                                                                                    <div className="col-span-2 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-medium">Chưa có thông số kỹ thuật</div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && <ProductModal product={editingProduct} onClose={() => setIsModalOpen(false)} />}
            {isBarcodeModalOpen && selectedBarcodeProduct && <BarcodeModal product={selectedBarcodeProduct} onClose={() => setIsBarcodeModalOpen(false)} />}
        </div>
    );
}

import React from 'react';
