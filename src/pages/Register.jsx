import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { UserPlus, User, Lock, FileText, Shield, ArrowRight } from 'lucide-react';

const Register = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('EMPLEADO');
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
        text: 'El usuario y la contraseña son campos obligatorios.',
        confirmButtonColor: '#7c3aed',
      });
      return;
    }

    setLoading(true);
    try {
      await register(username, password, nombre.trim() || null, rol);
      
      Swal.fire({
        icon: 'success',
        title: '¡Registro exitoso!',
        text: 'Su usuario ha sido creado correctamente. Ahora puede iniciar sesión.',
        confirmButtonColor: '#7c3aed',
      });

      navigate('/login');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error de registro',
        text: err.message || 'El nombre de usuario ya existe o hubo un error.',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-violet-50 via-zinc-50 to-violet-100 px-4 transition-colors duration-300">
      {/* Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-100/30 rounded-full blur-3xl pointer-events-none"></div>

      {/* REGISTER CARD */}
      <div className="w-full max-w-md bg-white border border-zinc-200/60 p-8 rounded-2xl shadow-xl shadow-zinc-100/40 z-10">
        
        {/* BRAND IN CARD */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-violet-500 items-center justify-center text-white font-black text-3xl shadow-lg shadow-violet-600/20 mb-4">
            AC
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Crear Cuenta
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Regístrate en ARPA Control
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
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
                placeholder="ej: Juan Pérez"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all"
                disabled={loading}
              />
            </div>
          </div>

          {/* Username Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
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
                placeholder="ej: juan123"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Contraseña *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock size={18} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all"
                disabled={loading}
              />
            </div>
          </div>

          {/* Rol Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rol
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Shield size={18} />
              </span>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-slate-800 outline-none transition-all cursor-pointer"
                disabled={loading}
              >
                <option value="EMPLEADO">Empleado (Solo Lectura/Escritura básica)</option>
                <option value="ADMIN">Administrador (Control Total)</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-600 active:scale-[0.98] text-white font-semibold rounded-xl shadow-lg shadow-violet-600/10 cursor-pointer disabled:opacity-50 transition-all mt-6"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Crear Cuenta
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center mt-6 pt-6 border-t border-zinc-100">
          <span className="text-slate-400 text-xs">¿Ya tienes cuenta? </span>
          <Link to="/login" className="text-violet-600 hover:text-violet-500 font-semibold text-xs transition-colors">
            Inicia Sesión aquí
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;
