import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Loader2 } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

// Register Chart.js plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  Filler
);

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);

  // Chart Data States matching Angular
  const [barChartData, setBarChartData] = useState<any>({ labels: [], datasets: [] });
  const [barChartData2, setBarChartData2] = useState<any>({ labels: [], datasets: [] });
  const [lineChartData, setLineChartData] = useState<any>({ labels: [], datasets: [] });
  const [studentStatusData, setStudentStatusData] = useState<any>({ labels: [], datasets: [] });
  const [studentPerformanceData, setStudentPerformanceData] = useState<any>({ labels: [], datasets: [] });

  // Summary KPI Metrics
  const [summaryMetrics, setSummaryMetrics] = useState({
    activeStudents7Days: 0,
    newRegistrationsToday: 0,
    newRegistrations7Days: 0,
    courseCompletionRate: 0,
    batchAttendanceRate: 0,
  });

  const allMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data: any = await userService.getDashboard();

      if (Array.isArray(data)) {
        // 1. Popular Course (Bar Chart)
        if (data[0] && Array.isArray(data[0])) {
          setBarChartData({
            labels: data[0].map((ele: any) => ele.Course_Name || 'Course'),
            datasets: [
              {
                data: data[0].map((ele: any) => ele.Enrollment_Count || 0),
                label: 'Total Count',
                backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#7E57C2'],
                hoverBackgroundColor: ['#64B5F6', '#81C784', '#FFB74D', '#EF9A9A', '#9575CD'],
                borderRadius: 6,
              },
            ],
          });
        }

        // 2. Month Wise Student Enrollment (Bar Chart)
        if (data[1] && Array.isArray(data[1])) {
          setBarChartData2({
            labels: allMonths,
            datasets: [
              {
                data: allMonths.map((month) => {
                  const item = data[1].find((ele: any) => ele.Month === month);
                  return item ? item.Student_Count : 0;
                }),
                label: 'Student Count',
                backgroundColor: allMonths.map(
                  (_, i) => ['#FFA726', '#EF5350', '#42A5F5', '#66BB6A'][i % 4]
                ),
                hoverBackgroundColor: allMonths.map(
                  (_, i) => ['#FFB74D', '#EF9A9A', '#64B5F6', '#81C784'][i % 4]
                ),
                borderRadius: 6,
              },
            ],
          });
        }

        // 3. Course Wise Monthly Enrollment (Line Chart)
        if (data[2] && Array.isArray(data[2])) {
          processLineChartData(data[2]);
        }

        // 4. Student Status (Pie Chart)
        if (data[3] && Array.isArray(data[3])) {
          setStudentStatusData({
            labels: data[3].map((ele: any) => ele.Status || 'Status'),
            datasets: [
              {
                data: data[3].map((ele: any) => ele.Count || 0),
                backgroundColor: ['#66BB6A', '#EF5350', '#42A5F5', '#FFA726'],
                hoverBackgroundColor: ['#81C784', '#EF9A9A', '#64B5F6', '#FFB74D'],
              },
            ],
          });
        }

        // 5. Top 10 Students (Performance Bar Chart)
        if (data[4] && Array.isArray(data[4])) {
          setStudentPerformanceData({
            labels: data[4].map((ele: any) => `${ele.First_Name || ''} ${ele.Last_Name || ''}`.trim() || 'Student'),
            datasets: [
              {
                data: data[4].map((ele: any) => parseFloat(ele.Avg_Mark || 0).toFixed(2)),
                label: 'Avg Exam Mark',
                backgroundColor: '#7E57C2',
                hoverBackgroundColor: '#9575CD',
                borderRadius: 6,
              },
            ],
          });
        }

        // 6. Summary Metrics
        if (data[5] && data[5][0]) {
          const metrics = data[5][0];
          setSummaryMetrics({
            activeStudents7Days: metrics.Active_Students_7Days || 0,
            newRegistrationsToday: metrics.New_Registrations_Today || 0,
            newRegistrations7Days: metrics.New_Registrations_7Days || 0,
            courseCompletionRate: parseFloat(metrics.Global_Completion_Rate || 0).toFixed(1) as any,
            batchAttendanceRate: parseFloat(metrics.Global_Attendance_Rate || 0).toFixed(1) as any,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const processLineChartData = (data: any[]) => {
    const courses = [...new Set(data.map((item) => item.Course_Name))];
    const colors = [
      '#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#7E57C2',
      '#26A69A', '#D4E157', '#FF7043', '#8D6E63', '#78909C',
    ];

    const datasets = courses.map((course, index) => {
      const courseData = allMonths.map((month) => {
        const item = data.find((d) => d.Course_Name === course && d.Month === month);
        return item ? item.Student_Count : 0;
      });

      return {
        data: courseData,
        label: course,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '33', // 20% opacity fill
        fill: true,
        tension: 0.4,
      };
    });

    setLineChartData({
      labels: allMonths,
      datasets,
    });
  };

  const navigateToDetails = (type: string) => {
    navigate(`/dash/details/${type}`);
  };

  // Chart Options matching Angular dashboard.component.ts
  const barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { font: { size: 12, weight: 'bold' } },
        grid: { color: '#f1f5f9' },
      },
      x: {
        ticks: { font: { size: 11, weight: 'bold' } },
        grid: { display: false },
      },
    },
    plugins: {
      legend: {
        labels: { font: { size: 13, weight: 'bold' } },
      },
    },
    barPercentage: 0.35,
    categoryPercentage: 0.8,
  };

  const lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        grid: { color: '#f1f5f9' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  const pieChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { font: { size: 12, weight: 'bold' } },
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <LoadingSpinner message="Loading live analytics..." size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-5 p-5 justify-center bg-[#f8f9fa] min-h-screen">
      {/* ------------------------------------------------------------- */}
      {/* 1. POPULAR COURSE (Full-Width Bar Chart) */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[480px] flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <h2 className="mb-6 text-lg font-bold text-[#2D3748] flex items-center before:content-[''] before:w-1 before:h-6 before:bg-[#42A5F5] before:rounded-sm before:mr-3">
          Popular Course
        </h2>
        <div className="flex-1 w-full h-full min-h-0">
          <Bar data={barChartData} options={barChartOptions} />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MONTH WISE STUDENT ENROLLMENT (Full-Width Bar Chart) */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[480px] flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <h2 className="mb-6 text-lg font-bold text-[#2D3748] flex items-center before:content-[''] before:w-1 before:h-6 before:bg-[#42A5F5] before:rounded-sm before:mr-3">
          Month Wise Student Enrollment
        </h2>
        <div className="flex-1 w-full h-full min-h-0">
          <Bar data={barChartData2} options={barChartOptions} />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. COURSE WISE MONTHLY ENROLLMENT (Full-Width Line Chart) */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[480px] flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <h2 className="mb-6 text-lg font-bold text-[#2D3748] flex items-center before:content-[''] before:w-1 before:h-6 before:bg-[#42A5F5] before:rounded-sm before:mr-3">
          Course Wise Monthly Enrollment
        </h2>
        <div className="flex-1 w-full h-full min-h-0">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. SECTION DIVIDER (Matching Angular section-divider) */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full text-center my-8 relative before:content-[''] before:absolute before:left-0 before:top-1/2 before:w-full before:h-px before:bg-[#e2e8f0]">
        <span className="bg-[#f8f9fa] px-6 relative z-10 text-[#4a5568] font-bold text-xl uppercase tracking-widest">
          Student Analysis
        </span>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. METRICS GRID (4 Clickable KPI Cards) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full mb-5">
        {/* Active Students */}
        <div
          onClick={() => navigateToDetails('active_students')}
          className="bg-white p-5 rounded-xl text-center shadow-sm border border-[#edf2f7] hover:-translate-y-1 hover:shadow-md hover:bg-slate-50 transition-all duration-300 cursor-pointer flex flex-col justify-center items-center min-h-[160px]"
        >
          <h3 className="m-0 text-[#4a5568] text-xs font-bold uppercase tracking-wider">
            Active Students
          </h3>
          <div className="text-4xl font-black text-[#42A5F5] my-2">
            {summaryMetrics.activeStudents7Days}
          </div>
          <p className="m-0 text-[#718096] text-xs font-medium">Accessed in last 7 days</p>
        </div>

        {/* New Registrations */}
        <div
          onClick={() => navigateToDetails('new_registrations')}
          className="bg-white p-5 rounded-xl text-center shadow-sm border border-[#edf2f7] hover:-translate-y-1 hover:shadow-md hover:bg-slate-50 transition-all duration-300 cursor-pointer flex flex-col justify-center items-center min-h-[160px]"
        >
          <h3 className="m-0 text-[#4a5568] text-xs font-bold uppercase tracking-wider">
            New Registrations
          </h3>
          <div className="text-4xl font-black text-[#42A5F5] my-2">
            {summaryMetrics.newRegistrationsToday}
          </div>
          <p className="m-0 text-[#718096] text-xs font-medium">
            +{summaryMetrics.newRegistrations7Days} this week
          </p>
        </div>

        {/* Course Completion */}
        <div
          onClick={() => navigateToDetails('course_completion')}
          className="bg-white p-5 rounded-xl text-center shadow-sm border border-[#edf2f7] hover:-translate-y-1 hover:shadow-md hover:bg-slate-50 transition-all duration-300 cursor-pointer flex flex-col justify-center items-center min-h-[160px]"
        >
          <h3 className="m-0 text-[#4a5568] text-xs font-bold uppercase tracking-wider">
            Course Completion
          </h3>
          <div className="text-4xl font-black text-[#42A5F5] my-2">
            {summaryMetrics.courseCompletionRate}%
          </div>
          <p className="m-0 text-[#718096] text-xs font-medium">Avg. across all students</p>
        </div>

        {/* Batch Attendance */}
        <div
          onClick={() => navigateToDetails('batch_attendance')}
          className="bg-white p-5 rounded-xl text-center shadow-sm border border-[#edf2f7] hover:-translate-y-1 hover:shadow-md hover:bg-slate-50 transition-all duration-300 cursor-pointer flex flex-col justify-center items-center min-h-[160px]"
        >
          <h3 className="m-0 text-[#4a5568] text-xs font-bold uppercase tracking-wider">
            Batch Attendance
          </h3>
          <div className="text-4xl font-black text-[#42A5F5] my-2">
            {summaryMetrics.batchAttendanceRate}%
          </div>
          <p className="m-0 text-[#718096] text-xs font-medium">Current day average</p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. BOTTOM TWO 50% CHARTS */}
      {/* ------------------------------------------------------------- */}
      {/* Student Status Pie Chart */}
      <div className="w-full lg:w-[calc(50%-10px)] bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px] flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <h2 className="mb-6 text-lg font-bold text-[#2D3748] flex items-center before:content-[''] before:w-1 before:h-6 before:bg-[#42A5F5] before:rounded-sm before:mr-3">
          Student Status
        </h2>
        <div className="flex-1 w-full h-[280px] flex items-center justify-center min-h-0">
          <Pie data={studentStatusData} options={pieChartOptions} />
        </div>
      </div>

      {/* Top 10 Students (Performance Bar Chart) */}
      <div className="w-full lg:w-[calc(50%-10px)] bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px] flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <h2 className="mb-6 text-lg font-bold text-[#2D3748] flex items-center before:content-[''] before:w-1 before:h-6 before:bg-[#42A5F5] before:rounded-sm before:mr-3">
          Top 10 Students (Performance)
        </h2>
        <div className="flex-1 w-full h-full min-h-0">
          <Bar data={studentPerformanceData} options={barChartOptions} />
        </div>
      </div>
    </div>
  );
};
