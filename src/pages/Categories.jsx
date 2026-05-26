import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Swal from 'sweetalert2';
import { 
  FolderPlus, 
  Edit2, 
  Trash2, 
  Layers, 
  FolderCheck,
  Search,
  X
} from 'lucide-react';
import PageHeader from '../components/PageHeader';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [nombre, setNombre] = useState('');
  const [editId, setEditId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await API.get('/categorias');
      if (response.data.status === 'success') {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de carga',
        text: 'No se pudieron obtener las categorías del servidor.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo vacío',
        text: 'El nombre de la categoría es obligatorio.',
        confirmButtonColor: '#7c3aed'
      });
      return;
    }

    setFormLoading(true);
    try {
      if (editId) {
        // Actualizar
        const response = await API.put(`/categorias/${editId}`, { nombre: nombre.trim() });
        if (response.data.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'Actualizado',
            text: 'Categoría actualizada correctamente.',
            timer: 1500,
            showConfirmButton: false
          });
          setEditId(null);
        }
      } else {
        // Crear
        const response = await API.post('/categorias', { nombre: nombre.trim() });
        if (response.data.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'Guardado',
            text: 'Categoría creada correctamente.',
            timer: 1500,
            showConfirmButton: false
          });
        }
      }
      setNombre('');
      fetchCategories();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.response?.data?.message || 'Ya existe una categoría con ese nombre.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditId(category.id);
    setNombre(category.nombre);
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setNombre('');
  };

  const handleDelete = async (id, name) => {
    Swal.fire({
      title: `¿Eliminar "${name}"?`,
      text: '¡Atención! Eliminar esta categoría borrará también todos los productos asociados en cascada según la base de datos.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await API.delete(`/categorias/${id}`);
          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Eliminado',
              text: 'La categoría ha sido eliminada con éxito.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
            fetchCategories();
          }
        } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.response?.data?.message || 'No se pudo eliminar la categoría.',
            confirmButtonColor: '#ef4444'
          });
        }
      }
    });
  };

  // Filtrado de categorías por búsqueda
  const filteredCategories = categories.filter(category => 
    category.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in text-slate-750">
      
      {/* HEADER */}
      <PageHeader 
        title="Categorías" 
        subtitle="Organiza tus productos por departamentos o tipos" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LIST COLUMN (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* SEARCH BAR */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-800 placeholder-slate-450 outline-none transition-all"
            />
          </div>

          {/* TABLE CARD */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
              </div>
            ) : filteredCategories.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">ID</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Nombre de Categoría</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCategories.map((category) => (
                      <tr 
                        key={category.id} 
                        className="hover:bg-slate-50/85 text-slate-700 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-sm text-slate-400">{category.id}</td>
                        <td className="px-6 py-4 font-semibold text-sm text-slate-700">{category.nombre}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(category)}
                              className="p-2 rounded-lg text-violet-600 hover:bg-violet-50 transition-colors cursor-pointer"
                              title="Editar categoría"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(category.id, category.nombre)}
                              className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Eliminar categoría"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <Layers size={48} className="text-slate-300 mb-3" />
                <span>No se encontraron categorías.</span>
              </div>
            )}
          </div>
        </div>

        {/* FORM COLUMN (1/3 width) */}
        <div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shadow-inner">
                {editId ? <FolderCheck size={20} /> : <FolderPlus size={20} />}
              </div>
              <h3 className="font-extrabold text-lg text-slate-800">
                {editId ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Nombre de Categoría *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="ej: Computadoras, Ropa..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-800 placeholder-slate-450 rounded-xl outline-none transition-all"
                  disabled={formLoading}
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {formLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    editId ? 'Guardar Cambios' : 'Crear Categoría'
                  )}
                </button>

                {editId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer bg-transparent"
                  >
                    <X size={16} />
                    Cancelar Edición
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Categories;
