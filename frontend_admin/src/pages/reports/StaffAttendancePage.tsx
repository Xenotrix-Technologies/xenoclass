import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { CalendarX, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const StaffAttendancePage: React.FC = () => {
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);
      const response: any = await reportService.getStaffAttendance(date);
      if (response && response.success && Array.isArray(response.rows)) {
        setAttendanceList(response.rows);
      } else if (Array.isArray(response)) {
        setAttendanceList(response);
      } else {
        setAttendanceList([]);
      }
    } catch (e) {
      console.error('Error fetching staff attendance:', e);
      setAttendanceList([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 h-full w-full bg-white sm:border-gray-200 rounded-xl shadow-xs border border-gray-100 space-y-6">
      {/* Header & Filter Form matching Angular staff-attendance.component.html */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Staff Attendance</h1>
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2 text-xs border border-gray-300 rounded-lg shadow-xs focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all bg-white"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto shadow-xs ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-6">
                Staff Name
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">
                Phone
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">
                Date
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">
                Check In
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">
                Check Out
              </th>
              <th scope="col" className="px-3 py-3.5 text-center text-xs font-semibold text-gray-900">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center">
                  <LoadingSpinner message="Loading records..." size="md" />
                </td>
              </tr>
            ) : attendanceList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <CalendarX className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                  <p className="font-medium text-sm text-gray-600">No records found for this date.</p>
                </td>
              </tr>
            ) : (
              attendanceList.map((record: any, index: number) => (
                <tr key={record.Attendance_ID || index} className="hover:bg-gray-50 transition-colors text-xs">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-xs font-medium text-gray-900 sm:pl-6">
                    {record.First_Name} {record.Last_Name || ''}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-xs text-gray-500 font-mono">
                    {record.PhoneNumber || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-xs text-gray-500">
                    {record.Date
                      ? new Date(record.Date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-xs font-semibold text-green-600">
                    {record.Check_In_Time
                      ? new Date(record.Check_In_Time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })
                      : '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-xs font-semibold text-red-500">
                    {record.Check_Out_Time
                      ? new Date(record.Check_Out_Time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })
                      : 'Not Checked Out'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-xs text-center">
                    <span
                      className={`px-3 py-1 inline-flex text-[11px] leading-5 font-semibold rounded-full w-24 justify-center ${
                        record.Check_Out_Time
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {record.Check_Out_Time ? 'Completed' : 'Working'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
