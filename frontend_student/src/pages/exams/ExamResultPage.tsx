import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Award, CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';

export const ExamResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || { score: 35, total: 40, totalQuestions: 40 };

  const score = state.score || 0;
  const total = state.total || 40;
  const percentage = Math.round((score / (total || 1)) * 100);
  const passed = percentage >= 50;

  return (
    <div className="max-w-xl mx-auto py-12 space-y-6">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
        <div
          className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center ${
            passed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}
        >
          {passed ? <Award className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
        </div>

        <div>
          <span
            className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
              passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {passed ? 'Exam Passed' : 'Needs Practice'}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
            {passed ? 'Congratulations!' : 'Good Effort!'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">Here is your final score summary for this mock test</p>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex justify-around items-center">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Score</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{score} / {total}</p>
          </div>
          <div className="w-px h-10 bg-slate-200" />
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Percentage</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{percentage}%</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            to="/exams"
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center space-x-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>More Exams</span>
          </Link>
          <Link
            to="/my-courses"
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center justify-center space-x-1.5"
          >
            <span>Back to Learning</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
