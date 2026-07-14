import { axiosClient } from "./axios-client";

export interface ChatMessage {
    id: number;
    room_id: number;
    sender_id: number;
    sender_name: string;
    sender_role: string;
    content: string;
    is_system: boolean;
    created_at: string;
}

export interface ChatRoom {
    id: number;
    status: "ACTIVE" | "CLOSED";
    subject: string | null;
    user_id: number;
    user_name: string;
    agent_id: number | null;
    agent_name: string | null;
    created_at: string;
    message_count: number;
    last_message: ChatMessage | null;
}

export const createChatRoom = async (subject?: string): Promise<ChatRoom> => {
    const response = await axiosClient.post("/api/v1/chat/rooms", null, {
        params: { subject }
    });
    return response.data;
};

export const getMyRoom = async (): Promise<ChatRoom | null> => {
    const response = await axiosClient.get("/api/v1/chat/rooms/my");
    return response.data;
};

export const getAllRooms = async (): Promise<ChatRoom[]> => {
    const response = await axiosClient.get("/api/v1/chat/rooms");
    return response.data;
};

export const getRoomMessages = async (roomId: number): Promise<ChatMessage[]> => {
    const response = await axiosClient.get(`/api/v1/chat/rooms/${roomId}/messages`);
    return response.data;
};

export const closeChatRoom = async (roomId: number): Promise<void> => {
    await axiosClient.put(`/api/v1/chat/rooms/${roomId}/close`);
};

export const claimChatRoom = async (roomId: number): Promise<ChatRoom> => {
    const response = await axiosClient.put(`/api/v1/chat/rooms/${roomId}/claim`);
    return response.data;
};
