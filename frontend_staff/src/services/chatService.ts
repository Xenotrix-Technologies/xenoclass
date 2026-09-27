import api from './api';

export const chatService = {
  getCallsAndChatsList: async (teacherId?: number) => {
    const response = await api.get('/user/Get_Calls_And_Chats_List', {
      params: teacherId ? { teacherId, type: 'chat', sender: 'teacher' } : {},
    });
    return response.data;
  },

  getChatsMedia: async (studentId: number) => {
    const response = await api.get('/chat/Get_Chats_Media', {
      params: { studentId },
    });
    return response.data;
  },
};
