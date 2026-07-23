export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface Kudo {
  id: string;
  points: number;
  description: string;
  coreValue: CoreValue;
  createdAt: string;
  fromUser: User;
  toUser: User;
  reactions: KudoReaction[];
  comments: KudoComment[];
  media: KudoMedia[];
  _count?: {
    comments: number;
    reactions: number;
  };
}

export type CoreValue = "Teamwork" | "Ownership" | "Innovation" | "Integrity" | "Excellence" | "Respect";

export interface KudoMedia {
  id: string;
  url: string;
  type: "image" | "video";
  duration?: number;
}

export interface KudoReaction {
  id: string;
  icon: "thumb_up" | "favorite" | "celebration" | "whatshot" | "fitness_center" | "star";
  user: User;
}

export interface KudoComment {
  id: string;
  content: string;
  mediaUrl?: string;
  createdAt: string;
  user: User;
}

export interface Reward {
  id: string;
  name: string;
  description?: string;
  costPoints: number;
  stock?: number;
  imageUrl?: string;
  isActive: boolean;
}

export interface Redemption {
  id: string;
  pointsSpent: number;
  status: string;
  idempotencyKey: string;
  createdAt: string;
  reward: Reward;
}

export interface PointBalance {
  balance: number;
  received: number;
  sent: number;
  redeemed: number;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
