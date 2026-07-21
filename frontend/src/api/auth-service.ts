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
    const response = await axiosClient.get("/api/v1/auth/me");
    return response.data;
};

export const testLogin = async (email: string): Promise<{access_token: string}> => {
    const response = await axiosClient.post("/api/v1/auth/login", { email });
    return response.data;
};
