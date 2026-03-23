// src/components/RegisterPublic.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RegisterPublic = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isStrongPassword = (pwd) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(pwd);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStrongPassword(form.password)) {
      toast.error('Password must be ≥8 chars with uppercase, lowercase, number, and symbol.');
      return;
    }
    setLoading(true);
    try {
const res = await fetch('/api/auth/register-public', {
            method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      
      toast.success('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1421] p-4">
      <div className="w-full max-w-md bg-[#161b22] rounded-xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-center text-cyan-400 mb-6">Public Signup</h2>
        <p className="text-gray-400 text-center mb-6">Viewer access only (no cloud connections)</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} className="w-full p-3 bg-[#121a25] text-white rounded" required />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className="w-full p-3 bg-[#121a25] text-white rounded" required />
          <input name="phone" placeholder="Phone (optional)" value={form.phone} onChange={handleChange} className="w-full p-3 bg-[#121a25] text-white rounded" />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} className="w-full p-3 bg-[#121a25] text-white rounded" required />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded font-medium"
          >
            {loading ? 'Creating...' : 'Create Viewer Account'}
          </button>
        </form>
        <p className="text-center mt-4 text-gray-500">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-cyan-400 underline">Sign in</button>
        </p>
      </div>
      <ToastContainer position="top-center" theme="dark" />
    </div>
  );
};

export default RegisterPublic;
