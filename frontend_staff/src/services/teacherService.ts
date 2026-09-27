import api from './api';

export const teacherService = {
  getTeacherCoursesWithBatch: async (teacherId: number) => {
    const response = await api.get(`/teacher/Get_Teacher_courses_With_Batch/${teacherId}`);
    return response.data;
  },

  getTeacherCourses: async (teacherId: number) => {
    const response = await api.get(`/teacher/Get_Teacher_courses/${teacherId}`);
    return response.data;
  },

  getOneToOneBatches: async (teacherId: number) => {
    const response = await api.get(`/teacher/Get_teacherBatch_of_oneOnOne/${teacherId}`);
    return response.data;
  },

  getFacultyBatchStudents: async (teacherId: number) => {
    const response = await api.get(`/teacher/Get_Faculty_Batch_Students/${teacherId}`);
    return response.data;
  },

  getTeacherStudents: async (teacherId: number, courseId: number = 0) => {
    const response = await api.get(`/teacher/Get_Teacher_Students/${teacherId}/${courseId}`);
    return response.data;
  },

  getStudentsByBatch: async (batchId: number, teacherId?: number) => {
    if (teacherId) {
      const all = await teacherService.getFacultyBatchStudents(teacherId);
      if (Array.isArray(all)) {
        return all.filter((s: any) => String(s.Batch_ID || s.batchId) === String(batchId));
      }
    }
    const res = await api.get(`/course/Get_Student_List_By_Batch/${batchId}`);
    return res.data;
  },

  getProfile: async (teacherId: number) => {
    const response = await api.get(`/user/Get_User/${teacherId}`);
    return response.data;
  },

  editProfile: async (profileData: any) => {
    const response = await api.post('/user/Save_user', profileData);
    return response.data;
  },

  changeStudentModuleLockStatus: async (data: {
    Student_ID: number;
    Module_ID: number;
    Lock_Status: number;
  }) => {
    const response = await api.post('/Module/Change_Student_Module_Lock_Status', data);
    return response.data;
  },

  getOngoingLiveClasses: async (teacherId?: number) => {
    const response = await api.get('/teacher/Get_OnGoing_liveClass', {
      params: teacherId ? { Teacher_ID: teacherId } : {},
    });
    return response.data;
  },

  getUpcomingLiveClasses: async (teacherId?: number) => {
    const response = await api.get('/teacher/Get_Upcomming_liveClass', {
      params: teacherId ? { Teacher_ID: teacherId } : {},
    });
    return response.data;
  },

  getCompletedLiveClasses: async (teacherId?: number) => {
    const response = await api.get('/teacher/Get_Completed_liveClass', {
      params: teacherId ? { Teacher_ID: teacherId } : {},
    });
    return response.data;
  },

  saveLiveClass: async (classData: any) => {
    const response = await api.post('/teacher/Save_LiveClass', classData);
    return response.data;
  },

  getStaffAttendance: async (date?: string) => {
    const response = await api.get('/teacher/Get_Staff_Attendance', {
      params: { date: date || '' },
    });
    return response.data;
  },

  saveStaffAttendance: async (dataOrUserId?: number | any) => {
    const payload =
      typeof dataOrUserId === 'number'
        ? { User_ID: dataOrUserId }
        : typeof dataOrUserId === 'object'
        ? { User_ID: dataOrUserId.Teacher_ID || dataOrUserId.User_ID, ...dataOrUserId }
        : {};

    const response = await api.post('/teacher/Save_Staff_Attendance', payload);
    return response.data;
  },

  getStaffAttendanceReport: async (teacherId: number, month?: number | string, year?: number | string) => {
    const response = await api.get('/teacher/Get_Staff_Attendance_Report', {
      params: { Teacher_ID: teacherId, Month: month, Year: year },
    });
    return response.data;
  },

  getTeacherQualifications: async (teacherId: number) => {
    const response = await api.get(`/teacher/Get_Teacher_Qualifications_By_TeacherID/${teacherId}`);
    return response.data;
  },

  saveTeacherQualification: async (data: any) => {
    const response = await api.post('/teacher/Save_Teacher_Qualification', data);
    return response.data;
  },

  editTeacherQualification: async (data: any) => {
    const response = await api.post('/teacher/Edit_Teacher_Qualification', data);
    return response.data;
  },

  deleteTeacherQualification: async (qualificationId: number, teacherId: number) => {
    const response = await api.delete(`/teacher/Delete_Teacher_Qualification/${qualificationId}/${teacherId}`);
    return response.data;
  },

  getTeacherExperience: async (teacherId: number) => {
    const response = await api.get(`/teacher/Get_Teacher_Experience_By_TeacherID/${teacherId}`);
    return response.data;
  },

  saveTeacherExperience: async (data: any) => {
    const response = await api.post('/teacher/Save_Teacher_Experience', data);
    return response.data;
  },

  editTeacherExperience: async (data: any) => {
    const response = await api.post('/teacher/Edit_Teacher_Experience', data);
    return response.data;
  },

  deleteTeacherExperience: async (experienceId: number, teacherId: number) => {
    const response = await api.delete(`/teacher/Delete_Teacher_Experience/${experienceId}/${teacherId}`);
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
};
