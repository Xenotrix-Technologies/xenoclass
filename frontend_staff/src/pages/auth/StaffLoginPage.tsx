import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export const StaffLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useStaffAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState<string | null>(null);

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  const showToast = (msg: string) => {
    setSnackBarMessage(msg);
    setTimeout(() => {
      setSnackBarMessage(null);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Email validation matching Flutter login_page.dart line 175-195
    if (!email.includes('@') || !email.includes('.')) {
      showToast('Invalid Email Entered');
      return;
    }

    setLoading(true);
    setSnackBarMessage(null);

    try {
      await login(email.trim(), password);
      navigate('/chat');
    } catch (err: any) {
      console.error(err);
      const errMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.errors?.message ||
        err.response?.data?.message ||
        'Invalid credentials. Please check your email and password.';
      showToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center px-6 py-8 relative font-sans"
      style={{
        background: 'linear-gradient(180deg, #1C2348 0%, #2B83D5 100%)',
      }}
    >
      {/* Flutter SnackBar Toast notification */}
      {snackBarMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#323232] text-white px-5 py-2.5 rounded-lg text-xs font-medium shadow-2xl transition-all flex items-center gap-2">
          <span>{snackBarMessage}</span>
        </div>
      )}

      <div className="w-full max-w-[420px] flex flex-col justify-center space-y-6">
        {/* 1. Header Logo */}
        <div className="w-full flex justify-start">
          <div className="bg-white rounded-2xl px-4 py-2.5 shadow-lg inline-block">
            <img
              src="/assets/images/xenoclass_logo.png"
              alt="Xenoclass"
              className="h-10 w-auto object-contain"
              onError={(e: any) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/assets/images/logo.png';
              }}
            />
          </div>
        </div>

        {/* 2. Login Title (Matching TextStyle(fontSize: 26.sp, fontWeight: FontWeight.w700, color: ColorResources.colorwhite)) */}
        <div>
          <h1 className="text-[26px] font-bold text-white tracking-tight">Login</h1>
        </div>

        {/* 3. Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email TextField (Matching textFieldWidget(height: 54.h, labelText: 'Email')) */}
          <div>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full h-[54px] px-3.5 bg-white text-[#212A36] text-[14px] font-medium rounded-xl border border-[#BAC1CA] focus:border-[#4B5768] focus:outline-none placeholder:text-[#808B9A] transition-colors"
            />
          </div>

          {/* Password TextField (Matching textFieldWidget(height: 54.h, labelText: 'Password', obscureText: true)) */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full h-[54px] pl-3.5 pr-11 bg-white text-[#212A36] text-[14px] font-medium rounded-xl border border-[#BAC1CA] focus:border-[#4B5768] focus:outline-none placeholder:text-[#808B9A] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#808B9A] hover:text-[#212A36] focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Forgot Password Link (Matching TextButton -> "Forgot Password?" color: colorwhite, fontSize: 14.sp, fontWeight: FontWeight.w700) */}
          <div className="pt-1">
            <Link
              to="/forgot-password"
              className="text-[14px] font-bold text-white hover:underline transition-all inline-block"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Continue Button (Matching buttonWidget(height: 45, width: Get.width, text: 'Continue', borderRadius: 30)) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className={`w-full h-[45px] rounded-[30px] text-[16px] font-bold transition-all flex items-center justify-center space-x-2 ${
                isFormValid
                  ? 'bg-[#2B83D5] hover:bg-[#1863D3] text-white shadow-md active:scale-[0.99] cursor-pointer'
                  : 'bg-[#BAC1CA] text-[#F4F7FA] cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Continue</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
