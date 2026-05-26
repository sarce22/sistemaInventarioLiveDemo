import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { 
  UserPlus, 
  Trash2, 
  User, 
  Shield, 
  Lock, 
  FileText,
  Search, 
  Users as UsersIcon,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import PageHeader from '../components/PageHeader';

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('EMPLEADO');
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await API.get('/auth/users');
      if (response.data.status === 'success') {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de carga',
        text: error.response?.data?.message || 'No se pudieron obtener los usuarios.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'El usuario y la contraseña son obligatorios.',
        confirmButtonColor: '#7c3aed'
      });
      return;
    }

    setFormLoading(true);
    try {
      const response = await API.post('/auth/register', {
        nombre: nombre.trim() || null,
        username: username.trim(),
        password,
        rol
      });

      if (response.data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Usuario registrado',
          text: `El usuario ${username} se ha creado correctamente.`,
          timer: 2000,
          showConfirmButton: false
        });
        
        // Reset form
        setNombre('');
        setUsername('');
        setPassword('');
        setRol('EMPLEADO');
        
        // Refresh list
        fetchUsers();
      }
    } catch (error) {
      console.error('Error registering user:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al registrar',
        text: error.response?.data?.message || 'Hubo un problema al crear la cuenta. Es posible que el usuario ya exista.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (userToDelete) => {
    if (userToDelete.id === currentUser?.id) {
      Swal.fire({
        icon: 'error',
        title: 'Acción no permitida',
        text: 'No puedes eliminar tu propia cuenta de administrador.',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    Swal.fire({
      title: '¿Eliminar usuario?',
      text: `¿Está seguro de que desea eliminar la cuenta de ${userToDelete.nombre || userToDelete.username}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await API.delete(`/auth/users/${userToDelete.id}`);
          if (response.data.status === 'success') {
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'El usuario ha sido eliminado correctamente.',
              timer: 1500,
              showConfirmButton: false
            });
            fetchUsers();
          }
        } catch (error) {
          console.error('Error deleting user:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error al eliminar',
            text: error.response?.data?.message || 'No se pudo eliminar al usuario.',
            confirmButtonColor: '#ef4444'
          });
        }
      }
    });
  };

  const filteredUsers = users.filter(u => 
    (u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.rol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-750">
      {/* Header */}
      <PageHeader 
        title="Gestión de Personal" 
        subtitle="Registra nuevos empleados y administra los accesos del personal al sistema." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Register Form */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-md p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserPlus size={18} className="text-violet-600" />
            Registrar Nuevo Usuario
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Nombre Completo (Opcional)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <FileText size={18} />
                </span>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Carlos Gómez"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none transition-all text-sm text-slate-800 placeholder-slate-400"
                  disabled={formLoading}
                />
              </div>
            </div>

            {/* Usuario */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Nombre de Usuario *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej: cgomez"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none transition-all text-sm text-slate-800 placeholder-slate-400"
                  disabled={formLoading}
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Contraseña Temporal *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none transition-all text-sm text-slate-800 placeholder-slate-400"
                  disabled={formLoading}
                  required
                />
              </div>
            </div>

            {/* Rol */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Rol del Usuario
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Shield size={18} />
                </span>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none transition-all text-sm cursor-pointer text-slate-800"
                  disabled={formLoading}
                >
                  <option value="EMPLEADO">Empleado (Lectura/Escritura básica)</option>
                  <option value="ADMIN">Administrador (Acceso Total)</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={formLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-semibold rounded-xl shadow-lg shadow-amber-500/10 cursor-pointer disabled:opacity-50 transition-all text-sm mt-2"
            >
              {formLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Registrar Personal
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Users List Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-md overflow-hidden flex flex-col h-full">
          {/* List Toolbar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-slate-800 text-sm">
              Personal Registrado ({filteredUsers.length})
            </h3>
            
            {/* Search */}
            <div className="relative max-w-xs w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar personal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto flex-1">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent mb-3" />
                <p className="text-slate-400 text-sm">Cargando personal...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-20 text-center">
                <div className="inline-flex h-12 w-12 rounded-full bg-slate-100 text-slate-400 items-center justify-center mb-3">
                  <UsersIcon size={24} />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">No se encontraron usuarios</h4>
                <p className="text-slate-400 text-xs mt-1">Intente cambiar el término de búsqueda.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100">
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">Nombre</th>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">Usuario</th>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">Rol</th>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">Fecha Registro</th>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((item) => {
                    const isSelf = item.id === currentUser?.id;
                    const dateFormatted = new Date(item.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    });

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-xs">
                              {item.nombre ? item.nombre.substring(0, 2).toUpperCase() : item.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800 text-sm">
                                {item.nombre || <span className="text-slate-450 italic text-xs">Sin nombre registrado</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-650 text-sm font-mono">{item.username}</td>
                        <td className="px-6 py-4">
                          {item.rol === 'ADMIN' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 border border-violet-100 text-violet-600">
                              Administrador
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 border border-slate-150 text-slate-500">
                              Empleado
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{dateFormatted}</td>
                        <td className="px-6 py-4 text-right">
                          {isSelf ? (
                            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-md inline-block border border-slate-200/40">
                              Tú (Actual)
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer inline-flex items-center"
                              title="Eliminar usuario"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
