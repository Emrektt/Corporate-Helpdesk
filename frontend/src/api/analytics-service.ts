import { axiosClient } from "./axios-client";

export interface AnalyticsSummary {
    total_tickets: number;
    open_tickets: number;
    in_progress_tickets: number;
    resolved_tickets: number;
    closed_tickets: number;
    avg_csat_score: number | null;
    sla_breached_count: number;
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

export const getAnalyticsSummary = async (asUser?: boolean): Promise<AnalyticsSummary> => {
    const params = new URLSearchParams();
    if (asUser) params.append('as_user', 'true');
    const response = await axiosClient.get("/api/v1/analytics/summary", { params });
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
