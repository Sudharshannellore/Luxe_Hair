import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Scissors } from 'lucide-react';

const Register = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    image: null,
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value, files } = e.target;
    setFormData({
      ...formData,
      [id]: files ? files[0] : value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key]) data.append(key, formData[key]);
      });

      const response = await axios.post(`${API_URL}/user/register`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 201) {
        const { token, user, message } = response.data;
        localStorage.setItem('userToken', token);
        localStorage.setItem('userInfo', JSON.stringify(user));

        toast.success(message, {
          position: 'top-right',
          autoClose: 2000,
          theme: 'colored',
          transition: Bounce,
        });

        setTimeout(() => navigate('/'), 1500);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong!', {
        position: 'top-right',
        autoClose: 2000,
        theme: 'colored',
        transition: Bounce,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-900 via-stone-800 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/30 via-transparent to-transparent blur-3xl opacity-20" />

      <div className="relative z-10 bg-stone-900/80 backdrop-blur-xl border border-stone-700 p-8 rounded-3xl shadow-2xl w-11/12 sm:w-4/5 md:w-2/3 lg:w-1/2">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Scissors className="text-amber-600 w-8 h-8" />
          <h1 className="text-3xl md:text-4xl font-bold text-amber-600 tracking-wide">
            Luxe Hair Register
          </h1>
        </div>

        <ToastContainer />

        {/* Profile Image */}
        <div className="flex flex-col items-center mb-6">
          {formData.image ? (
            <div className="flex flex-col items-center gap-2">
              {formData.image.type.startsWith('image/') && (
                <img
                  src={URL.createObjectURL(formData.image)}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover border border-stone-700"
                />
              )}
              <span className="text-amber-50">{formData.image.name}</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, image: null })}
                className="text-red-400 underline text-sm"
              >
                Remove
              </button>
            </div>
          ) : (
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="text-amber-50 bg-stone-800/70 border border-stone-700 rounded-lg px-4 py-2 w-full sm:w-64 text-center"
            />
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="username" className="block text-sm text-amber-100 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="w-full px-4 py-2 rounded-lg bg-stone-800/70 border border-stone-700 text-amber-50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600"
              placeholder="Your username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-amber-100 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-4 py-2 rounded-lg bg-stone-800/70 border border-stone-700 text-amber-50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm text-amber-100 mb-1">
              Phone Number
            </label>
            <input
              id="phone"
              type="text"
              className="w-full px-4 py-2 rounded-lg bg-stone-800/70 border border-stone-700 text-amber-50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600"
              placeholder="+91 1234567890"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-amber-100 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-4 py-2 rounded-lg bg-stone-800/70 border border-stone-700 text-amber-50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Submit Button spans full width */}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-stone-900 font-semibold py-3 rounded-xl shadow-lg hover:shadow-amber-500/30 hover:scale-[1.02] transition-transform duration-200"
            >
              Register
            </button>
          </div>
        </form>

        {/* Bottom Link */}
        <p className="mt-5 text-sm text-center text-stone-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-amber-600 hover:text-amber-500 transition-all font-medium"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
