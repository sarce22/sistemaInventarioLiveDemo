import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import Swal from 'sweetalert2';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  PackageSearch,
  RefreshCw,
  Star,
  BarChart3
} from 'lucide-react';
import PageHeader from '../components/PageHeader';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    valorTotal: 0,
    alertaStockCount: 0,
    topProducts: [],
    lowStockProducts: []
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await API.get('/reportes/dashboard');
      if (response.data.status === 'success') {
        setMetrics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de Carga',
        text: error.response?.data?.message || 'No se pudieron cargar las métricas del dashboard.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const formatCurrency = (value) => {
    const formatted = new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
    return `$ ${formatted}`;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">Cargando métricas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* GLOBAL HEADER */}
      <PageHeader 
        title="Panel de Control" 
        subtitle="Resumen en tiempo real del estado de tu inventario" 
      />

      {/* UPDATE BUTTON ROW */}
      <div className="flex justify-end -mt-4 mb-2">
        <button 
          onClick={fetchMetrics}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-blue-600 rounded-2xl hover:bg-zinc-50 shadow-xs text-sm font-semibold transition-all cursor-pointer"
        >
          <RefreshCw size={14} className="text-blue-600 animate-hover-spin" />
          Actualizar Datos
        </button>
      </div>

      {/* SECCIÓN DE NOTIFICACIONES DE STOCK BAJO */}
      {metrics.lowStockProducts && metrics.lowStockProducts.length > 0 && (
        <div className="bg-rose-50/60 border-l-4 border-rose-550 rounded-2xl p-6 shadow-xs border border-rose-100/80">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-100/80 text-rose-600 rounded-xl">
              <AlertTriangle size={24} className="animate-pulse" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h3 className="text-lg font-bold text-rose-800">
                  ¡Atención! Hay {metrics.lowStockProducts.length} producto{metrics.lowStockProducts.length > 1 ? 's' : ''} con stock crítico
                </h3>
                <Link
                  to="/productos"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Gestionar Productos
                </Link>
              </div>
              <p className="text-sm text-rose-700">
                Los siguientes productos se encuentran en o por debajo de su stock mínimo de reabastecimiento establecido:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                {metrics.lowStockProducts.map((product) => (
                  <div 
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-rose-100 hover:border-rose-200 transition-all shadow-xs"
                  >
                    <div className="overflow-hidden pr-2">
                      <p className="font-semibold text-sm text-slate-800 truncate">{product.nombre}</p>
                      <p className="text-[10px] text-slate-400 font-mono tracking-wider truncate">{product.sku}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/30">
                        {product.stock_actual} / {product.stock_minimo} {product.unidad_medida === 'KILOGRAMO' ? 'kg' : 'uds'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Inventory Value */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/60 border-l-[4px] border-l-blue-600 shadow-xs flex items-center justify-between transition-all duration-300 hover:shadow-md hover:shadow-zinc-100/40">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 block">
              Valor del Inventario
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {formatCurrency(metrics.valorTotal)}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-500" />
              Suma de precio x stock de productos
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs shrink-0">
            <DollarSign size={22} className="font-bold" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/60 border-l-[4px] border-l-emerald-500 shadow-xs flex items-center justify-between transition-all duration-300 hover:shadow-md hover:shadow-zinc-100/40">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 block">
              Alertas de Stock Bajo
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-baseline gap-2 text-slate-900">
              {metrics.alertaStockCount}
              {metrics.alertaStockCount > 0 && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              )}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium block">
              Productos igual o bajo el stock mínimo
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs shrink-0">
            <AlertTriangle size={22} />
          </div>
        </div>

        {/* Top Products Count */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/60 border-l-[4px] border-l-amber-500 shadow-xs flex items-center justify-between transition-all duration-300 hover:shadow-md hover:shadow-zinc-100/40">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 block">
              Top Productos Stock
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {metrics.topProducts.length}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium block">
              Productos mostrados en el gráfico
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-xs shrink-0">
            <PackageSearch size={22} />
          </div>
        </div>

      </div>

      {/* CHART & DETAILS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART CONTAINER */}
        <div className="lg:col-span-2 bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md hover:shadow-zinc-100/20 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shadow-xs shrink-0">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight">Top 5 Productos Con Mayor Stock</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Comparación gráfica de existencias físicas disponibles</p>
            </div>
          </div>
          
          <div className="h-72 w-full mt-6">
            {metrics.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart 
                  data={metrics.topProducts}
                  margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e4e4e7" />
                  <XAxis 
                    dataKey="nombre" 
                    tick={{ fill: '#71717a', fontSize: 11, fontWeight: 'medium' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#71717a', fontSize: 11, fontWeight: 'medium' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      borderColor: '#e4e4e7',
                      color: '#18181b',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                    }}
                  />
                  <Bar 
                    dataKey="stock_actual" 
                    fill="#7c3aed"
                    radius={[8, 8, 0, 0]}
                    label={{ position: 'top', fill: '#4b5563', fontSize: 12, fontWeight: 'bold' }}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center border border-dashed border-zinc-200 rounded-xl">
                <span className="text-slate-400 text-sm">No hay productos registrados para graficar.</span>
              </div>
            )}
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-2 mt-4 pt-2 border-t border-zinc-50">
            <span className="h-3 w-3 rounded-full bg-violet-600"></span>
            <span className="text-xs font-semibold text-slate-500">Stock disponible (unidades)</span>
          </div>
        </div>

        {/* TOP PRODUCTS TABLE */}
        <div className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-xs flex flex-col hover:shadow-md hover:shadow-zinc-100/20 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-xs shrink-0">
              <Star size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight">Listado del Top Stock</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Los 5 productos con más existencias</p>
            </div>
          </div>

          <div className="space-y-3.5 mt-6 flex-1 overflow-y-auto max-h-[300px] lg:max-h-none">
            {metrics.topProducts.length > 0 ? (
              metrics.topProducts.map((product, index) => (
                <div 
                  key={product.id}
                  className="flex items-center justify-between p-3.5 bg-zinc-50/50 hover:bg-slate-100/50 rounded-xl border border-zinc-100 transition-all shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-50 text-blue-600 font-extrabold text-xs shrink-0 shadow-xs">
                      {index + 1}
                    </span>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-sm text-slate-850 truncate leading-tight">{product.nombre}</h4>
                      <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5 truncate">{product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-slate-800 block">
                      {product.stock_actual} {product.unidad_medida === 'KILOGRAMO' ? 'kg' : 'uds'}
                    </span>
                    <p className="text-xs text-slate-405 font-medium mt-0.5">{formatCurrency(product.precio)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center py-10">
                <span className="text-slate-400 text-sm">No hay productos.</span>
              </div>
            )}
          </div>

          {/* Footer Navigation Link */}
          <div className="pt-4 border-t border-zinc-100 mt-5 flex justify-center shrink-0">
            <Link 
              to="/productos" 
              className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              Ver todos los productos <span className="text-xs font-semibold">&gt;</span>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
