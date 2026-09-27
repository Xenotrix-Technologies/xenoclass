import api from './api';

export const callService = {
  getOngoingCalls: async () => {
    const response = await api.get('/user/Get_Ongoing_Calls');
    return response.data;
  },

  getCallHistory: async (userId: number) => {
    const response = await api.get('/user/get_call_history', {
      params: { userId },
    });
    return response.data;
  },

  saveCallHistory: async (callData: any) => {
    const response = await api.post('/user/Save_Call_History', callData);
    return response.data;
  },

  updateCallStatus: async (callId: number, status: number, type: 'connect' | 'call' = 'connect') => {
    const response = await api.get('/user/Update_Call_Status', {
      params: {
        callId,
        newStatus: status,
        type,
      },
    });
    return response.data;
  },
};
