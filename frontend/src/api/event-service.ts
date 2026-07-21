import { axiosClient } from './axios-client';

export interface EventLog {
    id: number;
    level: string;
    source: string;
    event_type?: string;
    message: string;
    stack_trace?: string;
    user_id?: number;
    user_email?: string;
    user_name?: string;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
}

export const logEvent = async (
    level: string,
    source: string,
    message: string,
    stack_trace?: string,
    event_type?: string
): Promise<EventLog> => {
    try {
        const response = await axiosClient.post("/api/v1/events/", {
            level,
            source,
            event_type,
            message,
            stack_trace
        });
        return response.data;
    } catch (e) {
        console.error("Failed to log event to backend:", e);
        throw e;
    }
};

export const getEvents = async (): Promise<EventLog[]> => {
    const response = await axiosClient.get("/api/v1/events/");
    return response.data;
};
