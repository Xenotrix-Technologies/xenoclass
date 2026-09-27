import React, { useState, useEffect } from 'react';
import { courseService, Category } from '../../services/courseService';
import { Edit2, Trash2, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const CategoriesPage: React.FC = () => {
  const [courseCategoryData, setCourseCategoryData] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [entryView, setEntryView] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<Category>({
    Category_ID: 0,
    Category_Name: '',
    Delete_Status: 0,
    Enabled_Status: 1,
  });

  useEffect(() => {
    pageLoad();
  }, []);

  const pageLoad = () => {
    clrCourseCategory();
    searchCourseCategory();
    setEntryView(false);
  };

  const clrCourseCategory = () => {
    setFormData({
      Category_ID: 0,
      Category_Name: '',
      Delete_Status: 0,
      Enabled_Status: 1,
    });
    setSubmitted(false);
  };

  const searchCourseCategory = async () => {
    try {
      setIsLoading(true);
      const rows: any = await courseService.searchCategories('');
      setCourseCategoryData(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCourseCategoryData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createNew = () => {
    clrCourseCategory();
    setEntryView(true);
  };

  const closeClick = () => {
    setEntryView(false);
    setSubmitted(false);
  };

  const editCourseCategory = (item: Category) => {
    setFormData({
      Category_ID: item.Category_ID || 0,
      Category_Name: item.Category_Name || '',
      Delete_Status: item.Delete_Status || 0,
      Enabled_Status: item.Enabled_Status !== undefined ? (Number(item.Enabled_Status) || 0) : 1,
    });
    setSubmitted(false);
    setEntryView(true);
  };

  const saveCourseCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!formData.Category_Name.trim()) {
      return;
    }

    try {
      setIsLoading(true);
      await courseService.saveCategory(formData);
      pageLoad();
    } catch (err: any) {
      console.error('Error saving course category:', err);
      alert(err.response?.data?.error || err.message || 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCourseCategory = async (categoryId: number) => {
    if (!window.confirm('Do you want to delete ?')) return;

    try {
      setIsLoading(true);
      await courseService.deleteCategory(categoryId);
      pageLoad();
    } catch (err: any) {
      console.error('Error deleting course category:', err);
      alert(err.response?.data?.error || err.message || 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const onToggleChange = async (item: Category) => {
    const newStatus = item.Enabled_Status === 1 ? 0 : 1;
    try {
      await courseService.changeCategoryStatus(item.Category_ID, newStatus);
      pageLoad();
    } catch (err) {
      console.error('Error toggling category status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. LIST VIEW (Matching Angular category.component.html) */}
      {/* ------------------------------------------------------------- */}
      {!entryView ? (
        <section className="border border-gray-300 shadow p-6 rounded-lg bg-white">
          <button
            onClick={createNew}
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
          >
            Add Course Category
          </button>

          {isLoading ? (
            <div className="py-12 text-center">
              <LoadingSpinner message="Loading course categories..." size="md" />
            </div>
          ) : courseCategoryData.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm italic">
              No Details Found
            </div>
          ) : (
            <div className="space-y-5 mt-5">
              {courseCategoryData.map((item, index) => (
                <div key={item.Category_ID || index} className="mt-5 border border-gray-300 p-8 rounded-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="w-full">
                      <div className="grid grid-cols-12 items-baseline">
                        <span className="col-span-12 sm:col-span-3 xl:col-span-2 text-lg font-normal text-black/50">
                          Category Name
                        </span>
                        <span className="col-span-12 sm:col-span-9 xl:col-span-10 text-base font-medium leading-7 text-gray-800">
                          {item.Category_Name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 cursor-pointer ml-auto shrink-0">
                      {/* Slide Toggle matching Angular mat-slide-toggle */}
                      <div className="flex items-center gap-2 pr-2">
                        <button
                          type="button"
                          onClick={() => onToggleChange(item)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            item.Enabled_Status === 1 ? 'bg-sky-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              item.Enabled_Status === 1 ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-xs font-semibold text-gray-700 min-w-[55px]">
                          {item.Enabled_Status === 1 ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>

                      {/* Edit Button matching Angular border-[#B8D0DE] bg-[#D9EFF4] h-12 w-12 */}
                      <span
                        onClick={() => editCourseCategory(item)}
                        className="flex justify-center items-center h-12 w-12 p-2 border border-[#B8D0DE] rounded-full bg-[#D9EFF4] hover:bg-[#c3e3ed] text-[#1d4ed8] transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </span>

                      {/* Delete Button matching Angular border-[#E8A0A7] bg-[#F4EDF0] text-[#D11A2A] h-12 w-12 */}
                      <span
                        onClick={() => deleteCourseCategory(item.Category_ID)}
                        className="flex justify-center items-center h-12 w-12 p-2 border border-[#E8A0A7] rounded-full bg-[#F4EDF0] text-[#D11A2A] hover:bg-[#fbdde1] transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* ------------------------------------------------------------- */
        /* 2. FORM VIEW (Matching Angular category.component.html) */
        /* ------------------------------------------------------------- */
        <section className="border border-gray-300 shadow p-6 rounded-lg bg-white">
          <form onSubmit={saveCourseCategory}>
            <div className="mb-4">
              <label className="block text-lg font-medium text-[#0F1035] mb-1">
                Course Category <span className="text-red-700">*</span>
              </label>
              <input
                type="text"
                value={formData.Category_Name}
                onChange={(e) => setFormData({ ...formData, Category_Name: e.target.value })}
                maxLength={50}
                required
                className="mt-1 px-3 py-2 block w-full rounded-md border border-gray-300 shadow-xs focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 text-sm"
              />
              {!formData.Category_Name.trim() && submitted && (
                <span className="text-red-500 text-xs mt-1 block">Category Name is required</span>
              )}
            </div>

            <div className="w-full flex justify-end gap-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={closeClick}
                className="border border-gray-300 hover:bg-gray-500 hover:text-white text-black font-bold py-2 px-4 rounded text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring focus:ring-zinc-500 focus:ring-opacity-50 text-xs transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
};
