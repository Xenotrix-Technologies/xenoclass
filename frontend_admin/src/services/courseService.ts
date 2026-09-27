import axios from 'axios';
import api from './api';

export interface Category {
  Category_ID: number;
  Category_Name: string;
  Delete_Status?: number | string;
  Enabled_Status?: number | boolean;
}

export interface Course {
  Course_ID: number;
  Course_Name: string;
  Course_Category_ID: number;
  Course_Category_Name?: string;
  Price?: number;
  Amount?: number;
  Validity?: number;
  Duration?: string;
  Description?: string;
  Things_To_Learn?: string;
  Thumbnail_Path?: string;
  Thumbnail_Name?: string;
  Sections?: number[];
  scheduledTeachers?: any[];
  Is_Active?: number;
  [key: string]: any;
}

export const courseService = {
  // Categories
  searchCategories: async (course_category_Name: string = '') => {
    const response = await api.get('/course_category/Search_course_category/', {
      params: { course_category_Name, allCategory: true },
    });
    return response.data;
  },

  getCategories: async (course_category_Name: string = '') => {
    return courseService.searchCategories(course_category_Name);
  },

  saveCategory: async (category: Category) => {
    const response = await api.post('/course_category/Save_course_category/', category);
    return response.data;
  },

  deleteCategory: async (categoryId: number) => {
    const response = await api.get(`/course_category/Delete_course_category/${categoryId}`);
    return response.data;
  },

  changeCategoryStatus: async (categoryId: number, categoryStatus: number) => {
    const response = await api.put('/course_category/ChangeStatus/', {
      category_Id: categoryId,
      categoryStatus,
    });
    return response.data;
  },

  // Courses
  searchCourses: async (courseName: string = '') => {
    const response = await api.get('/course/Search_course/', {
      params: { course_Name: courseName },
    });
    return response.data;
  },

  getCourseNames: async () => {
    try {
      const response = await api.get('/course/get_course_names/');
      if (Array.isArray(response.data) && response.data.length > 0) return response.data;
    } catch (e) {}
    return courseService.searchCourses('');
  },

  getCourse: async (courseId: number) => {
    const response = await api.get(`/course/Get_course/${courseId}`);
    return response.data;
  },

  saveCourse: async (courseData: any) => {
    const response = await api.post('/course/Save_course/', courseData);
    return response.data;
  },

  deleteCourse: async (courseId: number) => {
    const response = await api.get(`/course/Delete_course/${courseId}`);
    return response.data;
  },

  getAllCourseItems: async () => {
    const response = await api.get('/course/Get_All_Course_Items/');
    return response.data;
  },

  getCourseBatches: async (courseId: number) => {
    const response = await api.get(`/course/get_course_Batches/${courseId}`);
    return response.data;
  },

  getCourseStudents: async (courseId: number) => {
    const response = await api.get(`/course/Get_Course_Students/${courseId}`);
    return response.data;
  },

  getFreeTimeSlot: async (courseId: number) => {
    const response = await api.get(`/course/Get_Free_Time_Slot/${courseId}`);
    return response.data;
  },

  // Batches
  getAllBatches: async () => {
    const response = await api.get('/course/Get_all_Batch/');
    return response.data;
  },

  getBatchesByCourse: async (courseId: number) => {
    const response = await api.get(`/Batch/Get_Batches_By_Course/${courseId}`);
    return response.data;
  },

  saveBatch: async (batchData: any) => {
    const response = await api.post('/Batch/Save_Batch/', batchData);
    return response.data;
  },

  deleteBatch: async (batchId: number) => {
    const response = await api.get(`/Batch/Delete_Batch/${batchId}`);
    return response.data;
  },

  getBatchDays: async () => {
    const response = await api.get('/Batch/Get_Batch_Days');
    return response.data;
  },

  getStudentListByBatch: async (batchId: number) => {
    const response = await api.get(`/course/Get_Student_List_By_Batch/${batchId}`);
    return response.data;
  },

  // Modules
  getModulesOfCourse: async (courseId: number) => {
    const response = await api.get('/course_module/Get_Module_Of_Course/', {
      params: { courseId },
    });
    return response.data;
  },

  getCourseModules: async (courseId: number) => {
    return courseService.getModulesOfCourse(courseId);
  },

  saveModule: async (moduleData: any) => {
    const response = await api.post('/course_module/Save_Module/', moduleData);
    return response.data;
  },

  saveCourseModule: async (moduleData: any) => {
    return courseService.saveModule(moduleData);
  },

  deleteModule: async (moduleId: number) => {
    const response = await api.get(`/course_module/Delete_Module/${moduleId}`);
    return response.data;
  },

  deleteCourseModule: async (moduleId: number) => {
    return courseService.deleteModule(moduleId);
  },

  // Course Content & Lessons
  getCourseContentByDay: async (
    courseId: number,
    isLibrary: boolean = false,
    moduleId?: number,
    sectionId?: number,
    dayId?: number,
    isExamTest?: number
  ) => {
    const response = await api.get('/course/Get_course_content_By_Day', {
      params: {
        Course_Id: courseId,
        isLibrary,
        Module_ID: moduleId,
        Section_ID: sectionId,
        Day_Id: dayId,
        Is_Exam_Test: isExamTest,
        is_Student: false,
      },
    });
    return response.data;
  },

  getCourseContent: async (courseId: number, contentId: number) => {
    const response = await api.get(`/course/Get_course_content/${courseId}/${contentId}`);
    return response.data;
  },

  saveCourseContent: async (contentData: any) => {
    const payload = contentData && contentData.contents ? contentData : { contents: contentData };
    const response = await api.post('/course/save_course_content/', payload);
    return response.data;
  },

  deleteCourseContent: async (contentId: number) => {
    const response = await api.post(`/course/Delete_Course_Content/${contentId}`, {});
    return response.data;
  },

  // Exams & Questions
  getExamOfCourse: async (courseId: number) => {
    const response = await api.get(`/course/get_Examof_Course/${courseId}`);
    return response.data;
  },

  manageExamData: async (data: any) => {
    const response = await api.post('/course/Manage_ExamData', data);
    return response.data;
  },

  saveExam: async (examData: any) => {
    return courseService.manageCourseExam(examData);
  },

  manageCourseExam: async (data: any) => {
    const response = await api.post('/course/Manage_CourseExam', data);
    return response.data;
  },

  manageQuestions: async (data: any) => {
    const response = await api.post('/course/Manage_Questions', data);
    return response.data;
  },

  bulkInsertQuestions: async (questionsData: any) => {
    return courseService.manageQuestions(questionsData);
  },

  uploadQuestionsExcel: async (data: any) => {
    const response = await api.post('/course/Upload_Questions_Excel', data);
    return response.data;
  },

  upload: async (file: File, totalFilesCount: number = 1, courseName: string = 'General') => {
    const fileExt = file.name.split('.').pop() || '';
    const uniqueId = Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    const sanitizedCourseName = (courseName || 'General').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${uniqueId}.${fileExt}`;
    const key = `xenoclass/${sanitizedCourseName}/${fileName}`;
    const contentType = file.type || 'application/octet-stream';

    // 1. Get signed upload URL from backend
    const signRes = await api.get('/r2/upload-url', {
      params: { key, contentType },
    });

    if (!signRes.data || !signRes.data.success || !signRes.data.url) {
      throw new Error(signRes.data?.message || 'Failed to get upload URL from server');
    }

    // 2. Upload file directly to Cloudflare R2 using the signed URL
    await axios.put(signRes.data.url, file, {
      headers: {
        'Content-Type': contentType,
      },
    });

    return {
      key,
      fileName: file.name,
      filePath: key,
      filename: file.name,
      name: file.name,
    };
  },
};
