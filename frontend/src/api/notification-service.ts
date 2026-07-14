import { axiosClient } from "./axios-client";

export interface Notification {
    id: number;
    title: string;
    message: string;
    ticket_id: number | null;
    is_read: boolean;
    created_at: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
    const response = await axiosClient.get("/api/v1/notifications/");
    return response.data;
};

export const markNotificationAsRead = async (id: number): Promise<Notification> => {
    const response = await axiosClient.put(`/api/v1/notifications/${id}/read`);
    return response.data;
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
    await axiosClient.put("/api/v1/notifications/read-all");
};
