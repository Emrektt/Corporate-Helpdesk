import { axiosClient } from "./axios-client";
import { Department } from "./ticket-service";

export interface AuthorInfo {
    id: number;
    full_name: string;
}

export interface Article {
    id: number;
    title: string;
    content: string;
    department_id: number;
    is_published: boolean;
    view_count: number;
    created_by_id: number;
    created_at: string;
    updated_at: string | null;
    department: Department;
    author: AuthorInfo;
}

export interface ArticleCreate {
    title: string;
    content: string;
    department_id: number;
    is_published: boolean;
}

export const getArticles = async (departmentId?: number): Promise<Article[]> => {
    const url = departmentId ? `/api/v1/articles/?department_id=${departmentId}` : `/api/v1/articles/`;
    const response = await axiosClient.get(url);
    return response.data;
};

export const searchArticles = async (query: string): Promise<Article[]> => {
    if (!query || query.length < 3) return [];
    const response = await axiosClient.get(`/api/v1/articles/search?q=${encodeURIComponent(query)}`);
    return response.data;
};

export const getArticle = async (id: number): Promise<Article> => {
    const response = await axiosClient.get(`/api/v1/articles/${id}`);
    return response.data;
};

export const createArticle = async (data: ArticleCreate): Promise<Article> => {
    const response = await axiosClient.post("/api/v1/articles/", data);
    return response.data;
};

export const updateArticle = async (id: number, data: Partial<ArticleCreate>): Promise<Article> => {
    const response = await axiosClient.put(`/api/v1/articles/${id}`, data);
    return response.data;
};

export const deleteArticle = async (id: number): Promise<void> => {
    await axiosClient.delete(`/api/v1/articles/${id}`);
};
