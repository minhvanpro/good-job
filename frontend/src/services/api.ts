import axios from "axios";
import type { ApiResponse, PaginatedResponse, Kudo, KudoReaction, KudoComment, Reward, Redemption, PointBalance, Notification, User } from "../types";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    api.post<ApiResponse<{ token: string; user: User }>>("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ token: string; user: User }>>("/auth/login", data),
};

export const kudoApi = {
  create: (data: {
    toUserId: string;
    points: number;
    description: string;
    coreValue: string;
    mediaUrls?: Array<{ url: string; type: "image" | "video"; duration?: number }>;
  }) => api.post<ApiResponse<Kudo>>("/kudos", data),
  list: (params?: { page?: number; limit?: number; type?: string }) =>
    api.get<PaginatedResponse<Kudo[]>>("/kudos", { params }),
  getById: (id: string) => api.get<ApiResponse<Kudo>>(`/kudos/${id}`),
  react: (kudoId: string, icon: string) =>
    api.post<ApiResponse<KudoReaction>>(`/kudos/${kudoId}/react`, { icon }),
  removeReaction: (kudoId: string, icon: string) =>
    api.delete(`/kudos/${kudoId}/react/${icon}`),
  comment: (kudoId: string, data: { content: string; mediaUrl?: string }) =>
    api.post<ApiResponse<KudoComment>>(`/kudos/${kudoId}/comment`, data),
};

export const feedApi = {
  get: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Kudo[]>>("/feed", { params }),
};

export const rewardApi = {
  catalog: () => api.get<ApiResponse<Reward[]>>("/rewards/catalog"),
  balance: () => api.get<ApiResponse<PointBalance>>("/rewards/balance"),
  redeem: (rewardId: string, idempotencyKey: string) =>
    api.post<ApiResponse<Redemption>>("/rewards/redeem", { rewardId, idempotencyKey }),
  redemptions: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Redemption[]>>("/rewards/redemptions", { params }),
};

export const notificationApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<{ notifications: Notification[]; unreadCount: number }>>("/notifications", { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
};

export const userApi = {
  list: () => api.get<ApiResponse<User[]>>("/users"),
};

export const uploadApi = {
  upload: (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    return api.post<ApiResponse<Array<{ url: string; type: "image" | "video"; duration?: number }>>>("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    });
  },
};

export default api;
