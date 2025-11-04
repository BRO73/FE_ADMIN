// Category
export interface CategoryResponse {
    id: number;
    name: string;   // "main", "appetizer", "dessert", "beverage", "special"
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


export interface CustomerResponse {
    userId: number;
    fullName: string;
    phoneNumber: string;
    email: string;
}