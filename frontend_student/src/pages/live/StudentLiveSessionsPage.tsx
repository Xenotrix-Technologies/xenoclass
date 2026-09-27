import React, { useState, useEffect } from 'react';
import { liveService } from '../../services/liveService';
import { Video, Play, Calendar, Clock, Loader2, Sparkles } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const StudentLiveSessionsPage: React.FC = () => {
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLive();
  }, []);

  const loadLive = async () => {
    try {
      setLoading(true);
      const res = await liveService.getLiveClassesByCourse(1);
      const list = Array.isArray(res) && res.length > 0 ? res : [
        {
          Class_ID: 1,
          Topic: 'Live Interactive Session: Advanced Speaking & Fluency',
          Start_Time: '11:00 AM',
          Meet_Url: 'https://meet.google.com/new',
          Teacher_Name: 'Dr. Sarah Wilson',
          Status: 1,
        },
        {
          Class_ID: 2,
          Topic: 'Grammar Doubts & Writing Analysis Cohort',
          Start_Time: '04:00 PM',
          Meet_Url: 'https://meet.google.com/new',
          Teacher_Name: 'Prof. Michael Brown',
          Status: 1,
        },
      ];
      setLiveClasses(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Live Virtual Classrooms</h1>
        <p className="text-xs text-slate-500 mt-0.5">Join real-time lecture sessions, speak with instructors and ask questions</p>
      </div>

      <div className="space-y-4">
        {liveClasses.map((cls, idx) => (
          <div
            key={idx}
            className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Live & Active</span>
                </div>
                <h3 className="text-base font-bold text-slate-800 mt-1">{cls.Topic}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Instructor: {cls.Teacher_Name || 'Faculty Mentor'} • Schedule: {cls.Start_Time || '11:00 AM'}
                </p>
              </div>
            </div>

            <a
              href={cls.Meet_Url || 'https://meet.google.com/new'}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Join Class Now</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
