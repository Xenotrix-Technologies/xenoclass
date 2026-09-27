import api from './api';

export const contentService = {
  getCourseInfo: async (courseId: number | string) => {
    try {
      const response = await api.get(`/course/Get_Course_Info/${courseId}`);
      return response.data;
    } catch (e) {
      const response = await api.get('/course/Get_Course_Info', {
        params: { courseId },
      });
      return response.data;
    }
  },

  getCourseContentByDay: async (params: {
    courseId: number | string;
    moduleId?: number | string;
    sectionId?: number | string;
    dayId?: number | string;
    isLibrary?: boolean;
    isStudent?: boolean;
  }) => {
    const response = await api.get('/course/Get_course_content_By_Day', {
      params: {
        Course_Id: params.courseId,
        Module_ID: params.moduleId || '0',
        Section_ID: params.sectionId || '0',
        Day_Id: params.dayId || '1',
        isLibrary: params.isLibrary ? 'true' : 'false',
        is_Student: params.isStudent ? 1 : 0,
      },
    });
    return response.data;
  },

  getCourseModules: async (courseId: number | string) => {
    try {
      const response = await api.get(`/course/Get_Module_Of_Course/${courseId}`);
      return response.data;
    } catch (e) {
      const response = await api.get('/course/Get_Module_Of_Course', {
        params: { courseId },
      });
      return response.data;
    }
  },

  getBatchWithDays: async (courseId: number | string, moduleId: number | string = 0) => {
    try {
      const response = await api.get(`/Batch/Get_Batch_Days/${courseId}/${moduleId || 0}`);
      return response.data;
    } catch (e) {
      const response = await api.get('/Batch/Get_Batch_Days', {
        params: { courseId, moduleId },
      });
      return response.data;
    }
  },

  getSectionsByCourse: async (courseId: number | string) => {
    try {
      const response = await api.get(`/course/Get_Sections_By_Course/${courseId}`);
      return response.data;
    } catch (e) {
      const response = await api.get('/course/Get_Sections_By_Course', {
        params: { courseId },
      });
      return response.data;
    }
  },

  unlockExam: async (payload: {
    contentId: number | string;
    examID: number | string;
    Is_Question_Unlocked?: number;
    Is_Question_Media_Unlocked?: number;
    Is_Answer_Unlocked?: number;
    Batch_ID?: number | string;
  }) => {
    const response = await api.post('/course/Unlock_Exam', payload);
    return response.data;
  },

  changeStudentModuleLockStatus: async (payload: {
    Student_ID: number;
    Module_ID: number;
    Lock_Status: number;
  }) => {
    const response = await api.post('/Module/Change_Student_Module_Lock_Status', payload);
    return response.data;
  },

  getClassRecordings: async (batchId: number) => {
    const response = await api.get('/course/Get_Student_ClassRecords', {
      params: { batchId },
    });
    return response.data;
  },

  getVideoAttendanceReport: async (studentId: number | string, courseId: number | string) => {
    try {
      const response = await api.get('/teacher/Get_VideoAttendance_Report', {
        params: { Course_ID: courseId, Student_ID: studentId },
      });
      return response.data;
    } catch (e) {
      const response = await api.get('/course/Get_Video_Attendance_Report', {
        params: { Course_ID: courseId, Student_ID: studentId },
      });
      return response.data;
    }
  },

  getHodCourse: async () => {
    const response = await api.get('/user/Get_Hod_Course');
    return response.data;
  },

  getExamModules: async (courseId: number | string) => {
    const response = await api.get(`/course/Get_Exam_Modules_By_CourseId/${courseId}`);
    return response.data;
  },

  getStudentExamResults: async (studentId: number | string) => {
    const response = await api.get(`/student/Get_Exam_Results/${studentId}`);
    return response.data;
  },
};
