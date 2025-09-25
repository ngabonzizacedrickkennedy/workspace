// src/types/models.ts - Updated Product types
import { User } from './user';

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  fileKey: string;
  isMain: boolean;
  position: number;
  createdAt: string;
}
export interface GymSession {
  id: number;
  title: string;
  description?: string;
  videoUrl?: string;
  durationMinutes?: number;
  sessionOrder: number;
  programId: number;
  createdAt: string;
  updatedAt: string;
}
export interface UserGymProgram {
  id: number;
  userId: number;
  programId: number;
  purchaseDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  lastWatchedSessionId?: number;
  completedSessions?: number[];
  progress?: number;
  createdAt: string;
  updatedAt: string;
}
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  inventoryCount: number;
  isActive: boolean;
  categories: string[];
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  inStock?: boolean;
}

export interface ProductsResponse {
  content: Product[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  first: boolean;
  last: boolean;
}
export interface GymProgram {
  id: number;
  title: string;
  description?: string;
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  durationDays: number;
  price: number;
  isActive: boolean;
  trainerId: number;
  trainer?: User;
  sessions?: GymSession[];
  totalSessions?: number;
  enrolledCount?: number;
  rating?: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}
export interface ProgramFilters {
  page?: number;
  limit?: number;
  search?: string;
  difficultyLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  minPrice?: number;
  maxPrice?: number;
  maxDuration?: number;
  trainerId?: number;
  tags?: string[];
  sort?: 'price_asc' | 'price_desc' | 'duration_asc' | 'duration_desc' | 'newest' | 'popular';
}
export interface PaginatedPrograms {
  programs: GymProgram[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}
export interface ProductFormData {
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  inventoryCount: number;
  isActive: boolean;
  categories: string[];
  images: Array<{
    id?: number;
    imageUrl: string;
    fileKey: string;
    isMain: boolean;
    position: number;
  }>;
}