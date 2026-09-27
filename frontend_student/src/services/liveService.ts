import api from './api';

export const liveService = {
  getLiveClassesByCourse: async (courseId: number) => {
    const response = await api.get(`/student/Get_Live_Classes_By_CourseId/${courseId}`);
    return response.data;
  },

  saveStudentLiveClass: async (data: { Student_ID: number; Class_ID: number }) => {
    const response = await api.post('/user/Save_StudentLiveClass', data);
    return response.data;
  },

  getAvailableMentors: async () => {
    const response = await api.get('/student/Get_Available_Mentors');
    return response.data;
  },

  getAvailableHod: async () => {
    const response = await api.get('/student/Get_Available_Hod');
    return response.data;
  },

  requestCall: async (callData: {
    student_id?: number;
    Student_ID?: number;
    teacher_id?: number;
    Teacher_ID?: number;
    call_type?: 'audio' | 'video';
    Call_Type?: 'audio' | 'video';
    Live_Link?: string;
    Is_Student_Called?: boolean;
    is_call_rejected?: number;
    [key: string]: any;
  }) => {
    const payload = {
      student_id: callData.student_id || callData.Student_ID || 1,
      teacher_id: callData.teacher_id || callData.Teacher_ID || 1,
      call_type: callData.call_type || callData.Call_Type || 'audio',
      Live_Link: callData.Live_Link || 'https://meet.google.com/new',
      Is_Student_Called: callData.Is_Student_Called !== undefined ? callData.Is_Student_Called : true,
      is_call_rejected: callData.is_call_rejected || 0,
    };
    const response = await api.post('/user/Save_Call_History', payload);
    return response.data;
  },
};
