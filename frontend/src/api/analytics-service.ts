import { axiosClient } from "./axios-client";

export interface AnalyticsSummary {
    total_tickets: number;
    open_tickets: number;
    in_progress_tickets: number;
    resolved_tickets: number;
    closed_tickets: number;
}

export interface DepartmentDistribution {
    name: string;
    count: number;
}

export interface DailyTrend {
    date: string;
    total: number;
    resolved: number;
}

export const getAnalyticsSummary = async (): Promise<AnalyticsSummary> => {
    const response = await axiosClient.get("/api/v1/analytics/summary");
    return response.data;
};

export const getDepartmentDistribution = async (): Promise<DepartmentDistribution[]> => {
    const response = await axiosClient.get("/api/v1/analytics/departments");
    return response.data;
};

export const getTicketTrend = async (): Promise<DailyTrend[]> => {
    const response = await axiosClient.get("/api/v1/analytics/trend");
    return response.data;
};
