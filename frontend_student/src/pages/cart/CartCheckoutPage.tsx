import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { courseService } from '../../services/courseService';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

export const CartCheckoutPage: React.FC = () => {
  const { cart, removeFromCart, clearCart, totalAmount } = useCart();
  const { isAuthenticated, user } = useStudentAuth();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      setCheckingOut(true);
      for (const item of cart) {
        await courseService.enrollCourse({
          Student_ID: user?.Student_ID || user?.Id || 1,
          Course_ID: item.Course_ID,
        });
      }
      clearCart();
      alert('Enrollment successful! Access your courses now.');
      navigate('/my-courses');
    } catch (err) {
      console.error(err);
      clearCart();
      navigate('/my-courses');
    } finally {
      setCheckingOut(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Explore our wide range of English curricula and enroll in master training batches.
        </p>
        <Link
          to="/explore"
          className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md"
        >
          Explore Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Course Cart & Checkout</h1>
        <p className="text-xs text-slate-500 mt-0.5">Review your selected courses and complete your enrollment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.map((item) => (
            <div
              key={item.Course_ID}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-800">{item.Course_Name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{item.Duration || 'Lifetime access'}</p>
                <p className="text-sm font-extrabold text-blue-600 mt-1">₹{item.Amount}</p>
              </div>
              <button
                onClick={() => removeFromCart(item.Course_ID)}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary Card */}
        <div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">Order Summary</h3>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Items Total ({cart.length})</span>
              <span className="font-semibold">₹{totalAmount}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-100 pt-3">
              <span>Total Payable</span>
              <span className="text-blue-600 font-extrabold">₹{totalAmount}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Complete Enrollment</span>}
            </button>

            <div className="flex items-center justify-center space-x-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>100% Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
