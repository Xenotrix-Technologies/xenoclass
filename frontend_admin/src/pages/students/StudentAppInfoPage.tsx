import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { Loader2 } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const StudentAppInfoPage: React.FC = () => {
  const [appInfoList, setAppInfoList] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [filters, setFilters] = useState({
    isStudent: true,
    appVersion: '',
    fromDate: '',
    toDate: '',
    nameSearch: '',
    isBatteryOptimized: null as boolean | null,
    page: 1,
    pageSize: 10,
  });

  useEffect(() => {
    getAppInfoList();
  }, [filters.page]);

  const getAppInfoList = async () => {
    try {
      setIsLoading(true);
      const data: any = await reportService.getAppInfoList(filters);
      if (Array.isArray(data) && data.length >= 2) {
        setAppInfoList(data[1] || []);
        const totalCount = data[0]?.[0]?.total_count || data[1]?.length || 0;
        setTotalPages(Math.ceil(totalCount / filters.pageSize) || 1);
      } else if (Array.isArray(data)) {
        setAppInfoList(data);
        setTotalPages(Math.ceil(data.length / filters.pageSize) || 1);
      } else {
        setAppInfoList([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching app info list:', error);
      setAppInfoList([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    getAppInfoList();
  };

  const nextPage = () => {
    if (filters.page < totalPages) {
      setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const previousPage = () => {
    if (filters.page > 1) {
      setFilters((prev) => ({ ...prev, page: prev.page - 1 }));
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Student App Info</h1>

      {/* ------------------------------------------------------------- */}
      {/* FILTERS CARD (Matching student-appinfo.component.html) */}
      {/* ------------------------------------------------------------- */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg shadow-xs border border-gray-200">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <input
            type="text"
            value={filters.nameSearch}
            onChange={(e) => setFilters({ ...filters, nameSearch: e.target.value })}
            placeholder="Search by Name"
            className="border border-gray-300 p-2 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          <input
            type="text"
            value={filters.appVersion}
            onChange={(e) => setFilters({ ...filters, appVersion: e.target.value })}
            placeholder="App Version"
            className="border border-gray-300 p-2 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
            placeholder="From Date"
            className="border border-gray-300 p-2 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
            placeholder="To Date"
            className="border border-gray-300 p-2 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isStudentCheck"
              checked={filters.isStudent}
              onChange={(e) => setFilters({ ...filters, isStudent: e.target.checked })}
              className="mr-2 h-4 w-4 text-sky-600 rounded-sm border-gray-300 focus:ring-sky-500"
            />
            <label htmlFor="isStudentCheck" className="text-xs font-medium text-gray-700">
              Is Student
            </label>
          </div>

          <button
            onClick={handleApplyFilters}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-xs font-semibold shadow-xs"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DATA TABLE (Matching student-appinfo.component.html) */}
      {/* ------------------------------------------------------------- */}
      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs leading-normal">
              <th className="py-3 px-6 text-left">First Name</th>
              <th className="py-3 px-6 text-left">Last Name</th>
              <th className="py-3 px-6 text-left">Email</th>
              <th className="py-3 px-6 text-left">Phone Number</th>
              <th className="py-3 px-6 text-left">App Version</th>
              <th className="py-3 px-6 text-left">Created At</th>
              <th className="py-3 px-6 text-left">Battery Optimized</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-xs font-light divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center">
                  <LoadingSpinner message="Loading app info..." size="md" />
                </td>
              </tr>
            ) : appInfoList.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400 italic">
                  No app info records found.
                </td>
              </tr>
            ) : (
              appInfoList.map((info, idx) => (
                <tr key={info.id || idx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-6 font-medium text-gray-800">{info.First_Name || '-'}</td>
                  <td className="py-3 px-6 font-medium text-gray-800">{info.Last_Name || '-'}</td>
                  <td className="py-3 px-6">{info.Email || '-'}</td>
                  <td className="py-3 px-6 font-mono">{info.Phone_Number || '-'}</td>
                  <td className="py-3 px-6 font-mono font-semibold text-blue-600">{info.app_version || '1.0.0'}</td>
                  <td className="py-3 px-6 text-gray-500">
                    {info.created_at
                      ? new Date(info.created_at).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </td>
                  <td className="py-3 px-6">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        info.is_battery_optimized === 1 || info.is_battery_optimized === true
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {info.is_battery_optimized === 1 || info.is_battery_optimized === true ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PAGINATION CONTROLS (Matching student-appinfo.component.html) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={previousPage}
          disabled={filters.page === 1 || isLoading}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <span className="text-xs font-medium text-gray-700">
          Page {filters.page} of {totalPages || 1}
        </span>

        <button
          onClick={nextPage}
          disabled={filters.page >= totalPages || isLoading}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};
