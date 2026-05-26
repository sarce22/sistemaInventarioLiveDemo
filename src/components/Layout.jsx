import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { 
  LayoutGrid, 
  Package, 
  FolderKanban, 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon,
  ShieldCheck,
  UserPlus,
  ShoppingCart
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar Sesión?',
      text: '¿Está seguro de que desea salir del sistema?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#7c3aed',
      cancelButtonColor: '#71717a',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      heightAuto: false
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate('/login');
      }
    });
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutGrid },
    { name: 'Productos', href: '/productos', icon: Package },
    { name: 'Categorías', href: '/categorias', icon: FolderKanban },
    { name: 'Pedidos', href: '/pedidos', icon: ShoppingCart },
  ];

  // Agregar el enlace de registro de empleados si es administrador
  if (user?.rol === 'ADMIN') {
    navigation.push({ name: 'Registrar Empleado', href: '/usuarios', icon: UserPlus });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-zinc-50/50 text-slate-800 flex flex-col md:flex-row transition-colors duration-300">
      
      {/* MOBILE HEADER */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-white border-b border-zinc-200/60 shadow-sm z-30 transition-colors">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
            ARPA Control
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-slate-500 hover:bg-zinc-100 transition-colors"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* SIDEBAR BACKDROP MOBILE */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-zinc-900/30 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed md:sticky top-0 left-0 bottom-0 z-50 md:z-20
        w-64 bg-white border-r border-zinc-200/60
        flex flex-col justify-between transition-all duration-300 ease-in-out h-screen
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* BRAND & NAVIGATION */}
        <div>
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              {/* Blue box logo with AC */}
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/15">
                AC
              </div>
              <div>
                <span className="font-bold text-base text-slate-800 block tracking-tight leading-none">
                  ARPA Control
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wide mt-1 block">
                  Sistema de Inventario
                </span>
              </div>
            </div>
          </div>

          {/* USER INFO PANEL */}
          <div className="px-4 py-4 mt-2">
            <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/50 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs shrink-0">
                <UserIcon size={20} />
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-sm truncate text-slate-800">{user?.nombre || user?.username}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {user?.rol}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* NAV LINKS */}
          <nav className="px-3 space-y-1.5 mt-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${active 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15' 
                      : 'text-slate-600 hover:bg-zinc-100 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon size={18} className={active ? 'text-white' : 'text-zinc-400'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="p-4 border-t border-zinc-100 space-y-2">
          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50/65 transition-all duration-200 cursor-pointer"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen bg-slate-50 transition-colors duration-300">
        {children}
      </main>
    </div>
  );
};

export default Layout;
