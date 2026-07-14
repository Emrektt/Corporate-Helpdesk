import { axiosClient } from './axios-client';

export interface UserProfile {
    id: number;
    email: string;
    full_name: string;
    role: string;
    department_id: number;
    is_active: boolean;
}

export const getMe = async (): Promise<UserProfile> => {
    const response = await axiosClient.get("/api/auth/me");
    return response.data;
};
