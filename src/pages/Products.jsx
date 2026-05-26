import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  Layers,
  X,
  Sparkles,
  Info,
  List,
  LayoutGrid
} from 'lucide-react';
import PageHeader from '../components/PageHeader';

const Products = () => {
  const { user } = useAuth();
  
  // Data State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [highlightLowStock, setHighlightLowStock] = useState(true);
  const [viewMode, setViewMode] = useState(localStorage.getItem('productsViewMode') || 'table');

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('productsViewMode', mode);
  };

  // Sincronizar el estado del filtro con el cambio en el query param de la URL
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form Fields
  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [stockActual, setStockActual] = useState('');
  const [stockMinimo, setStockMinimo] = useState('0');
  const [categoriaId, setCategoriaId] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('UNIDAD');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        API.get('/productos'),
        API.get('/categorias')
      ]);

      if (prodRes.data.status === 'success') {
        setProducts(prodRes.data.data);
      }
      if (catRes.data.status === 'success') {
        setCategories(catRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de carga',
        text: 'Ocurrió un error al obtener la información de productos y categorías.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditId(null);
    setSku('');
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setStockActual('');
    setStockMinimo('0');
    setCategoriaId(categories[0]?.id || '');
    setUnidadMedida('UNIDAD');
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditId(product.id);
    setSku(product.sku);
    setNombre(product.nombre);
    setDescripcion(product.descripcion || '');
    setPrecio(product.precio.toString());
    setStockActual(product.stock_actual.toString());
    setStockMinimo(product.stock_minimo.toString());
    setCategoriaId(product.categoria_id);
    setUnidadMedida(product.unidad_medida || 'UNIDAD');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!sku.trim() || !nombre.trim() || !precio || stockActual === '' || !categoriaId) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos vacíos',
        text: 'Los campos SKU, Nombre, Precio, Stock Actual y Categoría son obligatorios.',
        confirmButtonColor: '#7c3aed'
      });
      return;
    }

    const actualParsed = unidadMedida === 'UNIDAD' ? Math.floor(parseFloat(stockActual)) : parseFloat(stockActual);
    const minimoParsed = unidadMedida === 'UNIDAD' ? Math.floor(parseFloat(stockMinimo)) : parseFloat(stockMinimo);

    const payload = {
      sku: sku.trim(),
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      precio: parseFloat(precio),
      stock_actual: actualParsed,
      stock_minimo: minimoParsed || 0,
      categoria_id: parseInt(categoriaId),
      unidad_medida: unidadMedida
    };

    setFormLoading(true);
    try {
      const unitLabel = payload.unidad_medida === 'KILOGRAMO' ? 'kg' : 'uds';
      if (editId) {
        // Actualización
        const response = await API.put(`/productos/${editId}`, payload);
        if (response.data.status === 'success') {
          // Si el backend responde con alertaStock: true
          if (response.data.alertaStock) {
            Swal.fire({
              icon: 'warning',
              title: 'Producto Actualizado con Alerta',
              text: `El producto "${payload.nombre}" ha sido actualizado, pero su stock actual (${payload.stock_actual} ${unitLabel}) es menor o igual al mínimo establecido (${payload.stock_minimo} ${unitLabel}).`,
              confirmButtonColor: '#eab308'
            });
          } else {
            Swal.fire({
              icon: 'success',
              title: 'Actualizado',
              text: 'El producto ha sido modificado correctamente.',
              timer: 1500,
              showConfirmButton: false
            });
          }
        }
      } else {
        // Creación
        const response = await API.post('/productos', payload);
        if (response.data.status === 'success') {
          // Validar si entra en alerta de inmediato
          const isLowStock = payload.stock_actual <= payload.stock_minimo;
          if (isLowStock) {
            Swal.fire({
              icon: 'warning',
              title: 'Producto Creado con Alerta',
              text: `Producto registrado con éxito, pero con stock crítico (${payload.stock_actual} ${unitLabel} vs min. ${payload.stock_minimo} ${unitLabel}).`,
              confirmButtonColor: '#eab308'
            });
          } else {
            Swal.fire({
              icon: 'success',
              title: 'Creado',
              text: 'El producto ha sido registrado exitosamente.',
              timer: 1500,
              showConfirmButton: false
            });
          }
        }
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al registrar',
        text: error.response?.data?.message || 'Ya existe un producto con el mismo SKU.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    Swal.fire({
      title: `¿Eliminar "${name}"?`,
      text: 'Esta acción no se puede deshacer. El producto será borrado permanentemente del inventario.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await API.delete(`/productos/${id}`);
          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Eliminado',
              text: 'El producto ha sido eliminado correctamente.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
            fetchData();
          }
        } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Error de Eliminación',
            text: error.response?.data?.message || 'No se pudo eliminar el producto.',
            confirmButtonColor: '#ef4444'
          });
        }
      }
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Filtrado lógico de productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.descripcion && product.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesCategory = 
      selectedCategory === '' || 
      product.categoria_id === parseInt(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const isAdmin = user?.rol === 'ADMIN';

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      
      {/* HEADER & ACTIONS */}
      <PageHeader 
        title="Inventario de Productos" 
        subtitle="Administra existencias, SKU y alertas de reabastecimiento" 
      />

      <div className="flex justify-between items-center -mt-4 mb-2">
        {/* Selector de tipo de vista */}
        <div className="flex items-center gap-1 bg-white border border-zinc-200 p-1 rounded-xl shadow-xs">
          <button
            onClick={() => handleViewModeChange('table')}
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              viewMode === 'table' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
            }`}
            title="Vista de Tabla"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => handleViewModeChange('grid')}
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              viewMode === 'grid' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
            }`}
            title="Vista de Tarjetas"
          >
            <LayoutGrid size={16} />
          </button>
        </div>

        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer text-sm"
        >
          <Plus size={18} />
          Nuevo Producto
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Search */}
        <div className="relative md:col-span-6">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-800 placeholder-slate-400 outline-none transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-800 outline-none transition-all cursor-pointer"
          >
            <option value="" className="bg-white">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id} className="bg-white">
                {category.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Resaltar Bajo Stock Switch */}
        <div className="md:col-span-3 flex justify-end md:justify-start px-2">
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={highlightLowStock} 
              onChange={(e) => setHighlightLowStock(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
            <span className="ml-3 text-sm font-semibold text-slate-650">Resaltar stock crítico</span>
          </label>
        </div>
      </div>

      {/* PRODUCTS LISTING */}
      {loading ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-md shadow-slate-100/50 py-20 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
        </div>
      ) : filteredProducts.length > 0 ? (
        viewMode === 'table' ? (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-md shadow-slate-100/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">SKU</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Nombre</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Categoría</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Precio</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Stock</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Estado</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => {
                    const isLowStock = parseFloat(product.stock_actual) <= parseFloat(product.stock_minimo);
                    const shouldHighlight = highlightLowStock && isLowStock;
                    return (
                      <tr 
                        key={product.id} 
                        className={`
                          transition-colors border-b border-slate-100
                          ${shouldHighlight 
                            ? 'bg-rose-50/70 hover:bg-rose-100/60 border-l-4 border-rose-500' 
                            : 'hover:bg-slate-50/80 text-slate-700'
                          }
                        `}
                      >
                        {/* SKU */}
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-mono text-xs rounded-md border border-slate-200/55">
                            {product.sku}
                          </span>
                        </td>
                        {/* Nombre & Descripción */}
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-semibold text-sm block text-slate-800">{product.nombre}</span>
                            <span className="text-xs text-slate-400 line-clamp-1 max-w-[200px]">
                              {product.descripcion || 'Sin descripción'}
                            </span>
                          </div>
                        </td>
                        {/* Categoría */}
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {product.categoria?.nombre || 'General'}
                        </td>
                        {/* Precio */}
                        <td className="px-6 py-4 font-medium text-sm text-slate-850">
                          {formatCurrency(product.precio)}
                        </td>
                        {/* Stock Info */}
                        <td className="px-6 py-4">
                          <div>
                            <span className="text-sm font-bold block text-slate-850">
                              {product.stock_actual} {product.unidad_medida === 'KILOGRAMO' ? 'kg' : 'uds'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              mínimo: {product.stock_minimo} {product.unidad_medida === 'KILOGRAMO' ? 'kg' : 'uds'}
                            </span>
                          </div>
                        </td>
                        {/* Estado */}
                        <td className="px-6 py-4">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-600 border border-rose-200/30">
                              <AlertTriangle size={12} />
                              Bajo Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-600 border border-emerald-250/20">
                              Abundante
                            </span>
                          )}
                        </td>
                        {/* Acciones */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(product)}
                              className="p-2 rounded-lg text-violet-600 hover:bg-violet-50 transition-colors cursor-pointer"
                              title="Editar producto"
                            >
                              <Edit2 size={16} />
                            </button>
                            
                            {isAdmin ? (
                              <button
                                onClick={() => handleDelete(product.id, product.nombre)}
                                className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Eliminar producto"
                              >
                                <Trash2 size={16} />
                              </button>
                            ) : (
                              <button
                                className="p-2 rounded-lg text-slate-300 cursor-not-allowed"
                                title="Solo Administradores pueden eliminar productos"
                                disabled
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const isLowStock = parseFloat(product.stock_actual) <= parseFloat(product.stock_minimo);
              const shouldHighlight = highlightLowStock && isLowStock;
              return (
                <div 
                  key={product.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between relative ${
                    shouldHighlight 
                      ? 'border-l-4 border-l-rose-500 border-slate-200 bg-rose-50/20' 
                      : 'border-slate-200/75'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center gap-2 mb-3">
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-650 font-mono text-[10px] font-bold rounded border border-slate-200/50">
                        {product.sku}
                      </span>
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 font-semibold text-[10px] uppercase rounded-full">
                        {product.categoria?.nombre || 'General'}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 text-base line-clamp-1" title={product.nombre}>
                      {product.nombre}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 min-h-[32px]">
                      {product.descripcion || 'Sin descripción'}
                    </p>

                    {isLowStock && (
                      <div className="mt-3.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-600 border border-rose-200/35">
                        <AlertTriangle size={11} />
                        Bajo Stock
                      </div>
                    )}
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Precio</span>
                        <span className="text-base font-black text-slate-800">{formatCurrency(product.precio)}</span>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Inventario</span>
                        <span className={`text-sm font-black block ${isLowStock ? 'text-rose-600' : 'text-slate-700'}`}>
                          {product.stock_actual} {product.unidad_medida === 'KILOGRAMO' ? 'kg' : 'uds'}
                        </span>
                        <span className="text-[9px] text-slate-400 block">
                          min: {product.stock_minimo} {product.unidad_medida === 'KILOGRAMO' ? 'kg' : 'uds'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-1.5 mt-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-650 text-slate-650 font-bold text-xs rounded-xl cursor-pointer transition-all"
                        title="Editar producto"
                      >
                        <Edit2 size={13} />
                        Editar
                      </button>

                      {isAdmin ? (
                        <button
                          onClick={() => handleDelete(product.id, product.nombre)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-650 text-slate-650 font-bold text-xs rounded-xl cursor-pointer transition-all"
                          title="Eliminar producto"
                        >
                          <Trash2 size={13} />
                          Eliminar
                        </button>
                      ) : (
                        <button
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-150 text-slate-300 font-bold text-xs rounded-xl cursor-not-allowed"
                          title="Solo Administradores pueden eliminar productos"
                          disabled
                        >
                          <Trash2 size={13} />
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-md shadow-slate-100/50 py-20 flex flex-col items-center justify-center text-slate-400">
          <Package size={48} className="text-slate-300 mb-3" />
          <span>No se encontraron productos.</span>
        </div>
      )}

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-violet-600" />
                <h3 className="font-extrabold text-xl text-slate-900">
                  {editId ? 'Editar Producto' : 'Registrar Nuevo Producto'}
                </h3>
              </div>
              <button 
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SKU */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      SKU (Código único) *
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="ej: ELEC-LAP-001"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-800 placeholder-slate-450 rounded-xl outline-none transition-all"
                      disabled={formLoading}
                    />
                  </div>

                  {/* Nombre */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="ej: Laptop Asus Tuf"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-800 placeholder-slate-450 rounded-xl outline-none transition-all"
                      disabled={formLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Precio */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Precio de Venta ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={precio}
                      onChange={(e) => setPrecio(e.target.value)}
                      placeholder="ej: 2500000"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-800 placeholder-slate-450 rounded-xl outline-none transition-all"
                      disabled={formLoading}
                    />
                  </div>

                  {/* Stock Actual */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Stock Actual *
                    </label>
                    <input
                      type="number"
                      step={unidadMedida === 'UNIDAD' ? '1' : 'any'}
                      value={stockActual}
                      onChange={(e) => setStockActual(e.target.value)}
                      placeholder={unidadMedida === 'UNIDAD' ? 'ej: 15' : 'ej: 15.5'}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-800 placeholder-slate-450 rounded-xl outline-none transition-all"
                      disabled={formLoading}
                    />
                  </div>

                  {/* Stock Mínimo */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Stock Mínimo (Alerta)
                    </label>
                    <input
                      type="number"
                      step={unidadMedida === 'UNIDAD' ? '1' : 'any'}
                      value={stockMinimo}
                      onChange={(e) => setStockMinimo(e.target.value)}
                      placeholder={unidadMedida === 'UNIDAD' ? 'ej: 3' : 'ej: 3.5'}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-800 placeholder-slate-450 rounded-xl outline-none transition-all"
                      disabled={formLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Unidad de Medida */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Unidad de Medida *
                    </label>
                    <select
                      value={unidadMedida}
                      onChange={(e) => setUnidadMedida(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-800 rounded-xl outline-none transition-all cursor-pointer"
                      disabled={formLoading}
                    >
                      <option value="UNIDAD" className="bg-white text-slate-800">Unidades (uds)</option>
                      <option value="KILOGRAMO" className="bg-white text-slate-800">Kilogramos (kg)</option>
                    </select>
                  </div>

                  {/* Categoría ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Categoría Asociada *
                    </label>
                    <select
                      value={categoriaId}
                      onChange={(e) => setCategoriaId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-805 rounded-xl outline-none transition-all cursor-pointer"
                      disabled={formLoading}
                    >
                      <option value="" disabled className="bg-white text-slate-400">Selecciona una categoría</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id} className="bg-white text-slate-800">
                          {category.nombre}
                        </option>
                      ))}
                    </select>
                    {categories.length === 0 && (
                      <span className="text-[10px] text-rose-500 block mt-0.5">
                        * Debes crear al menos una categoría primero.
                      </span>
                    )}
                  </div>
                </div>

                {/* Descripción */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                     Descripción del Producto (Opcional)
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Detalles sobre características, marca o almacenamiento..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-800 placeholder-slate-450 rounded-xl outline-none transition-all resize-none"
                    disabled={formLoading}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-750 hover:bg-slate-100 transition-colors cursor-pointer"
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading || categories.length === 0}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {formLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    editId ? 'Guardar Cambios' : 'Registrar Producto'
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Products;
