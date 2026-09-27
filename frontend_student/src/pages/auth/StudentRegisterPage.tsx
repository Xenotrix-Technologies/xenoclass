import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { authService } from '../../services/authService';
import { User, Mail, Lock, Phone, Briefcase, Loader2, CheckCircle2 } from 'lucide-react';

export const StudentRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useStudentAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [occupationId, setOccupationId] = useState<number>(0);
  const [occupations, setOccupations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOccupations();
  }, []);

  const loadOccupations = async () => {
    try {
      const res = await authService.getOccupations();
      if (Array.isArray(res) && res.length > 0) {
        setOccupations(res);
        setOccupationId(res[0].Occupation_ID || res[0].Id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setLoading(true);
    setError(null);
    try {
      await register({
        Student_Name: name,
        Email: email,
        Password: password,
        Mobile_Number: mobile,
        Occupation_ID: occupationId,
        Status: 1,
      });
      alert('Registration successful! Please sign in with your credentials.');
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create student account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
          <div className="text-center mb-6 flex flex-col items-center">
            <img
              src="/assets/images/xenoclass_logo.png"
              alt="Xenoclass"
              className="h-10 w-auto object-contain mb-3"
              onError={(e: any) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/assets/images/logo.png';
              }}
            />
            <h1 className="text-2xl font-bold text-slate-800">Create Student Profile</h1>
            <p className="text-xs text-slate-500 mt-1">Join thousands of students mastering English</p>
          </div>

          {error && <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Turner"
                required
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Mobile Number</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {occupations.length > 0 && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Occupation / Profession</label>
                <select
                  value={occupationId}
                  onChange={(e) => setOccupationId(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {occupations.map((o) => (
                    <option key={o.Occupation_ID || o.Id} value={o.Occupation_ID || o.Id}>
                      {o.Occupation_Name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign Up & Start Learning</span>}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">
              Already registered?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
