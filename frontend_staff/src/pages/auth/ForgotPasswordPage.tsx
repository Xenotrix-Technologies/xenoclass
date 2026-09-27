import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState<string | null>(null);

  const isFormValid = email.trim().length > 0;

  const showToast = (msg: string) => {
    setSnackBarMessage(msg);
    setTimeout(() => {
      setSnackBarMessage(null);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (!email.includes('@') || !email.includes('.')) {
      showToast('Invalid Email Entered');
      return;
    }

    setLoading(true);
    setSnackBarMessage(null);

    try {
      await authService.generateForgotPassword(email.trim());
      showToast('Verification code sent to your email');
      setTimeout(() => {
        navigate('/change-password');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to send verification code.');
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
      {snackBarMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#323232] text-white px-5 py-2.5 rounded-lg text-xs font-medium shadow-2xl transition-all flex items-center gap-2">
          <span>{snackBarMessage}</span>
        </div>
      )}

      <div className="w-full max-w-[420px] flex flex-col justify-center space-y-6">
        <Link
          to="/login"
          className="inline-flex items-center text-xs font-bold text-white/80 hover:text-white mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Login
        </Link>

        <div>
          <h1 className="text-[26px] font-bold text-[#E5F0FF] tracking-tight">
            Verify Your Email
          </h1>
          <p className="text-[14px] text-[#BAC1CA] mt-2 font-normal">
            Please enter your email address to reset your password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full h-[54px] pl-3.5 pr-11 bg-white text-[#212A36] text-[14px] font-medium rounded-xl border border-[#BAC1CA] focus:border-[#4B5768] focus:outline-none placeholder:text-[#808B9A] transition-colors"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#808B9A] pointer-events-none">
              <Mail className="w-5 h-5" />
            </div>
          </div>

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
                  <span>Sending Code...</span>
                </>
              ) : (
                <span>Send Verification Code</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
