import React, { useState, useEffect } from 'react';
import { courseService } from '../../services/courseService';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Plus, Edit2, Trash2, BookOpen, Video, FileText, Loader2 } from 'lucide-react';

export const ModuleManagementPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number>(0);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any | null>(null);

  // Form state
  const [moduleName, setModuleName] = useState('');
  const [moduleOrder, setModuleOrder] = useState(1);
  const [status, setStatus] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await courseService.getCourseNames();
      if (Array.isArray(res) && res.length > 0) {
        setCourses(res);
        setSelectedCourseId(res[0].Course_ID);
        loadModules(res[0].Course_ID);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  const loadModules = async (courseId: number) => {
    try {
      setLoading(true);
      const res = await courseService.getCourseModules(courseId);
      setModules(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load modules:', err);
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (id: number) => {
    setSelectedCourseId(id);
    loadModules(id);
  };

  const handleOpenModal = (mod?: any) => {
    if (mod) {
      setEditingModule(mod);
      setModuleName(mod.Course_Module_Name || '');
      setModuleOrder(mod.Module_Order || 1);
      setStatus(mod.Status ?? 1);
    } else {
      setEditingModule(null);
      setModuleName('');
      setModuleOrder(modules.length + 1);
      setStatus(1);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleName.trim() || !selectedCourseId) return;
    try {
      setSaving(true);
      const payload = {
        Course_Module_ID: editingModule ? editingModule.Course_Module_ID : 0,
        Course_ID: selectedCourseId,
        Course_Module_Name: moduleName,
        Module_Order: moduleOrder,
        Status: status,
      };
      await courseService.saveCourseModule(payload);
      setIsModalOpen(false);
      loadModules(selectedCourseId);
    } catch (err) {
      console.error('Failed to save module:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this module?')) return;
    try {
      await courseService.deleteCourseModule(id);
      loadModules(selectedCourseId);
    } catch (err) {
      console.error('Failed to delete module:', err);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Level / Module Title',
      accessor: (item) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{item.Course_Module_Name}</p>
            <p className="text-xs text-slate-400">Order Level: #{item.Module_Order || 1}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (item) => (
        <Badge variant={item.Status === 1 ? 'success' : 'neutral'}>
          {item.Status === 1 ? 'Unlocked / Active' : 'Locked'}
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
            onClick={() => handleDelete(item.Course_Module_ID)}
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
          <h1 className="text-2xl font-bold text-slate-800">Course Curriculum & Modules</h1>
          <p className="text-xs text-slate-500 mt-0.5">Structure lesson levels, topics & study material</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={!selectedCourseId}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all space-x-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Level Module</span>
        </button>
      </div>

      {/* Course Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 whitespace-nowrap">
          Select Course:
        </label>
        <select
          value={selectedCourseId}
          onChange={(e) => handleCourseChange(Number(e.target.value))}
          className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800"
        >
          {courses.map((c) => (
            <option key={c.Course_ID} value={c.Course_ID}>
              {c.Course_Name}
            </option>
          ))}
        </select>
      </div>

      <DataTable columns={columns} data={modules} loading={loading} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingModule ? 'Edit Module' : 'Create Course Module'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Module / Level Title
            </label>
            <input
              type="text"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="e.g. Level 1: Fundamentals of Grammar"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Sequence Order
              </label>
              <input
                type="number"
                value={moduleOrder}
                onChange={(e) => setModuleOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value={1}>Active / Unlocked</option>
                <option value={0}>Locked</option>
              </select>
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
              <span>{editingModule ? 'Update' : 'Save'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
