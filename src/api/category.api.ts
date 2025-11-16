import axios from "axios";
import { CategoryResponse, CategoryRequest } from "@/types/type.ts";

const API_URL = "https://be-aynl.onrender.com/api/categories";

// Lấy tất cả categories
export const fetchCategories = () => axios.get<CategoryResponse[]>(API_URL);

// Lấy category theo ID
export const fetchCategoryById = (id: number) =>
  axios.get<CategoryResponse>(`${API_URL}/${id}`);

// Tạo category mới
export const createCategory = (data: CategoryRequest) =>
  axios.post<CategoryResponse>(API_URL, data);

// Cập nhật category
export const updateCategory = (id: number, data: CategoryRequest) =>
  axios.put<CategoryResponse>(`${API_URL}/${id}`, data);

// Xóa category
export const deleteCategory = (id: number) =>
  axios.delete<void>(`${API_URL}/${id}`);
