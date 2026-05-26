import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { LogIn, User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import loginIllustration from '../assets/login_illustration.png';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos vacíos',
        text: 'Por favor complete todos los campos.',
        confirmButtonColor: '#7c3aed',
      });
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      
      Toast.fire({
        icon: 'success',
        title: '¡Bienvenido al sistema!'
      });

      navigate('/');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error de autenticación',
        text: err.message || 'Contraseña o usuario incorrectos.',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white overflow-hidden font-sans">
      {/* LEFT COLUMN: FORM */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-6 sm:p-10 md:p-16 min-h-screen bg-white">
        {/* Brand Header */}
        <div className="flex items-center gap-2 mb-8 md:mb-0">
          <div className="grid grid-cols-2 gap-1 w-6 h-6">
            <div className="bg-violet-600 rounded-sm"></div>
            <div className="bg-violet-500 rounded-sm"></div>
            <div className="bg-violet-500 rounded-sm"></div>
            <div className="bg-amber-500 rounded-sm"></div>
          </div>
          <span className="font-extrabold text-lg text-slate-800 tracking-tight">
            ARPA Control
          </span>
        </div>

        {/* Centered Login Block */}
        <div className="max-w-md w-full mx-auto my-auto py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Bienvenido de nuevo
            </h2>
            <p className="text-slate-500 text-sm mt-1.5">
              Por favor, ingresa tus datos de acceso
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all text-sm"
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all text-sm"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end text-xs font-semibold pt-1">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  Swal.fire({
                    title: 'Recuperar Contraseña',
                    text: 'Por favor, contacta al administrador del sistema para restablecer tu contraseña.',
                    icon: 'info',
                    confirmButtonColor: '#1A365D',
                    heightAuto: false
                  });
                }}
                className="text-violet-600 hover:text-violet-750 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-3">
              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white font-semibold rounded-xl shadow-md shadow-violet-650/10 cursor-pointer disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </div>
          </form>


        </div>

        {/* Bottom space to balance header */}
        <div className="hidden md:block text-[11px] text-slate-400 font-medium">
          © {new Date().getFullYear()} ARPA Control. Todos los derechos reservados.
        </div>
      </div>

      {/* RIGHT COLUMN: ILLUSTRATION */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-violet-600 via-violet-500 to-violet-700 items-center justify-center p-12 lg:p-16 relative">
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
        <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center">
          <img
            src={loginIllustration}
            alt="ARPA Control Support"
            className="w-full max-w-sm object-contain rounded-3xl shadow-2xl border border-white/10 transform hover:scale-[1.02] transition-transform duration-500"
          />
          <div className="mt-8 text-white max-w-xs">
            <h3 className="text-lg font-bold">Gestión Eficiente de Inventario</h3>
            <p className="text-violet-100 text-xs mt-2 leading-relaxed">
              Monitorea stock crítico, gestiona pedidos de reabastecimiento y descarga reportes detallados en segundos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
