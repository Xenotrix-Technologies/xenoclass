import api from './api';

export const examService = {
  getStudentExamsByCourse: async (courseId: number) => {
    const response = await api.get(`/course/Student_GetExams/${courseId}`);
    return response.data;
  },

  getQuestionsByExamId: async (courseExamId: number) => {
    const response = await api.get(`/course/Student_GetQuestions/${courseExamId}`);
    return response.data;
  },

  saveExamResult: async (resultData: {
    Student_ID: number;
    Course_Exam_ID: number;
    Marks_Obtained: number;
    Total_Marks: number;
    Answers?: any;
  }) => {
    const response = await api.post('/student/Save_Exam_Result', resultData);
    return response.data;
  },

  getStudentExamResults: async (studentId: number) => {
    try {
      const response = await api.get(`/student/Get_Exam_Results/${studentId}`);
      if (Array.isArray(response.data)) return response.data;
    } catch (e) {
      // Fallback
    }
    const res = await api.get(`/student/Get_Student_Exam_Results/${studentId}`);
    return res.data;
  },
};
