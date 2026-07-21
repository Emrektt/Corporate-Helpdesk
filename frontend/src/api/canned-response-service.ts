import { axiosClient } from './axios-client';

export interface CannedResponse {
  id: number;
  title: string;
  content: string;
  category: string | null;
  is_active: boolean;
  created_by_id: number;
}

export interface CannedResponseCreate {
  title: string;
  content: string;
  category?: string;
}

export const getCannedResponses = async (search?: string, category?: string): Promise<CannedResponse[]> => {
  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (category) params.category = category;
  const { data } = await axiosClient.get('/api/v1/canned-responses/', { params });
  return data;
};

export const getCannedResponseCategories = async (): Promise<string[]> => {
  const { data } = await axiosClient.get('/api/v1/canned-responses/categories');
  return data;
};

export const createCannedResponse = async (payload: CannedResponseCreate): Promise<CannedResponse> => {
  const { data } = await axiosClient.post('/api/v1/canned-responses/', payload);
  return data;
};

export const updateCannedResponse = async (id: number, payload: Partial<CannedResponseCreate & { is_active: boolean }>): Promise<CannedResponse> => {
  const { data } = await axiosClient.put(`/api/v1/canned-responses/${id}`, payload);
  return data;
};

export const deleteCannedResponse = async (id: number): Promise<void> => {
  await axiosClient.delete(`/api/v1/canned-responses/${id}`);
};
