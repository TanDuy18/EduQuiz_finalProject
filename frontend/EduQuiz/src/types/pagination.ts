export type DataSourceTag = "FIGMA_REFERENCE" | "BACKEND_SEEDER" | "USER_DYNAMIC";

export type StorageMode = "INDEXED_DB" | "IN_MEMORY_FALLBACK";

export interface PageRequestParams {
  page: number;
  size: number;
  search?: string;
  sort?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
