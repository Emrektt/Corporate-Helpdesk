import { axiosClient } from './axios-client';

export interface UserPreference {
  id: number;
  user_id: number;
  email_notifications: boolean;
  desktop_notifications: boolean;
  theme: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferenceUpdate {
  email_notifications?: boolean;
  desktop_notifications?: boolean;
  theme?: string;
  language?: string;
}

export const getMyPreferences = async (): Promise<UserPreference> => {
  const response = await axiosClient.get('/api/v1/user-preferences/me');
  return response.data;
};

export const updateMyPreferences = async (data: UserPreferenceUpdate): Promise<UserPreference> => {
  const response = await axiosClient.put('/api/v1/user-preferences/me', data);
  return response.data;
};
