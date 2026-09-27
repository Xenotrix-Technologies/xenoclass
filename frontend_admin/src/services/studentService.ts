import api from './api';

export interface Student {
  Student_ID: number;
  First_Name: string;
  Last_Name: string;
  Student_Name?: string;
  Email: string;
  Phone_Number?: string;
  Mobile_Number?: string;
  Country_Code?: string;
  Country_Code_Name?: string;
  Profile_Photo_Path?: string;
  is_enrolled?: number;
  Password?: string;
  Status?: number;
  [key: string]: any;
}

export const studentService = {
  searchStudent: async (filters: {
    student_Name?: string;
    page: number;
    pageSize: number;
    courseId?: number | null;
    batchId?: number | null;
    enrollmentStatus?: string;
  }) => {
    const params: any = {
      student_Name: filters.student_Name || '',
      page: filters.page,
      pageSize: filters.pageSize,
      enrollment_status: filters.enrollmentStatus || 'all',
    };
    if (filters.courseId) params.courseId = filters.courseId;
    if (filters.batchId) params.batchId = filters.batchId;

    const response = await api.get('/student/Search_student/', { params });
    const raw = response.data;
    if (Array.isArray(raw) && raw.length >= 2 && Array.isArray(raw[1])) {
      const total = raw[0]?.[0]?.total_count ?? raw[1].length;
      return { data: raw[1], total };
    }
    if (Array.isArray(raw)) {
      return { data: raw, total: raw.length };
    }
    return raw || { data: [], total: 0 };
  },

  getAllStudents: async (studentName: string = '') => {
    const response = await api.get('/student/Get_All_Students/', {
      params: { student_Name: studentName },
    });
    return response.data;
  },

  getStudent: async (studentId: number) => {
    const response = await api.get(`/student/Get_student/${studentId}`);
    return response.data;
  },

  saveStudent: async (studentData: any) => {
    const response = await api.post('/student/Save_student/', studentData);
    return response.data;
  },

  deleteStudent: async (studentId: number) => {
    const response = await api.post(`/student/Delete_Student_Account/${studentId}`, {});
    return response.data;
  },

  enrollCourseFromAdmin: async (enrollData: {
    Student_ID: number;
    Course_ID: number;
    Batch_ID?: number;
    Slot_Id?: number;
    Payment_Status?: string;
    Payment_Method?: string;
    Enrollment_Date?: string;
    [key: string]: any;
  }) => {
    const response = await api.post('/student/enroleCourseFromAdmin/', enrollData);
    return response.data;
  },

  getCoursesByStudentId: async (studentId: number) => {
    const response = await api.get(`/student/Get_Courses_By_StudentId/${studentId}`);
    return response.data;
  },

  getStudentExamResults: async (studentId?: number, courseId?: number) => {
    const params: any = {};
    if (studentId) params.studentId = studentId;
    if (courseId) params.courseId = courseId;
    const response = await api.get('/student/Get_Student_Exam_Results/', { params });
    return response.data;
  },

  getExamResultsByStudentID: async (studentId: number, courseId?: number) => {
    const params: any = {};
    if (courseId) params.course_id = courseId;
    const response = await api.get(`/student/Get_Exam_Results/${studentId}`, { params });
    return response.data;
  },

  insertStudentExamResult: async (resultData: any) => {
    const response = await api.post('/student/Insert_Student_Exam_Result/', resultData);
    return response.data;
  },

  deleteStudentExamResult: async (studentId: number) => {
    const response = await api.get(`/student/delete_Student_Exam_result/${studentId}`);
    return response.data;
  },

  generateCertificate: async (studentCourseId: number, value: number) => {
    const response = await api.get(`/student/Generate_certificate/${studentCourseId}/${value}`);
    return response.data;
  },
};
