import api from './api';

export const authService = {
  login: async (email: string, password: string, deviceId: string = 'web-student') => {
    const response = await api.post('/Login/Student_Login_Check', {
      email,
      password,
      Device_ID: deviceId,
    });
    return response.data;
  },

  registerStudent: async (studentData: any) => {
    const response = await api.post('/student/Save_student', studentData);
    return response.data;
  },

  getOccupations: async () => {
    const response = await api.get('/student/Search_Occupations');
    return response.data;
  },

  getStudentProfile: async (studentId?: number) => {
    const response = await api.get('/student/Get_student', {
      params: studentId ? { studentId } : {},
    });
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.post('/student/Delete_Student_Account', {});
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_user');
  },
};
