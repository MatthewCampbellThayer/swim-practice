import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [cell, setCell] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function sendOtp(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.auth.sendOtp(cell);
      setOtpSent(true);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { token, coach } = await api.auth.verifyOtp(cell, code);
      login(token, coach);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏊</div>
          <h1 className="text-3xl font-bold text-blue-900">SwimPractice</h1>
          <p className="text-gray-500 mt-1">Coach Login</p>
        </div>

        {!otpSent ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cell Phone Number</label>
              <input
                type="tel"
                value={cell}
                onChange={e => setCell(e.target.value)}
                placeholder="(314) 555-0100"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <p className="text-gray-600 text-center">Enter the 6-digit code sent to {cell}</p>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-full border border-gray-300 rounded-lg px-4 py-4 text-3xl text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button type="button" onClick={() => setOtpSent(false)} className="w-full text-gray-500 text-sm">
              ← Use a different number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
