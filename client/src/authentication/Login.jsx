import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Scissors } from 'lucide-react';

function Login() {
  const API_URL = import.meta.env.VITE_API_URL;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_URL}/user/login`, {
        email,
        password,
      });

      if (response.status === 200) {
        toast.success(response.data.message, {
          position: 'top-right',
          autoClose: 2000,
          theme: 'colored',
          transition: Bounce,
        });

        localStorage.setItem('userToken', response.data.token);
        localStorage.setItem('userInfo', JSON.stringify(response.data.user));
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message || 'Something went wrong!',
        {
          position: 'top-right',
          autoClose: 2000,
          theme: 'colored',
          transition: Bounce,
        }
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-900 via-stone-800 to-black relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/30 via-transparent to-transparent blur-3xl opacity-20" />
      
      {/* Center Card */}
      <div className="relative z-10 bg-stone-900/70 backdrop-blur-xl border border-stone-700 p-8 rounded-2xl shadow-2xl w-11/12 sm:w-2/3 md:w-1/2 lg:w-1/3">
        
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Scissors className="text-amber-600 w-7 h-7" />
          <h1 className="text-3xl font-semibold text-amber-600 tracking-wide">
            Luxe Hair Login
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm text-amber-100 mb-1">Email</label>
            <input
              id="email"
              type="email"
              className="w-full px-4 py-2 rounded-lg bg-stone-800/70 border border-stone-700 text-amber-50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-amber-100 mb-1">Password</label>
            <input
              id="password"
              type="password"
              className="w-full px-4 py-2 rounded-lg bg-stone-800/70 border border-stone-700 text-amber-50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-stone-900 font-semibold py-2 rounded-lg shadow-lg hover:shadow-amber-500/20 hover:scale-[1.02] transition-transform duration-200"
          >
            Login
          </button>
        </form>

        {/* Bottom Link */}
        <p className="mt-4 text-sm text-center text-stone-400">
          Don’t have an account?{' '}
          <Link
            to="/register"
            className="text-amber-600 hover:text-amber-500 transition-all font-medium"
          >
            Create one
          </Link>
        </p>
      </div>
            <ToastContainer />
    </div>
  );
}

export default Login;
