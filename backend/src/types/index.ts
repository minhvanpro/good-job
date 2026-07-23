import { Request } from "express";

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
  params: Record<string, string>;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateKudoInput {
  toUserId: string;
  points: number;
  description: string;
  coreValue: "Teamwork" | "Ownership" | "Innovation" | "Integrity" | "Excellence" | "Respect";
  mediaUrls?: Array<{
    url: string;
    type: "image" | "video";
    duration?: number;
  }>;
}
