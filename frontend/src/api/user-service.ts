import { axiosClient } from './axios-client';

export interface User {
    id: number;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    department_id: number | null;
    created_at: string;
}

export const getUsers = async (): Promise<User[]> => {
    const response = await axiosClient.get<User[]>('/api/v1/users/');
    return response.data;
};
