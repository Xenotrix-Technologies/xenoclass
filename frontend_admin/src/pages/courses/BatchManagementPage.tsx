import React, { useState, useEffect } from 'react';
import { courseService } from '../../services/courseService';
import { userService } from '../../services/userService';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Plus, Edit2, Trash2, Layers, Clock, Users, Loader2 } from 'lucide-react';

export const BatchManagementPage: React.FC = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any | null>(null);

  // Form state
  const [batchName, setBatchName] = useState('');
  const [courseId, setCourseId] = useState<number>(0);
  const [teacherId, setTeacherId] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [maxStudents, setMaxStudents] = useState(30);
  const [status, setStatus] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [batchesRes, coursesRes, usersRes] = await Promise.all([
        courseService.getAllBatches(),
        courseService.getCourseNames(),
        userService.searchUsers({ User_Type_Id: 3 }),
      ]);
      setBatches(Array.isArray(batchesRes) ? batchesRes : []);
      setCourses(Array.isArray(coursesRes) ? coursesRes : []);
      setFaculty(Array.isArray(usersRes) ? usersRes : []);
    } catch (err) {
      console.error('Failed to load batch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (batch?: any) => {
    if (batch) {
      setEditingBatch(batch);
      setBatchName(batch.Batch_Name || '');
      setCourseId(batch.Course_ID || 0);
      setTeacherId(batch.Teacher_ID || batch.User_ID || 0);
      setStartDate(batch.Start_Date?.substring(0, 10) || '');
      setEndDate(batch.End_Date?.substring(0, 10) || '');
      setTimeSlot(batch.Time_Slot || '');
      setMaxStudents(batch.Max_Students || 30);
      setStatus(batch.Status ?? 1);
    } else {
      setEditingBatch(null);
      setBatchName('');
      setCourseId(courses[0]?.Course_ID || 0);
      setTeacherId(faculty[0]?.User_ID || faculty[0]?.Id || 0);
      setStartDate('');
      setEndDate('');
      setTimeSlot('10:00 AM - 11:00 AM');
      setMaxStudents(30);
      setStatus(1);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName.trim()) return;
    try {
      setSaving(true);
      const payload = {
        Batch_ID: editingBatch ? editingBatch.Batch_ID : 0,
        Batch_Name: batchName,
        Course_ID: courseId,
        Teacher_ID: teacherId,
        Start_Date: startDate,
        End_Date: endDate,
        Time_Slot: timeSlot,
        Max_Students: maxStudents,
        Status: status,
      };
      await courseService.saveBatch(payload);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to save batch:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this batch?')) return;
    try {
      await courseService.deleteBatch(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete batch:', err);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Batch Name',
      accessor: (item) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{item.Batch_Name}</p>
            <p className="text-xs text-slate-400">{item.Course_Name || 'General Course'}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Instructor',
      accessor: (item) => (
        <span className="text-sm font-medium text-slate-700">
          {item.Teacher_Name || item.User_Name || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Time Slot',
      accessor: (item) => (
        <div className="flex items-center text-xs text-slate-600 space-x-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{item.Time_Slot || '10:00 AM - 11:00 AM'}</span>
        </div>
      ),
    },
    {
      header: 'Capacity',
      accessor: (item) => (
        <div className="flex items-center text-xs text-slate-600 space-x-1">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{item.Max_Students || 30} max</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (item) => (
        <Badge variant={item.Status === 1 ? 'success' : 'neutral'}>
          {item.Status === 1 ? 'Active' : 'Completed'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => handleOpenModal(item)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(item.Batch_ID)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Batch Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Schedule student cohorts, time slots & instructor assignments</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Batch</span>
        </button>
      </div>

      <DataTable columns={columns} data={batches} loading={loading} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBatch ? 'Edit Batch' : 'Create New Batch'}
        maxWidth="xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Batch Name
            </label>
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="e.g. OET Morning Cohort A"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Course
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {courses.map((c) => (
                  <option key={c.Course_ID} value={c.Course_ID}>
                    {c.Course_Name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Assigned Instructor
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value={0}>Select Faculty</option>
                {faculty.map((f) => (
                  <option key={f.User_ID || f.Id} value={f.User_ID || f.Id}>
                    {f.User_Name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Time Slot
              </label>
              <input
                type="text"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="10:00 AM - 11:30 AM"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Max Student Limit
              </label>
              <input
                type="number"
                value={maxStudents}
                onChange={(e) => setMaxStudents(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editingBatch ? 'Update Batch' : 'Save Batch'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
