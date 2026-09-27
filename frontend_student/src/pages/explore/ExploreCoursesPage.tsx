import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { Search, BookOpen, Star, Filter, Loader2 } from 'lucide-react';
import { R2_PUBLIC_URL } from '../../config/constants';

export const ExploreCoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses('');
  }, []);

  const loadCourses = async (keyword: string) => {
    try {
      setLoading(true);
      const res = await courseService.searchCourses(keyword);
      setCourses(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCourses(search);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Explore Course Catalog</h1>
        <p className="text-xs text-slate-500 mt-0.5">Find the perfect English curriculum tailored to your goals</p>
      </div>

      {/* Search Header */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by course topic (e.g. OET, Grammar, Fluency)..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-2xl shadow-md shadow-blue-500/20"
        >
          Search
        </button>
      </form>

      {/* Courses List */}
      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <span className="text-xs font-medium text-slate-400">Loading catalog...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between"
            >
              <div className="h-44 bg-slate-100 relative overflow-hidden">
                {c.Image_Url ? (
                  <img
                    src={c.Image_Url.startsWith('http') ? c.Image_Url : `${R2_PUBLIC_URL}${c.Image_Url}`}
                    alt={c.Course_Name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-2xl">
                    {c.Course_Name?.charAt(0) || 'E'}
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-800 shadow-xs">
                  ₹{c.Amount || 3999}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    {c.Course_Category_Name || 'Curriculum'}
                  </span>
                  <h3 className="text-base font-bold text-slate-800 mt-2">{c.Course_Name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {c.Description || 'Complete master training program with structured daily assignments.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-xs text-amber-500 font-semibold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>4.9</span>
                  </div>
                  <button
                    onClick={() => navigate(`/courses/${c.Course_ID || 1}`)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                  >
                    View Course
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
