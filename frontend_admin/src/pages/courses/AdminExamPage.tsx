import React, { useState, useEffect } from 'react';
import { courseService } from '../../services/courseService';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Plus, FileSpreadsheet, Upload, CheckCircle, Loader2 } from 'lucide-react';

export const AdminExamPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Exam Form
  const [examName, setExamName] = useState('');
  const [examDuration, setExamDuration] = useState(30); // minutes
  const [totalMarks, setTotalMarks] = useState(100);
  const [passMarks, setPassMarks] = useState(40);
  const [csvContent, setCsvContent] = useState('');
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
      }
    } catch (err) {
      console.error('Failed to load courses for exam:', err);
    }
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim() || !selectedCourseId) return;
    try {
      setSaving(true);
      const payload = {
        Course_ID: selectedCourseId,
        Exam_Name: examName,
        Duration_Minutes: examDuration,
        Total_Marks: totalMarks,
        Pass_Marks: passMarks,
        Status: 1,
      };
      await courseService.saveExam(payload);
      setIsModalOpen(false);
      alert('Exam created successfully!');
    } catch (err) {
      console.error('Failed to save exam:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim() || !selectedCourseId) return;
    try {
      setSaving(true);
      // Parse CSV into questions array
      const lines = csvContent.trim().split('\n');
      const questions = lines.slice(1).map((line) => {
        const parts = line.split(',');
        return {
          Question_Text: parts[0]?.trim(),
          Option_A: parts[1]?.trim(),
          Option_B: parts[2]?.trim(),
          Option_C: parts[3]?.trim(),
          Option_D: parts[4]?.trim(),
          Correct_Answer: parts[5]?.trim(),
          Marks: Number(parts[6] || 1),
        };
      });

      await courseService.bulkInsertQuestions({
        Course_ID: selectedCourseId,
        Questions: questions,
      });

      setIsBulkOpen(false);
      setCsvContent('');
      alert(`Successfully uploaded ${questions.length} questions!`);
    } catch (err) {
      console.error('Bulk upload failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Exam & Question Bank</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure mock tests, question papers & bulk CSV uploads</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Upload CSV</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Exam</span>
          </button>
        </div>
      </div>

      {/* Course Selector & Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 whitespace-nowrap">
            Selected Course:
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(Number(e.target.value))}
            className="w-80 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-800"
          >
            {courses.map((c) => (
              <option key={c.Course_ID} value={c.Course_ID}>
                {c.Course_Name}
              </option>
            ))}
          </select>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-start space-x-3">
          <FileSpreadsheet className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-950 space-y-1">
            <p className="font-semibold">CSV Question Bank Format Instructions:</p>
            <p className="font-mono text-slate-600">Question_Text,Option_A,Option_B,Option_C,Option_D,Correct_Option(A/B/C/D),Marks</p>
          </div>
        </div>
      </div>

      {/* Create Exam Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Exam Paper"
      >
        <form onSubmit={handleSaveExam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Exam Title
            </label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="e.g. OET Mock Exam - Reading Section"
              required
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Duration (Mins)
              </label>
              <input
                type="number"
                value={examDuration}
                onChange={(e) => setExamDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Total Marks
              </label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Pass Marks
              </label>
              <input
                type="number"
                value={passMarks}
                onChange={(e) => setPassMarks(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
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
              <span>Save Exam</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk CSV Modal */}
      <Modal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Bulk Insert Questions via CSV"
        maxWidth="2xl"
      >
        <form onSubmit={handleBulkUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Paste CSV Data (Header: Question,OptionA,OptionB,OptionC,OptionD,Answer,Marks)
            </label>
            <textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              rows={8}
              placeholder="Question,Option A,Option B,Option C,Option D,A,1&#10;What is a noun?,Person or thing,Action,Describing word,Connector,A,1"
              required
              className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBulkOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Process Upload</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
