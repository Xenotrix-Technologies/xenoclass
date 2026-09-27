import React, { useState, useEffect } from 'react';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { teacherService } from '../../services/teacherService';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Video, Plus, Play, Calendar, Clock, Loader2 } from 'lucide-react';

export const LiveClassesPage: React.FC = () => {
  const { user } = useStaffAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [courseId, setCourseId] = useState(0);
  const [batchId, setBatchId] = useState(0);
  const [topic, setTopic] = useState('');
  const [classDate, setClassDate] = useState(new Date().toISOString().substring(0, 10));
  const [startTime, setStartTime] = useState('10:00');
  const [meetUrl, setMeetUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLiveSessions();
  }, []);

  const loadLiveSessions = async () => {
    try {
      setLoading(true);
      const teacherId = user?.User_ID || user?.Id;
      const [coursesRes, upRes, compRes] = await Promise.all([
        teacherService.getTeacherCoursesWithBatch(teacherId),
        teacherService.getUpcomingLiveClasses(teacherId),
        teacherService.getCompletedLiveClasses(teacherId),
      ]);
      setCourses(Array.isArray(coursesRes) ? coursesRes : []);
      setUpcoming(Array.isArray(upRes) ? upRes : []);
      setCompleted(Array.isArray(compRes) ? compRes : []);

      if (Array.isArray(coursesRes) && coursesRes.length > 0) {
        setCourseId(coursesRes[0].Course_ID || 0);
        setBatchId(coursesRes[0].Batch_ID || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    try {
      setSaving(true);
      await teacherService.saveLiveClass({
        Teacher_ID: user?.User_ID || user?.Id,
        Course_ID: courseId,
        Batch_ID: batchId,
        Topic: topic,
        Class_Date: classDate,
        Start_Time: startTime,
        Meet_Url: meetUrl || `https://meet.google.com/new`,
        Status: 1,
      });
      setIsModalOpen(false);
      setTopic('');
      setMeetUrl('');
      loadLiveSessions();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Live Class Topic',
      accessor: (item) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{item.Topic || item.Course_Name || 'Live Session'}</p>
            <p className="text-xs text-slate-400">Batch: {item.Batch_Name || 'General Cohort'}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Date & Time',
      accessor: (item) => (
        <div className="text-xs text-slate-600 space-y-0.5">
          <p className="font-medium text-slate-800">{item.Class_Date || item.Date}</p>
          <p className="text-slate-400">{item.Start_Time || '10:00 AM'}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (item) => (
        <Badge variant={item.Status === 1 ? 'success' : 'neutral'}>
          {item.Status === 1 ? 'Scheduled / Live' : 'Completed'}
        </Badge>
      ),
    },
    {
      header: 'Meeting Room',
      className: 'text-right',
      render: (item) => (
        <a
          href={item.Meet_Url || 'https://meet.google.com/new'}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Launch Classroom</span>
        </a>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Live Classes & Virtual Meet Rooms</h1>
          <p className="text-xs text-slate-500 mt-0.5">Host live video sessions, Google Meets & interactive discussions</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Live Class</span>
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-800">Upcoming Live Sessions</h2>
        <DataTable columns={columns} data={upcoming} loading={loading} emptyMessage="No live classes scheduled for today." />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Live Class">
        <form onSubmit={handleSaveClass} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Class Topic / Title
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Masterclass: IELTS Speaking Part 2"
              required
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Course</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              >
                {courses.map((c) => (
                  <option key={c.Course_ID} value={c.Course_ID}>
                    {c.Course_Name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Batch</label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              >
                {courses.map((c) => (
                  <option key={c.Batch_ID} value={c.Batch_ID}>
                    {c.Batch_Name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Class Date</label>
              <input
                type="date"
                value={classDate}
                onChange={(e) => setClassDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Meeting URL (Google Meet / Zoom / Custom)
            </label>
            <input
              type="url"
              value={meetUrl}
              onChange={(e) => setMeetUrl(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md flex items-center space-x-2 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Publish Live Class</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
