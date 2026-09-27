import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('1');
  const [hidePassword, setHidePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dash');
    } catch (err: any) {
      console.error('Login error:', err);
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.errors?.message ||
        err.response?.data?.message ||
        'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      <div className="w-full relative flex items-center justify-center">
        {/* SVG Curved Gradient Background matching auth.component.html */}
        <svg
          viewBox="0 0 500 150"
          preserveAspectRatio="none"
          style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="myGradient" gradientTransform="rotate(90)">
              <stop offset="5%" stopColor="#8ec5fc" />
              <stop offset="95%" stopColor="#e0c3fc" />
            </linearGradient>
          </defs>
          <path
            d="M208.09,0.00 C152.70,67.10 262.02,75.98 200.80,150.00 L0.00,150.00 L0.00,0.00 Z"
            style={{ stroke: 'none', fill: "url('#myGradient')" }}
          />
        </svg>

        {/* Top Header Placeholder matching Angular */}
        <div className="absolute top-0 p-8 flex justify-between w-full items-center">
          {/* Brand header */}
        </div>

        {/* Form Card Container matching Angular mezzo & card dimensions */}
        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col my-auto">
          <div className="flex items-center justify-center bg-cover bg-center">
            <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-6 sm:p-10 w-[34rem] max-w-[90vw] border border-gray-100">
              <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <div className="flex gap-4 mb-5 justify-center items-center">
                  <img
                    className="h-16 w-auto object-contain"
                    src="/assets/images/xenoclass_logo.png"
                    alt="Xenoclass"
                    onError={(e: any) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/assets/images/logo.png';
                    }}
                  />
                </div>
                <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                  Login to Your Account
                </h2>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 flex items-start space-x-2 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
                {/* Email Input */}
                <div className="w-full mb-4">
                  <label className="block text-sm font-medium leading-6 text-gray-900 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                      Password
                    </label>
                  </div>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      maxLength={20}
                      type={hidePassword ? 'password' : 'text'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      className="block w-full pr-10 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                    <button
                      type="button"
                      onClick={() => setHidePassword(!hidePassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-400 hover:text-gray-600"
                      aria-label={hidePassword ? 'Show password' : 'Hide password'}
                    >
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {hidePassword ? (
                          <>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </>
                        ) : (
                          <>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>

                  {/* Login Button */}
                  <div className="mt-4">
                    <button
                      type="submit"
                      disabled={loading || !email || !password}
                      className="flex w-full justify-center rounded-md disabled:bg-blue-200 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Logging in...</span>
                        </div>
                      ) : (
                        'Login'
                      )}
                    </button>
                  </div>
                </div>

                <p className="mt-8 text-center text-xs text-gray-400">
                  {/* Additional content or links can be placed here */}
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
