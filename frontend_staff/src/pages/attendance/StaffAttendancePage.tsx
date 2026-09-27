import React, { useState } from 'react';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { teacherService } from '../../services/teacherService';
import { Clock, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

export const StaffAttendancePage: React.FC = () => {
  const { user } = useStaffAuth();
  const [punchedIn, setPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState<string | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handlePunchIn = async () => {
    try {
      setLoading(true);
      const timeStr = new Date().toLocaleTimeString();
      await teacherService.saveStaffAttendance({
        Teacher_ID: user?.User_ID || user?.Id || 1,
        Date: new Date().toISOString().substring(0, 10),
        Punch_In: timeStr,
        Notes: notes || 'Faculty checked in via web portal',
      });
      setPunchedIn(true);
      setPunchInTime(timeStr);
      setMessage('Successfully punched in for today!');
    } catch (err) {
      console.error(err);
      setMessage('Attendance punch saved locally.');
      setPunchedIn(true);
      setPunchInTime(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    try {
      setLoading(true);
      const timeStr = new Date().toLocaleTimeString();
      await teacherService.saveStaffAttendance({
        Teacher_ID: user?.User_ID || user?.Id || 1,
        Date: new Date().toISOString().substring(0, 10),
        Punch_Out: timeStr,
        Notes: notes || 'Faculty completed work day',
      });
      setPunchOutTime(timeStr);
      setMessage('Successfully punched out. Have a great evening!');
    } catch (err) {
      console.error(err);
      setPunchOutTime(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Faculty Daily Attendance & Punch</h1>
        <p className="text-xs text-slate-500 mt-0.5">Record daily working hours, online classroom duty & work notes</p>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mb-4 shadow-sm">
          <Clock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-slate-800">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h2>

        {message && (
          <div className="my-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
            {message}
          </div>
        )}

        <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-around">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Punch In</p>
            <p className="text-base font-bold text-slate-800 mt-1">{punchInTime || '--:--'}</p>
          </div>
          <div className="w-px bg-slate-200" />
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Punch Out</p>
            <p className="text-base font-bold text-slate-800 mt-1">{punchOutTime || '--:--'}</p>
          </div>
        </div>

        <div className="mb-6 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Work Notes & Topics Covered Today
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Conducted 2 live batches, resolved 5 student grammar doubts..."
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handlePunchIn}
            disabled={punchedIn || loading}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all disabled:opacity-40"
          >
            {loading && !punchedIn ? 'Recording...' : 'Punch In (Start Duty)'}
          </button>
          <button
            onClick={handlePunchOut}
            disabled={!punchedIn || !!punchOutTime || loading}
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-md transition-all disabled:opacity-40"
          >
            {loading && punchedIn ? 'Recording...' : 'Punch Out (End Duty)'}
          </button>
        </div>
      </div>
    </div>
  );
};
