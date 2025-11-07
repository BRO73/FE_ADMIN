import React, { FC, useEffect, useState, useMemo } from "react";
import FoodDetail from "./FoodDetail";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { getAllMenuItems } from "@/api/menuItem.api";
import { getTableById } from "@/api/table.api";
import { fetchCategories } from "@/api/category.api"; // Import API categories
import { isAxiosError } from "axios";
import {
  MenuItem,
  Table,
  CategoryResponse,
  TableResponse,
} from "@/types/index";
import { PageStatus } from "@/components/PageStatus";
import { MenuHeader } from "@/components/MenuHeader";
import { MenuList } from "@/components/MenuList";
import { CartFooter } from "@/components/CartFooter";

const getStorageKeys = (tableId: number) => ({
  activeOrder: `activeOrderId_table_${tableId}`,
  pendingOrder: `pendingOrderId_table_${tableId}`,
});

interface MenuProps {
  title?: string;
}

const MenuOrderPage: FC<MenuProps> = ({ title = "Thực Đơn Đặc Biệt" }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [tableInfo, setTableInfo] = useState<TableResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState<boolean>(true);
  const [menuError, setMenuError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryResponse[]>([]); // State cho categories từ API
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  const { addToCart, getTotalItems } = useCart();

  useEffect(() => {
    const targetOrderId = location.state?.targetOrderId;

    if (targetOrderId) {
      const params = new URLSearchParams(location.search);
      const tableIdFromUrl = params.get("tableId");

      if (tableIdFromUrl) {
        const tableId = Number(tableIdFromUrl);
        const storageKeys = getStorageKeys(tableId);

        sessionStorage.setItem(
          storageKeys.pendingOrder,
          targetOrderId.toString()
        );
        console.log(`🎯 MenuOrderPage: Set pendingOrderId = ${targetOrderId}`);
      }
    }
  }, [location.state, location.search]);

  useEffect(() => {
    const loadTableInfo = async (tableId: number) => {
      try {
        setLoading(true);
        setError(null);

        const table = await getTableById(tableId);

        if (table.status !== "Available" && table.status !== "Occupied") {
          setError(
            `Bàn này đang ở trạng thái "${table.status}" và không thể nhận order.`
          );
          setLoading(false);
          return;
        }

        setTableInfo(table);
      } catch (err) {
        console.error("Error loading table:", err);
        if (isAxiosError(err) && err.response) {
          const status = err.response.status;
          if (status === 404) {
            setError("Bàn không tồn tại hoặc mã QR đã hết hạn.");
          } else if (status === 409) {
            setError("Bàn đã bị khóa hoặc không khả dụng.");
          } else {
            setError("Không thể tải thông tin bàn.");
          }
        } else {
          setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
        }
        setTableInfo(null);
      } finally {
        setLoading(false);
      }
    };

    const params = new URLSearchParams(location.search);
    const tableIdFromUrl = params.get("tableId");

    if (tableIdFromUrl) {
      loadTableInfo(Number(tableIdFromUrl));
    } else {
      setError("Không tìm thấy ID bàn trong URL.");
      setLoading(false);
    }
  }, [location.search]);

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setMenuLoading(true);
        setMenuError(null);
        const data = await getAllMenuItems();
        setMenuItems(data);
      } catch (err) {
        setMenuError("Không thể tải dữ liệu menu.");
        console.error("Error fetching menu items:", err);
      } finally {
        setMenuLoading(false);
      }
    };
    fetchMenuItems();
  }, []);

  // Fetch categories từ API
  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        setCategoriesLoading(true);
        setCategoriesError(null);
        const response = await fetchCategories();
        setCategories(response.data);
      } catch (err) {
        setCategoriesError("Không thể tải danh mục món ăn.");
        console.error("Error fetching categories:", err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategoriesData();
  }, []);

  const cartItemCount = useMemo(() => getTotalItems(), [getTotalItems]);

  // Tạo danh sách categories từ API kết hợp với "Tất cả"
  const categoryList = useMemo(() => {
    const categoryNames = categories.map((cat) => cat.name).filter(Boolean);
    return ["Tất cả", ...categoryNames];
  }, [categories]);

  // Lấy danh sách categories unique từ menu items (fallback nếu API lỗi)
  const fallbackCategories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(menuItems.map((item) => item.category)),
    ].filter(Boolean);
    return ["Tất cả", ...uniqueCategories];
  }, [menuItems]);

  // Sử dụng categories từ API nếu có, nếu không thì dùng fallback từ menu items
  const displayCategories =
    categories.length > 0 ? categoryList : fallbackCategories;

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === "Tất cả" || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchTerm]);

  const handleBackToLiveOrder = () => {
    if (!tableInfo) return;
    navigate(`/live-order?tableId=${tableInfo.id}`);
  };

  const handleQuickAddToCart = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.status.toLowerCase() !== "available") return;

    setAddingToCart(item.id);
    addToCart(
      {
        id: item.id,
        name: item.name,
        price: item.price,
        imageUrl:
          item.imageUrl ||
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
        description: item.description || "",
      },
      1
    );

    setTimeout(() => setAddingToCart(null), 600);
  };

  // Hàm mới để xử lý thêm vào giỏ hàng từ FoodDetail
  const handleAddToCartWithDetail = (
    item: MenuItem,
    quantity: number,
    note?: string
  ) => {
    if (item.status.toLowerCase() !== "available") return;

    setAddingToCart(item.id);
    addToCart(
      {
        id: item.id,
        name: item.name,
        price: item.price,
        imageUrl:
          item.imageUrl ||
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
        description: item.description || "",
      },
      quantity, // Sử dụng số lượng từ modal
      note // Truyền note vào đây
    );

    setTimeout(() => setAddingToCart(null), 600);
    setSelectedItem(null); // Đóng modal sau khi thêm
  };

  const handleOrderClick = (item: MenuItem) => {
    if (item.status.toLowerCase() !== "available") return;
    setSelectedItem(item);
  };

  const isLoadingAny = loading || menuLoading || categoriesLoading;
  const errorAny = error || menuError || categoriesError;
  const loadingMessage = loading
    ? "Đang xác thực thông tin bàn..."
    : menuLoading
    ? "Đang tải thực đơn..."
    : "Đang tải danh mục...";

  if (isLoadingAny || errorAny) {
    return (
      <PageStatus
        loading={isLoadingAny}
        error={errorAny}
        loadingMessage={loadingMessage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <MenuHeader
        tableInfo={tableInfo}
        cartItemCount={cartItemCount}
        onBackToLiveOrder={handleBackToLiveOrder}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        categories={displayCategories}
        selectedCategory={selectedCategory}
        onSelectedCategoryChange={setSelectedCategory}
      />

      <div className="px-4 pt-4">
        <div className="relative w-full h-40 sm:h-48 rounded-2xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80&auto=format&fit=crop"
            alt="Hero Banner"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center p-4">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 shadow-sm">
              {title}
            </h2>
            <p className="text-sm sm:text-base shadow-sm">
              Món ngon đang chờ bạn khám phá
            </p>
          </div>
        </div>
      </div>

      <MenuList
        items={filteredItems}
        addingToCart={addingToCart}
        onOrderClick={handleOrderClick}
        onQuickAddToCart={handleQuickAddToCart}
      />

      {/* Cập nhật FoodDetail với prop onAddToCart mới */}
      <FoodDetail
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onAddToCart={handleAddToCartWithDetail}
      />

      {cartItemCount > 0 && (
        <CartFooter
          cartItemCount={cartItemCount}
          onBackToLiveOrder={handleBackToLiveOrder}
        />
      )}
    </div>
  );
};

export default MenuOrderPage;
