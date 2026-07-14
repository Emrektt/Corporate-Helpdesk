import { axiosClient } from "./axios-client";

export interface Category {
    id: number;
    name: string;
}

export interface Department {
    id: number;
    name: string;
    categories: Category[];
}

export interface TicketCreate {
    title: string;
    description: string;
    category_id: number;
}

export const getDepartments = async (): Promise<Department[]> => {
    const response = await axiosClient.get("/api/v1/departments/");
    return response.data;
};

export const createDepartment = async (name: string): Promise<Department> => {
    const response = await axiosClient.post("/api/v1/departments/", { name });
    return response.data;
};

export const updateDepartment = async (id: number, name: string): Promise<Department> => {
    const response = await axiosClient.put(`/api/v1/departments/${id}`, { name });
    return response.data;
};

export const deleteDepartment = async (id: number): Promise<void> => {
    await axiosClient.delete(`/api/v1/departments/${id}`);
};

export const createCategory = async (name: string, department_id: number, default_priority: string): Promise<Category> => {
    const response = await axiosClient.post("/api/v1/departments/categories", { name, department_id, default_priority });
    return response.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
    await axiosClient.delete(`/api/v1/departments/categories/${id}`);
};

export const createTicket = async (data: TicketCreate) => {
    const response = await axiosClient.post("/api/v1/tickets/", data);
    return response.data;
};

export interface Attachment {
    id: number;
    file_name: string;
    content_type: string;
    size: number;
    created_at: string;
}

export interface Ticket {
    id: number;
    ticket_number: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    department: Department;
    category: Category;
    created_at: string;
    attachments: Attachment[];
}

export interface TicketFilters {
    search?: string;
    status?: string;
    priority?: string;
}

export const getTickets = async (filters?: TicketFilters): Promise<Ticket[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    
    const queryString = params.toString();
    const url = queryString ? `/api/v1/tickets/?${queryString}` : "/api/v1/tickets/";
    
    const response = await axiosClient.get(url);
    return response.data;
};

export const getTicket = async (id: number): Promise<Ticket> => {
    const response = await axiosClient.get(`/api/v1/tickets/${id}`);
    return response.data;
};

export const deleteTicket = async (id: number): Promise<void> => {
    await axiosClient.delete(`/api/v1/tickets/${id}`);
};

export interface CommentUser {
    id: number;
    full_name: string;
    role: string;
}

export interface TicketComment {
    id: number;
    message: string;
    is_internal: boolean;
    created_at: string;
    user: CommentUser;
}

export const getComments = async (ticketId: number): Promise<TicketComment[]> => {
    const response = await axiosClient.get(`/api/v1/tickets/${ticketId}/comments`);
    return response.data;
};

export const addComment = async (ticketId: number, message: string, is_internal: boolean = false): Promise<TicketComment> => {
    const response = await axiosClient.post(`/api/v1/tickets/${ticketId}/comments`, { message, is_internal });
    return response.data;
};

export const updateTicketStatus = async (ticketId: number, status: string): Promise<Ticket> => {
    const response = await axiosClient.patch(`/api/v1/tickets/${ticketId}/status`, { status });
    return response.data;
};

export const uploadAttachment = async (ticketId: number, file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosClient.post(`/api/v1/tickets/${ticketId}/attachments`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};


