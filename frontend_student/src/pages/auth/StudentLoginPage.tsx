import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { Eye, EyeOff, Loader2, AlertCircle, ChevronLeft } from 'lucide-react';

export const StudentLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useStudentAuth();

  // State to switch between Welcome splash (`LoginHomePage`) and Credentials form (`VerificationContentPage`)
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/home');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.errors?.message ||
        'Invalid student email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full font-['Plus_Jakarta_Sans',sans-serif] bg-white flex flex-col justify-between relative overflow-hidden">
      {/* ============================================================= */}
      {/* SCREEN 1: LOGIN HERO PAGE (Exact Match to LoginHomePage.dart) */}
      {/* ============================================================= */}
      {!showForm ? (
        <div
          className="min-h-screen w-full flex flex-col justify-between bg-cover bg-center relative"
          style={{
            backgroundImage: "url('/assets/images/verification_img.jpg')",
          }}
        >
          {/* Top spacer */}
          <div className="p-6">
            <div className="inline-block bg-white rounded-2xl px-4 py-2 shadow-lg">
              <img
                src="/assets/images/xenoclass_logo.png"
                alt="Xenoclass"
                className="h-9 w-auto object-contain"
                onError={(e: any) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assets/images/logo.png';
                }}
              />
            </div>
          </div>

          {/* Bottom Gradient Overlay Container (Matching commonBackgroundLinearColor) */}
          <div className="w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-32 pb-10 px-8 sm:px-12 flex flex-col justify-end">
            <div className="max-w-md mx-auto w-full space-y-6">
              {/* Heading: Begin your learning journey guided by experts (fontSize: 32, w600) */}
              <h1 className="text-[28px] sm:text-[32px] font-semibold text-white leading-tight">
                Begin your learning<br />journey guided by<br />experts
              </h1>

              {/* Elevated Button: Use Phone or Email (Matching elevatedButtonWidget) */}
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="w-full h-[48px] bg-white hover:bg-gray-100 text-[#344054] text-[14px] font-medium rounded-full shadow-lg transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
              >
                <img
                  src="/assets/images/user_logo.png"
                  alt="User"
                  className="w-5 h-5 object-contain"
                  onError={(e: any) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span>Use Phone or Email</span>
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-gray-300">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-white font-bold underline">
                    Register Free
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================= */
        /* SCREEN 2: VERIFICATION CONTENT PAGE (Exact Match to VerificationContentPage.dart) */
        /* ============================================================= */
        <div className="min-h-screen w-full bg-white flex flex-col justify-between px-6 py-6 max-w-md mx-auto">
          <div className="space-y-6 pt-2">
            {/* Top Back Icon */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-9 h-9 rounded-full bg-[#F4F7FA] text-[#6A7487] hover:text-[#1863D3] flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Brand Logo */}
            <div>
              <img
                src="/assets/images/xenoclass_logo.png"
                alt="Xenoclass"
                className="h-12 w-auto object-contain"
                onError={(e: any) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assets/images/logo.png';
                }}
              />
            </div>

            {/* Title: Login in 28px bold */}
            <div>
              <h2 className="text-[28px] font-bold text-[#000000] tracking-tight">Login</h2>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2.5 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field (Matching textFieldWidget) */}
              <div className="space-y-1.5">
                <label className="block text-[16px] font-medium text-[#000000]">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                  required
                  className="w-full h-[54px] px-3.5 bg-white text-[#000000] text-[15px] font-normal rounded-xl border border-[#BAC1CA] focus:bg-white focus:outline-none focus:border-[#000000] transition-colors"
                />
              </div>

              {/* Password Field (Matching passwordTextFieldWidget) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[16px] font-medium text-[#000000]">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[12px] font-semibold text-[#1863D3] hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=""
                    required
                    className="w-full h-[54px] pl-3.5 pr-11 bg-white text-[#000000] text-[15px] font-normal rounded-xl border border-[#BAC1CA] focus:bg-white focus:outline-none focus:border-[#000000] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Bottom Action Area (Matching bottomNavigationBar with Continue button) */}
          <div className="pt-8 pb-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !email || !password}
              className="w-full h-[45px] bg-[#1863D3] hover:bg-[#1A7AE8] text-white text-[16px] font-bold rounded-full transition-all shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Continue</span>
              )}
            </button>

            <div className="text-center pt-4">
              <p className="text-xs text-[#6A7487]">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#1863D3] font-bold hover:underline">
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
