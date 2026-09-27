import api from './api';

export const reportService = {
  getTeacherLiveClassesReport: async (
    teacherId?: number,
    batchId?: number,
    courseId?: number,
    fromDate?: string,
    toDate?: string,
    page: number = 1,
    pageSize: number = 25
  ) => {
    const response = await api.get('/user/Get_Report_TeacherLiveClasses_By_BatchAndTeacher', {
      params: {
        Teacher_ID: teacherId !== undefined && teacherId !== null ? teacherId.toString() : '0',
        Batch_ID: batchId !== undefined && batchId !== null ? batchId.toString() : '0',
        Course_ID: courseId !== undefined && courseId !== null ? courseId.toString() : '0',
        fromDate: fromDate || '',
        toDate: toDate || '',
        page: page.toString(),
        PageSize: pageSize.toString(),
      },
    });
    return response.data;
  },

  getStudentLiveClassesReport: async (
    studentId?: number,
    batchId?: number,
    courseId?: number,
    fromDate?: string,
    toDate?: string,
    pageNumber: number = 1,
    pageSize: number = 25
  ) => {
    const response = await api.get('/user/Get_Report_StudentLiveClasses_By_BatchAndStudent', {
      params: {
        Student_ID: studentId !== undefined && studentId !== null ? studentId.toString() : '0',
        Batch_ID: batchId !== undefined && batchId !== null ? batchId.toString() : '0',
        Course_ID: courseId !== undefined && courseId !== null ? courseId.toString() : '0',
        Start_Date: fromDate || '',
        End_Date: toDate || '',
        PageNumber: pageNumber.toString(),
        PageSize: pageSize.toString(),
      },
    });
    return response.data;
  },

  getVideoAttendance: async (
    studentId: number = 0,
    courseId?: number,
    contentId?: number,
    month?: string
  ) => {
    const response = await api.get(`/course/Get_VideoAttendance/${studentId || 0}`, {
      params: {
        Course_ID: courseId || '',
        Content_ID: contentId || '',
        Month: month || '',
      },
    });
    return response.data;
  },

  getVideoAttendanceReport: async (arg1?: any, arg2?: any, arg3?: any) => {
    if (typeof arg1 === 'number') {
      return reportService.getVideoAttendance(arg1, arg2, arg3);
    }
    return reportService.getVideoAttendance(0, undefined, undefined, arg1);
  },

  getStaffAttendanceReport: async (params?: {
    Teacher_ID?: number;
    Month?: string | number;
    Year?: string | number;
  }) => {
    const response = await api.get('/teacher/Get_Staff_Attendance_Report', {
      params,
    });
    return response.data;
  },

  getStaffAttendance: async (date?: string) => {
    const response = await api.get('/teacher/Get_Staff_Attendance', {
      params: { date: date || '' },
    });
    return response.data;
  },

  getAppInfoList: async (filters: {
    isStudent: boolean;
    appVersion?: string;
    fromDate?: string;
    toDate?: string;
    nameSearch?: string;
    isBatteryOptimized?: boolean | null;
    page: number;
    pageSize: number;
  }) => {
    const response = await api.get('/student/Get_AppInfo_List/', {
      params: {
        isStudent: filters.isStudent ? '1' : '0',
        appVersion: filters.appVersion || '',
        fromDate: filters.fromDate || '',
        toDate: filters.toDate || '',
        nameSearch: filters.nameSearch || '',
        isBatteryOptimized:
          filters.isBatteryOptimized !== null && filters.isBatteryOptimized !== undefined
            ? filters.isBatteryOptimized ? '1' : '0'
            : '',
        page: filters.page.toString(),
        pageSize: filters.pageSize.toString(),
      },
    });
    return response.data;
  },
};
