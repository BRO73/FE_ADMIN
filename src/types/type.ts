// Category
export interface CategoryResponse {
  id: number;
  name: string; // "main", "appetizer", "dessert", "beverage", "special"
  description?: string;
  imageUrl?: string;
}
export interface CategoryRequest {
  name: string;
  description: string;
  imageUrl: string;
}

// Menu Item
export interface MenuItemResponse {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  status: "available" | "unavailable" | "seasonal";
  categoryName: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  activated: boolean;
}

export interface MenuItemFormData {
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  status: "available" | "unavailable" | "seasonal";
  categoryName: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  status: "available" | "unavailable" | "seasonal";
  category: string;
}

// Location
export interface LocationResponse {
  id: number;
  name: string;
  description?: string;
}

export interface LocationRequest {
  name: string;
  description?: string;
}

export interface LocationFormData {
  name: string;
  description?: string;
}

// Table
export interface TableResponse {
  id: number;
  tableNumber: string;
  capacity: number;
  locationId: number;
  locationName: string;
  status: "Available" | "Occupied" | "Reserved" | "Maintenance";
}
export interface TableRequest {
  tableNumber: string;
  capacity: number;
  locationId: number;
  status: "Available" | "Occupied" | "Reserved" | "Maintenance";
}
export interface TableFormData {
  tableNumber: string;
  capacity: number;
  locationId: number;
  status: "Available" | "Occupied" | "Reserved" | "Maintenance";
}

export interface FloorElementRequest {
  id?: number; // optional because when creating, id may not exist yet
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color?: string;
  label?: string;
  floor: string;
  tableId?: number;
}

export interface FloorElementResponse {
  id: number;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color?: string;
  label?: string;
  floor: string;
  tableId?: number;
}
export interface BookingRequest {
  tableIds: number[]; // Danh sách ID bàn
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  numGuests: number;
  status?: string; // Có thể bỏ trống, mặc định Pending
  notes?: string;
  staffId?: number;
  bookingTime: string; // ISO format: 'yyyy-MM-ddTHH:mm:ss'
}

export interface TableSimpleResponse {
  id: number;
  tableNumber: string;
  capacity: number;
  status: string;
}

export interface CustomerSimpleResponse {
  id: number;
  username: string;
}

export interface BookingResponse {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  bookingTime: string; // ISO 8601 format, e.g. '2025-11-04T17:30:00'
  numGuests: number;
  notes: string;
  status: string;
  table: TableSimpleResponse[];
  customer: CustomerSimpleResponse;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerResponse {
  userId: number;
  fullName: string;
  phoneNumber: string;
  email: string;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  orderTime: string;
  status: string;
  totalAmount: number;
  note?: string;

  table: TableResponse;
  staff?: StaffResponse;

  customerUserId?: number;
  customerName?: string;

  promotionId?: number;

  items: OrderDetailResponse[];

  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetailRequest {
  menuItemId: number;
  quantity: number;
  specialRequirements?: string;
}

export interface OrderDetailResponse {
  id: number;
  menuItem: MenuItemResponse;
  quantity: number;
  price: number;
  specialRequirements?: string;
}

export interface StaffResponse {
  id: number;
  fullName: string;
}


export interface Promotion {
  id: number;
  name: string;
  code: string;
  description: string;
  promotionType: "percentage" | "fixed"; 
  minSpend: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  activated: boolean;
  value: number;
}