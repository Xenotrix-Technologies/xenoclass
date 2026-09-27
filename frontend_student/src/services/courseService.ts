import api from './api';

export const courseService = {
  getAppPosters: async () => {
    const response = await api.get('/Get_AppPosters');
    return response.data;
  },

  searchCourses: async (courseName: string = '') => {
    const response = await api.get('/Search_course', {
      params: courseName ? { course_Name: courseName } : {},
    });
    return response.data;
  },

  getCourse: async (courseId: number) => {
    const response = await api.get(`/course/Get_course/${courseId}`);
    return response.data;
  },

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

  getCoursesModules: async (courseId: number | string) => {
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

  getCourseContentByDay: async ({
    courseId,
    moduleId = '0',
    sectionId = '0',
    dayId = '1',
    isLibrary = false,
  }: {
    courseId: number | string;
    moduleId?: number | string;
    sectionId?: number | string;
    dayId?: number | string;
    isLibrary?: boolean;
  }) => {
    const response = await api.get('/course/Get_course_content_By_Day', {
      params: {
        Course_Id: courseId,
        Module_ID: moduleId,
        Section_ID: sectionId,
        Day_Id: dayId,
        isLibrary: isLibrary ? 'true' : 'false',
        is_Student: 1,
      },
    });
    return response.data;
  },

  checkStudentEnrollment: async (courseId: number | string) => {
    try {
      const response = await api.get(`/student/CheckStudentEnrollment/${courseId}`);
      return response.data;
    } catch (e) {
      return [];
    }
  },

  getCourseTimeSlots: async (courseId: number | string) => {
    try {
      const response = await api.get(`/course/Get_All_Time_Slot/${courseId}`);
      return response.data;
    } catch (e) {
      return [];
    }
  },

  getCourseReviews: async (courseId: number) => {
    const response = await api.get('/course/Get_Course_Reviews', {
      params: { courseId },
    });
    return response.data;
  },

  submitReview: async (reviewData: { Course_ID: number; Rating: number; Review: string }) => {
    const response = await api.post('/course/review_course', reviewData);
    return response.data;
  },

  enrollCourse: async (enrollData: { Student_ID: number; Course_ID: number; Batch_ID?: number }) => {
    const response = await api.post('/student/enroleCourse', enrollData);
    return response.data;
  },

  saveVideoAttendance: async (attendanceData: {
    Student_ID?: number;
    Course_ID: number;
    Video_ID?: number;
    Content_ID?: number;
    Watch_Seconds?: number;
    Total_Seconds?: number;
    Completed?: number;
  }) => {
    try {
      const response = await api.post('/course/Save_VideoAttendance', attendanceData);
      return response.data;
    } catch (e) {
      console.warn('Video attendance recording error:', e);
      return null;
    }
  },

  updateLastAccessedContent: async (data: { Student_ID?: number; Course_ID: number; Content_ID: number }) => {
    try {
      const response = await api.post('/course/Update_LastAccessed_Content', data);
      return response.data;
    } catch (e) {
      return null;
    }
  },

  getCartItems: async () => {
    const response = await api.get('/cart');
    return response.data;
  },
};

