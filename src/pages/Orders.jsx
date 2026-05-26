import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { generateStockPDF, generateOrderPDF } from '../services/pdfGenerator';
import PageHeader from '../components/PageHeader';
import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
  Check,
  Trash2,
  Copy,
  AlertTriangle,
  Calendar,
  User,
  DollarSign,
  X,
  Info,
  Package,
  CheckCircle,
  FileText,
  Loader2,
  ClipboardList,
  ArrowRight,
  MessageSquare
} from 'lucide-react';

const Orders = () => {
  const { user } = useAuth();
  
  // Tabs State
  const [activeTab, setActiveTab] = useState('pedidos'); // 'pedidos' or 'existencias'

  // Data State
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('TODOS'); // 'TODOS', 'SUFICIENTE', 'CRITICO'

  // New Order Form Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showOnlySuggested, setShowOnlySuggested] = useState(false);

  // Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // General Loading for actions
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch orders and products
  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        API.get('/pedidos'),
        API.get('/productos')
      ]);

      if (ordersRes.data.status === 'success') {
        setOrders(ordersRes.data.data);
      }
      if (productsRes.data.status === 'success') {
        setProducts(productsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders/products:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de carga',
        text: 'Ocurrió un error al obtener la información de pedidos y productos.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format currency helper
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Format date helper
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Open Create Order Modal
  const handleOpenCreateModal = () => {
    setSelectedDetails([]);
    setProductSearchTerm('');
    setShowOnlySuggested(true); // Default to show suggested (low stock) items
    setIsCreateModalOpen(true);
  };

  // Add product to order list
  const handleAddProductToOrder = (product, customQty = null) => {
    const exists = selectedDetails.some(d => d.producto_id === product.id);
    if (exists) {
      return;
    }

    const defaultQty = customQty !== null ? customQty : 
      (product.stock_minimo > product.stock_actual ? parseFloat((product.stock_minimo - product.stock_actual).toFixed(2)) : 1);

    setSelectedDetails([...selectedDetails, {
      producto_id: product.id,
      nombre: product.nombre,
      sku: product.sku,
      unidad_medida: product.unidad_medida,
      stock_actual: product.stock_actual,
      precio: product.precio,
      cantidad_solicitada: defaultQty
    }]);
  };

  // Quick Action: make a order starting with a specific product
  const handleQuickOrder = (product) => {
    const defaultSuggest = product.stock_minimo > product.stock_actual 
      ? parseFloat((product.stock_minimo - product.stock_actual).toFixed(2)) 
      : 10;
    
    setSelectedDetails([{
      producto_id: product.id,
      nombre: product.nombre,
      sku: product.sku,
      unidad_medida: product.unidad_medida,
      stock_actual: product.stock_actual,
      precio: product.precio,
      cantidad_solicitada: defaultSuggest
    }]);
    
    setProductSearchTerm('');
    setShowOnlySuggested(true);
    setIsCreateModalOpen(true);
    setActiveTab('pedidos');
  };

  // Remove product from order list
  const handleRemoveProductFromOrder = (productId) => {
    setSelectedDetails(selectedDetails.filter(d => d.producto_id !== productId));
  };

  // Update requested quantity
  const handleUpdateQty = (productId, value) => {
    const qty = parseFloat(value);
    setSelectedDetails(selectedDetails.map(d => {
      if (d.producto_id === productId) {
        return { ...d, cantidad_solicitada: isNaN(qty) ? '' : qty };
      }
      return d;
    }));
  };

  // Submit Order Creation
  const handleCreateOrder = async (e) => {
    e.preventDefault();

    if (selectedDetails.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin productos',
        text: 'Debes agregar al menos un producto a la lista de pedido.',
        confirmButtonColor: '#7c3aed'
      });
      return;
    }

    // Validate quantities
    const invalidItem = selectedDetails.find(d => !d.cantidad_solicitada || d.cantidad_solicitada <= 0);
    if (invalidItem) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad inválida',
        text: `La cantidad solicitada para "${invalidItem.nombre}" debe ser mayor a 0.`,
        confirmButtonColor: '#7c3aed'
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await API.post('/pedidos', {
        detalles: selectedDetails.map(d => ({
          producto_id: d.producto_id,
          cantidad_solicitada: d.cantidad_solicitada
        }))
      });

      if (response.data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Pedido Creado',
          text: `Pedido ${response.data.data.numero_pedido} registrado exitosamente en estado pendiente.`,
          timer: 2000,
          showConfirmButton: false
        });
        setIsCreateModalOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error creating order:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'No se pudo registrar el pedido.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // View order detail
  const handleViewDetail = async (orderId) => {
    setDetailLoading(true);
    setIsDetailModalOpen(true);
    try {
      const response = await API.get(`/pedidos/${orderId}`);
      if (response.data.status === 'success') {
        setSelectedOrder(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching order detail:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo obtener el detalle de este pedido.',
        confirmButtonColor: '#ef4444'
      });
      setIsDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Download order report in PDF
  const handleDownloadOrderPDF = async (orderId) => {
    Swal.fire({
      title: 'Generando PDF...',
      html: 'Obteniendo detalles del pedido...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    try {
      const response = await API.get(`/pedidos/${orderId}`);
      if (response.data?.status === 'success') {
        generateOrderPDF(response.data.data, user);
        Swal.close();
      } else {
        throw new Error('No se pudo obtener el detalle del pedido.');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo generar el reporte en PDF.',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  // Confirm Order Reception (receive order)
  const handleReceiveOrder = async (orderId, orderNum) => {
    Swal.fire({
      title: `¿Confirmar Recepción?`,
      text: `¿Has recibido los productos del pedido ${orderNum}? Se incrementará automáticamente el stock actual en el inventario.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, recibir mercancía',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setActionLoading(true);
        try {
          const response = await API.put(`/pedidos/${orderId}/recibir`);
          if (response.data.status === 'success') {
            Swal.fire({
              icon: 'success',
              title: 'Inventario Actualizado',
              text: 'La mercancía ha sido ingresada y el stock ha aumentado con éxito.',
              timer: 2000,
              showConfirmButton: false
            });
            if (isDetailModalOpen && selectedOrder?.id === orderId) {
              setSelectedOrder({ ...selectedOrder, estado: 'RECIBIDO' });
            }
            fetchData();
          }
        } catch (error) {
          console.error('Error receiving order:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error al recibir',
            text: error.response?.data?.message || 'Ocurrió un error al procesar la recepción.',
            confirmButtonColor: '#ef4444'
          });
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  // Delete Order (Only ADMIN and PENDIENTE)
  const handleDeleteOrder = async (orderId, orderNum) => {
    Swal.fire({
      title: `¿Eliminar Pedido ${orderNum}?`,
      text: 'Esta acción cancelará el pedido de reabastecimiento de forma permanente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setActionLoading(true);
        try {
          const response = await API.delete(`/pedidos/${orderId}`);
          if (response.data.status === 'success') {
            Swal.fire({
              icon: 'success',
              title: 'Pedido Eliminado',
              text: 'El pedido ha sido eliminado correctamente.',
              timer: 1500,
              showConfirmButton: false
            });
            setIsDetailModalOpen(false);
            fetchData();
          }
        } catch (error) {
          console.error('Error deleting order:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error al eliminar',
            text: error.response?.data?.message || 'No se pudo eliminar el pedido.',
            confirmButtonColor: '#ef4444'
          });
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  // Get formatted order report text
  const getOrderReportText = (order) => {
    if (!order) return '';
    const itemsText = order.detalles.map((d, index) => {
      const unitLabel = d.unidad_medida === 'KILOGRAMO' ? 'kg' : 'uds';
      return `${index + 1}. [${d.sku}] ${d.nombre}\n   Cantidad: ${d.cantidad_solicitada} ${unitLabel} | Precio Est.: ${formatCurrency(d.precio_estimado)}/u | Subtotal: ${formatCurrency(d.cantidad_solicitada * d.precio_estimado)}`;
    }).join('\n');

    return `=========================================
REPORTE DE PEDIDO: ${order.numero_pedido}
=========================================
Estado: ${order.estado}
Creado por: ${order.creado_por}
Fecha de creación: ${formatDate(order.createdAt)}
-----------------------------------------
PRODUCTOS SOLICITADOS:
${itemsText}
-----------------------------------------
Costo Total Estimado: ${formatCurrency(order.costoTotal)}
=========================================`;
  };

  // Get formatted stock report text
  const getStockReportText = () => {
    if (products.length === 0) return '';
    // Group products by category
    const categoriesMap = {};
    products.forEach(p => {
      const catName = p.categoria?.nombre || 'Sin Categoría';
      if (!categoriesMap[catName]) {
        categoriesMap[catName] = [];
      }
      categoriesMap[catName].push(p);
    });

    let reportText = `=========================================
REPORTE DE EXISTENCIAS (STOCK ACTUAL)
=========================================
Fecha de generación: ${formatDate(new Date())}
Generado por: ${user?.nombre || user?.username} (${user?.rol})
-----------------------------------------\n`;

    for (const [catName, prods] of Object.entries(categoriesMap)) {
      reportText += `📁 [${catName.toUpperCase()}]\n`;
      prods.forEach(p => {
        const unitLabel = p.unidad_medida === 'KILOGRAMO' ? 'kg' : 'uds';
        const isLowStock = p.stock_actual <= p.stock_minimo;
        const statusLabel = isLowStock ? ' *STOCK BAJO*' : '';
        reportText += `  - [${p.sku}] ${p.nombre}: ${p.stock_actual} ${unitLabel} (Mín: ${p.stock_minimo} ${unitLabel})${statusLabel}\n`;
      });
      reportText += `\n`;
    }

    const lowStockCount = products.filter(p => p.stock_actual <= p.stock_minimo).length;

    reportText += `-----------------------------------------
RESUMEN:
Total Productos: ${products.length}
Productos con Stock Crítico: ${lowStockCount}
=========================================`;

    return reportText;
  };

  // Copy order summary to clipboard
  const handleCopyReport = () => {
    if (!selectedOrder) return;
    const reportText = getOrderReportText(selectedOrder);

    navigator.clipboard.writeText(reportText)
      .then(() => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Reporte copiado al portapapeles',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
        Swal.fire({
          icon: 'error',
          title: 'Error al copiar',
          text: 'No se pudo copiar el reporte automáticamente.',
          confirmButtonColor: '#ef4444'
        });
      });
  };

  // Copy current stock report to clipboard
  const handleCopyStockReport = () => {
    const reportText = getStockReportText();
    if (!reportText) return;

    navigator.clipboard.writeText(reportText)
      .then(() => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Reporte de existencias copiado',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
      })
      .catch((err) => {
        console.error('Failed to copy stock report:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error al copiar',
          text: 'No se pudo copiar el reporte automáticamente.',
          confirmButtonColor: '#ef4444'
        });
      });
  };

  // Send report via WhatsApp
  const handleSendWhatsApp = async (textReport, defaultPhone = '3122477439') => {
    Swal.fire({
      icon: 'info',
      title: 'Función no disponible en Demo',
      text: 'El envío de reportes por WhatsApp solo está disponible en la versión final del sistema de inventarios.',
      confirmButtonColor: '#2b6cb0'
    });
  };

  // Fetch full details of an order and send it to WhatsApp quickly
  const handleWhatsAppOrderQuick = async (orderId) => {
    handleSendWhatsApp();
  };

  // Filters calculation for Orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.numero_pedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.creado_por.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'TODOS' || order.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate under stock products
  const suggestedProducts = products.filter(p => p.stock_actual <= p.stock_minimo);

  // Filters calculation for Stock Inventory
  const filteredProductsStock = products.filter(p => {
    const matchesSearch = 
      p.nombre.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
      (p.categoria?.nombre || '').toLowerCase().includes(stockSearchTerm.toLowerCase());
    
    const isLowStock = p.stock_actual <= p.stock_minimo;
    let matchesStatus = true;
    if (stockStatusFilter === 'CRITICO') {
      matchesStatus = isLowStock;
    } else if (stockStatusFilter === 'SUFICIENTE') {
      matchesStatus = !isLowStock;
    }

    return matchesSearch && matchesStatus;
  });

  // Search products in Modal
  const modalFilteredProducts = products.filter(p => {
    const matchesSearch = 
      p.nombre.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearchTerm.toLowerCase());
    
    const isSuggested = p.stock_actual <= p.stock_minimo;

    if (showOnlySuggested) {
      return matchesSearch && isSuggested;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-700">
      
      {/* HEADER SECTION */}
      <PageHeader 
        title="Pedidos de Reabastecimiento" 
        subtitle="Gestión de reabastecimiento y reportes rápidos de existencias en el inventario actual." 
      />

      <div className="flex justify-end -mt-4 mb-4">
        {activeTab === 'pedidos' ? (
          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all text-white font-semibold rounded-xl shadow-md shadow-blue-500/10 cursor-pointer text-sm"
          >
            <Plus size={18} />
            Nuevo Pedido
          </button>
        ) : (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopyStockReport}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-zinc-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl shadow-xs cursor-pointer text-sm"
            >
              <Copy size={18} />
              Copiar Reporte
            </button>
            <button
              onClick={() => generateStockPDF(products, user)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-500/10 cursor-pointer text-sm"
            >
              <FileText size={18} />
              Descargar PDF
            </button>
            <button
              onClick={() => handleSendWhatsApp(getStockReportText())}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-500/10 cursor-pointer text-sm"
              title="Enviar existencias actuales por WhatsApp"
            >
              <MessageSquare size={18} />
              WhatsApp
            </button>
          </div>
        )}
      </div>

      {/* SUGGESTION BANNER IF THERE ARE UNDER-STOCK ITEMS AND NOT IN ACTIVE TAB OR IF APPROPRIATE */}
      {suggestedProducts.length > 0 && activeTab === 'pedidos' && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <AlertTriangle size={20} className="animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-amber-800 text-sm">
                Productos con Stock Crítico Detectados
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Hay {suggestedProducts.length} producto{suggestedProducts.length > 1 ? 's' : ''} en o por debajo del stock mínimo. Puedes generar un pedido sugerido inmediatamente.
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Ver Sugerencias
          </button>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-slate-200/80 bg-white px-6 rounded-t-2xl border-t border-x border-slate-200/60 shadow-xs">
        <button
          onClick={() => setActiveTab('pedidos')}
          className={`py-4 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'pedidos'
              ? 'border-violet-600 text-violet-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShoppingCart size={18} />
          Pedidos de Reabastecimiento
        </button>
        <button
          onClick={() => setActiveTab('existencias')}
          className={`py-4 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'existencias'
              ? 'border-violet-600 text-violet-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardList size={18} />
          Existencias Actuales (Lo que hay)
        </button>
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'pedidos' ? (
        /* PEDIDOS TAB */
        <div className="bg-white rounded-b-2xl border-b border-x border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
            
            {/* Search bar */}
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Buscar por N° pedido o creador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white text-slate-800 placeholder-slate-450"
              />
            </div>

            {/* Status filters */}
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto">
              {['TODOS', 'PENDIENTE', 'RECIBIDO'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    statusFilter === status 
                      ? 'bg-white text-violet-700 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

          </div>

          {/* LOADING & TABLE SECTION */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-violet-600" size={32} />
              <p className="text-sm font-semibold text-slate-450">Cargando pedidos de reabastecimiento...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
                <ShoppingCart size={28} />
              </div>
              <h3 className="font-bold text-slate-700 text-lg">No se encontraron pedidos</h3>
              <p className="text-sm text-slate-450 mt-1 max-w-sm">
                {searchTerm || statusFilter !== 'TODOS' 
                  ? 'Prueba modificando tus filtros o términos de búsqueda.' 
                  : 'Comienza creando tu primer pedido de reabastecimiento haciendo clic en "Nuevo Pedido".'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-wider bg-slate-50/20">
                    <th className="px-6 py-4">N° Pedido</th>
                    <th className="px-6 py-4">Fecha Creación</th>
                    <th className="px-6 py-4">Creado Por</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Costo Estimado</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-55/30 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md text-xs border border-slate-200/50">
                          {order.numero_pedido}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-slate-400" />
                          {formatDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black uppercase">
                            {order.creado_por.substring(0,2)}
                          </div>
                          {order.creado_por}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        {order.totalItems} {order.totalItems === 1 ? 'producto' : 'productos'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {formatCurrency(order.costoTotal)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          order.estado === 'RECIBIDO'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/40'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/40'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${order.estado === 'RECIBIDO' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {order.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewDetail(order.id)}
                            className="p-1.5 hover:bg-violet-50 text-violet-600 rounded-lg transition-colors cursor-pointer"
                            title="Ver detalle del pedido"
                          >
                            <Eye size={18} />
                          </button>
                          
                          <button
                            onClick={() => handleDownloadOrderPDF(order.id)}
                            className="p-1.5 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors cursor-pointer"
                            title="Descargar PDF del pedido"
                          >
                            <FileText size={18} />
                          </button>
                          
                          <button
                            onClick={() => handleWhatsAppOrderQuick(order.id)}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                            title="Enviar pedido por WhatsApp"
                          >
                            <MessageSquare size={18} />
                          </button>
                          
                          {order.estado === 'PENDIENTE' && (
                            <>
                              <button
                                onClick={() => handleReceiveOrder(order.id, order.numero_pedido)}
                                className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                                title="Marcar como mercancía recibida"
                              >
                                <Check size={18} />
                              </button>
                              
                              {user?.rol === 'ADMIN' && (
                                <button
                                  onClick={() => handleDeleteOrder(order.id, order.numero_pedido)}
                                  className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                  title="Eliminar pedido"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* EXISTENCIAS TAB (LO QUE HAY ACTUALMENTE) */
        <div className="bg-white rounded-b-2xl border-b border-x border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
            
            {/* Search inside stock */}
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Buscar por Nombre, SKU o Categoría..."
                value={stockSearchTerm}
                onChange={(e) => setStockSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white text-slate-800 placeholder-slate-450"
              />
            </div>

            {/* Stock status filter */}
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto">
              {[
                { label: 'Todos', value: 'TODOS' },
                { label: 'Suficiente', value: 'SUFICIENTE' },
                { label: 'Bajo Stock', value: 'CRITICO' }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStockStatusFilter(filter.value)}
                  className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    stockStatusFilter === filter.value 
                      ? 'bg-white text-violet-700 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

          </div>

          {/* LOADING & TABLE SECTION */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-violet-600" size={32} />
              <p className="text-sm font-semibold text-slate-450">Cargando existencias de inventario...</p>
            </div>
          ) : filteredProductsStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
                <Package size={28} />
              </div>
              <h3 className="font-bold text-slate-700 text-lg">No se encontraron existencias</h3>
              <p className="text-sm text-slate-450 mt-1 max-w-sm">
                No hay productos que coincidan con la búsqueda o el filtro seleccionado.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-wider bg-slate-50/20">
                    <th className="px-6 py-4">Producto</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Categoría</th>
                    <th className="px-6 py-4">Stock Actual</th>
                    <th className="px-6 py-4">Stock Mínimo</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProductsStock.map((prod) => {
                    const isLowStock = prod.stock_actual <= prod.stock_minimo;
                    const unitLabel = prod.unidad_medida === 'KILOGRAMO' ? 'kg' : 'uds';
                    
                    return (
                      <tr 
                        key={prod.id} 
                        className={`hover:bg-slate-55/30 transition-colors group ${
                          isLowStock ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{prod.nombre}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">P. Unitario: {formatCurrency(prod.precio)}</div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500">
                          {prod.sku}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                          {prod.categoria?.nombre || 'Sin Categoría'}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold">
                          <span className={isLowStock ? 'text-rose-600 font-extrabold' : 'text-slate-800'}>
                            {prod.stock_actual} {unitLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {prod.stock_minimo} {unitLabel}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isLowStock
                              ? 'bg-rose-50 text-rose-700 border border-rose-200/40'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/40'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isLowStock ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                            {isLowStock ? 'Bajo Stock' : 'Suficiente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleQuickOrder(prod)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 hover:bg-violet-50 text-violet-600 rounded-lg text-xs font-bold transition-all border border-violet-100 hover:border-violet-200 cursor-pointer"
                            title="Comenzar pedido para este producto"
                          >
                            Pedir Reabastecimiento
                            <ArrowRight size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE ORDER MODAL (LARGE SLIDE-OUT OR MODAL) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
          <div className="w-full max-w-4xl bg-white h-full flex flex-col shadow-2xl relative animate-slide-in">
            
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-violet-600 to-purple-600 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <ShoppingCart size={22} />
                <div>
                  <h2 className="text-xl font-bold">Generar Nuevo Pedido</h2>
                  <p className="text-violet-100 text-xs mt-0.5">Define los productos y cantidades a solicitar reabastecimiento.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Container */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6 min-h-0">
              
              {/* LEFT COLUMN: Product Catalog / Sugerencias */}
              <div className="w-full lg:w-1/2 flex flex-col border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/30">
                <div className="p-4 border-b border-slate-200 bg-white space-y-3">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Package size={16} className="text-slate-500" />
                    Catálogo de Selección
                  </h3>
                  
                  {/* Search inside catalog */}
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="Buscar por SKU o Nombre..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white text-slate-800 placeholder-slate-400"
                    />
                  </div>

                  {/* Toggle filter low stock */}
                  <label className="inline-flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={showOnlySuggested}
                      onChange={() => setShowOnlySuggested(!showOnlySuggested)}
                      className="rounded border-slate-350 text-violet-600 focus:ring-violet-500/30"
                    />
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-amber-500" />
                      Mostrar solo stock crítico ({suggestedProducts.length})
                    </span>
                  </label>
                </div>

                {/* Catalog Products List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[250px]">
                  {modalFilteredProducts.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-xs text-slate-450 font-medium">No se encontraron productos disponibles.</p>
                    </div>
                  ) : (
                    modalFilteredProducts.map((p) => {
                      const isLowStock = p.stock_actual <= p.stock_minimo;
                      const isAdded = selectedDetails.some(d => d.producto_id === p.id);
                      const unitLabel = p.unidad_medida === 'KILOGRAMO' ? 'kg' : 'uds';
                      const defaultSuggest = p.stock_minimo > p.stock_actual ? parseFloat((p.stock_minimo - p.stock_actual).toFixed(2)) : 10;
                      
                      return (
                        <div 
                          key={p.id}
                          className={`p-3 bg-white border rounded-xl flex items-center justify-between gap-3 shadow-xs hover:border-slate-350 transition-all ${
                            isLowStock ? 'border-amber-100 hover:border-amber-200' : 'border-slate-100'
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-800 truncate">{p.nombre}</span>
                              {isLowStock && (
                                <span className="bg-amber-50 text-amber-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-amber-200/50">
                                  Bajo Stock
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono tracking-wide mt-0.5">{p.sku}</p>
                            <p className="text-[10px] text-slate-500 mt-1">
                              Stock: <span className="font-semibold text-slate-700">{p.stock_actual} / {p.stock_minimo} {unitLabel}</span>
                            </p>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleAddProductToOrder(p, defaultSuggest)}
                            disabled={isAdded}
                            className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isAdded 
                                ? 'bg-slate-100 text-slate-400 border border-slate-200/40 cursor-not-allowed' 
                                : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-100'
                            }`}
                          >
                            {isAdded ? 'Agregado' : 'Añadir'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Order Items / Details Form */}
              <div className="w-full lg:w-1/2 flex flex-col border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <FileText size={16} className="text-violet-600" />
                    Lista de Pedido ({selectedDetails.length} items)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedDetails([])}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold transition-colors cursor-pointer"
                    disabled={selectedDetails.length === 0}
                  >
                    Vaciar todo
                  </button>
                </div>

                {/* Form to submit */}
                <form onSubmit={handleCreateOrder} className="flex-1 flex flex-col min-h-0 bg-transparent">
                  {/* Requested Items Table */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px]">
                    {selectedDetails.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-16 text-center text-slate-400">
                        <ShoppingCart size={40} className="stroke-1 text-slate-300 mb-2" />
                        <p className="text-xs font-bold text-slate-700">No has seleccionado ningún producto</p>
                        <p className="text-[10px] text-slate-450 mt-1 max-w-[200px]">
                          Usa el catálogo de la izquierda para buscar y añadir productos.
                        </p>
                      </div>
                    ) : (
                      selectedDetails.map((item) => {
                        const unitLabel = item.unidad_medida === 'KILOGRAMO' ? 'kg' : 'uds';
                        const subtotal = (item.cantidad_solicitada || 0) * item.precio;
                        
                        return (
                          <div 
                            key={item.producto_id}
                            className="p-3 border border-slate-100 bg-slate-50/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex-1 overflow-hidden">
                              <p className="font-bold text-xs text-slate-800 truncate">{item.nombre}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-450 font-medium mt-1">
                                <span className="font-mono">{item.sku}</span>
                                <span>•</span>
                                <span>P. Est: {formatCurrency(item.precio)}</span>
                              </div>
                            </div>

                            {/* Quantity input and remove button */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                                <input
                                  type="number"
                                  min={item.unidad_medida === 'KILOGRAMO' ? "0.01" : "1"}
                                  step={item.unidad_medida === 'KILOGRAMO' ? "0.01" : "1"}
                                  required
                                  value={item.cantidad_solicitada}
                                  onChange={(e) => handleUpdateQty(item.producto_id, e.target.value)}
                                  className="w-16 text-right font-bold text-xs focus:outline-none text-slate-900 border-none p-0 bg-transparent"
                                />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{unitLabel}</span>
                              </div>

                              <div className="text-right w-20 shrink-0">
                                <p className="text-xs font-black text-slate-800">{formatCurrency(subtotal)}</p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveProductFromOrder(item.producto_id)}
                                className="p-1 hover:bg-rose-50 text-rose-600 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Summary & Save footer */}
                  <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-4 mt-auto">
                    <div className="flex justify-between items-center text-slate-800">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Costo Estimado Total:</span>
                      <span className="text-xl font-black bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        {formatCurrency(selectedDetails.reduce((sum, d) => sum + ((d.cantidad_solicitada || 0) * d.precio), 0))}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(false)}
                        className="flex-1 py-2.5 px-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer text-center"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading || selectedDetails.length === 0}
                        className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-all text-white rounded-xl text-xs font-bold cursor-pointer text-center flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading && <Loader2 className="animate-spin" size={14} />}
                        Guardar Pedido
                      </button>
                    </div>
                  </div>
                </form>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-scale-in">
            
            {detailLoading || !selectedOrder ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white">
                <Loader2 className="animate-spin text-violet-600" size={32} />
                <p className="text-sm font-semibold text-slate-450">Cargando detalles de pedido...</p>
              </div>
            ) : (
              <div>
                
                {/* Header detail */}
                <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                        Pedido {selectedOrder.numero_pedido}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Creado por {selectedOrder.creado_por} • {formatDate(selectedOrder.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsDetailModalOpen(false)}
                    className="p-1.5 text-slate-450 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Content detail */}
                <div className="p-6 space-y-6">
                  
                  {/* Status, Costs cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado de Recepción</span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          selectedOrder.estado === 'RECIBIDO'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/40'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/40'
                        }`}>
                          {selectedOrder.estado}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Costo Total Estimado</span>
                      <p className="text-xl font-extrabold text-slate-900 mt-1">{formatCurrency(selectedOrder.costoTotal)}</p>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      Productos Solicitados ({selectedOrder.detalles.length})
                    </h3>
                    <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[9px] border-b border-slate-100">
                            <th className="px-4 py-2">Producto</th>
                            <th className="px-4 py-2 text-right">Cant. Solicitada</th>
                            <th className="px-4 py-2 text-right">P. Est. Unitario</th>
                            <th className="px-4 py-2 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-medium">
                          {selectedOrder.detalles.map((d) => {
                            const unitLabel = d.unidad_medida === 'KILOGRAMO' ? 'kg' : 'uds';
                            return (
                              <tr key={d.id} className="hover:bg-slate-55/20 text-slate-700">
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-800">{d.nombre}</div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{d.sku}</div>
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-slate-900">
                                  {d.cantidad_solicitada} <span className="text-[10px] font-medium text-slate-450 uppercase">{unitLabel}</span>
                                </td>
                                <td className="px-4 py-3 text-right text-slate-650">
                                  {formatCurrency(d.precio_estimado)}
                                </td>
                                <td className="px-4 py-3 text-right font-extrabold text-slate-800">
                                  {formatCurrency(d.cantidad_solicitada * d.precio_estimado)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* Footer details */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                  
                  {/* Left: Delete if Pending & Admin */}
                  <div>
                    {selectedOrder.estado === 'PENDIENTE' && user?.rol === 'ADMIN' && (
                      <button
                        onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.numero_pedido)}
                        disabled={actionLoading}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 size={15} />
                        Eliminar Pedido
                      </button>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={handleCopyReport}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="Copiar reporte al portapapeles"
                    >
                      <Copy size={15} />
                      Copiar Reporte
                    </button>

                    <button
                      onClick={() => generateOrderPDF(selectedOrder, user)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-600/10 active:scale-[0.98] transition-all text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                      title="Descargar orden en PDF"
                    >
                      <FileText size={15} />
                      Descargar PDF
                    </button>

                    <button
                      onClick={() => handleSendWhatsApp(getOrderReportText(selectedOrder))}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                      title="Enviar orden por WhatsApp"
                    >
                      <MessageSquare size={15} />
                      WhatsApp
                    </button>

                    {selectedOrder.estado === 'PENDIENTE' && (
                      <button
                        onClick={() => handleReceiveOrder(selectedOrder.id, selectedOrder.numero_pedido)}
                        disabled={actionLoading}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        {actionLoading ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle size={15} />}
                        Recibir Mercancía
                      </button>
                    )}
                  </div>

                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Orders;
