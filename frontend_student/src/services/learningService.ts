import api from './api';

export const learningService = {
  getMyEnrolledCourses: async (studentId: number) => {
    const response = await api.get(`/student/Get_Courses_By_StudentId/${studentId}`);
    return response.data;
  },

  getCourseModules: async (courseId: number) => {
    const response = await api.get('/course/Get_Module_Of_Course', {
      params: { courseId },
    });
    return response.data;
  },

  getCourseContentByDay: async (
    arg1: number,
    arg2?: number,
    moduleId?: number,
    sectionId?: number
  ) => {
    let courseId = arg1;
    let dayId = arg2;
    if (arg2 === undefined) {
      // Called as getCourseContentByDay(dayId)
      dayId = arg1;
      courseId = 1;
    }

    const response = await api.get('/course/Get_course_content_By_Day', {
      params: {
        Course_Id: courseId,
        isLibrary: false,
        Day_Id: dayId,
        Module_ID: moduleId,
        Section_ID: sectionId,
        is_Student: true,
      },
    });
    return response.data;
  },

  getCourseContentByModule: async (moduleId: number) => {
    const response = await api.get(`/course/Get_course_content_By_Module/${moduleId}`);
    return response.data;
  },

  saveVideoAttendance: async (attendanceData: {
    Student_ID: number;
    Course_ID: number;
    Video_ID: number;
    Watch_Seconds: number;
    Completed?: number;
  }) => {
    const response = await api.post('/course/Save_VideoAttendance', attendanceData);
    return response.data;
  },

  updateLastAccessedContent: async (data: { Student_ID: number; Course_ID: number; Content_ID: number }) => {
    const response = await api.post('/course/Update_LastAccessed_Content', data);
    return response.data;
  },
};
