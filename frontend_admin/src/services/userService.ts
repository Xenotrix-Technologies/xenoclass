import api from './api';

export interface User {
  User_ID: number;
  First_Name: string;
  Last_Name?: string;
  Email: string;
  PhoneNumber?: string;
  Mobile_Number?: string;
  User_Type_Id: number;
  Address?: string;
  password?: string;
  Password?: string;
  Status?: number;
  Registered_Date?: string | Date;
  Profile_Photo_Path?: string;
  Course_Name?: string;
  [key: string]: any;
}

export const userService = {
  getDashboard: async () => {
    const response = await api.get('/user/Get_Dashboard/');
    return response.data;
  },

  getDashboardMetricDetails: async (type: string) => {
    const response = await api.get(`/user/Get_Dashboard_Metric_Details/${type}`);
    return response.data;
  },

  getMetricDetails: async (type: string) => {
    return userService.getDashboardMetricDetails(type);
  },

  searchUser: async (filters?: {
    user_Name?: string;
    slot_wise?: boolean | null;
    batch_wise?: boolean | null;
    course_id?: number;
    hod_only?: boolean | null;
  }) => {
    const response = await api.get('/user/Search_user/', {
      params: filters || {},
    });
    return response.data;
  },

  searchUsers: async (filters?: any) => {
    return userService.searchUser(filters);
  },

  getUser: async (userId: number) => {
    const response = await api.get(`/user/Get_user/${userId}`);
    return response.data;
  },

  saveUser: async (userData: any) => {
    const response = await api.post('/user/Save_user/', userData);
    return response.data;
  },

  deleteUser: async (userId: number) => {
    const response = await api.get(`/user/Delete_user/${userId}`);
    return response.data;
  },

  getTeacherCoursesWithBatch: async (teacherId: number) => {
    const response = await api.get(`/teacher/Get_Teacher_courses_With_Batch/${teacherId}`);
    return response.data;
  },

  getHodCourse: async (teacherId: number) => {
    const response = await api.get(`/teacher/Get_Teacher_courses/${teacherId}`);
    return response.data;
  },

  getTeacherStudents: async (teacherId: number, courseId: number = 0) => {
    const response = await api.get(`/teacher/Get_Teacher_Students/${teacherId}/${courseId}`);
    return response.data;
  },

  saveTeacherCourse: async (data: any) => {
    const response = await api.post('/teacher/Save_Teacher_Course/', data);
    return response.data;
  },
};
