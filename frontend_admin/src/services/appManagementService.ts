import api from './api';

export const appManagementService = {
  getAppPosters: async () => {
    const response = await api.get('/Get_AppPosters');
    return response.data;
  },

  saveAppPoster: async (posterData: any) => {
    const response = await api.post('/Save_AppPoster', posterData);
    return response.data;
  },

  deleteAppPoster: async (id: number) => {
    const response = await api.get(`/Delete_AppPoster/${id}`);
    return response.data;
  },

  getAppVersion: async () => {
    const response = await api.get('/Check_App_Version');
    return response.data;
  },

  saveAppVersion: async (versionData: any) => {
    const response = await api.post('/Save_App_Version', versionData);
    return response.data;
  },
};
