import {useEffect, useState} from "react";
import {Plus, Edit, Trash2, Search, Eye, FolderOpen} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import MenuItemFormModal from "@/components/forms/MenuItemFormModal";
import DeleteConfirmDialog from "@/components/forms/DeleteConfirmDialog";
import MenuItemViewCard from "@/components/ui/MenuItemViewCard";
import CategoryFormModal, { Category } from "@/components/forms/CategoryFormModal";

import{
  fetchCategories,
  fetchCategoryById,
  createCategory,
  deleteCategory,
  updateCategory
} from "@/api/category.api.ts"
import {
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "@/api/menuItem.api.ts";

import {CategoryRequest, CategoryResponse, MenuItem} from "@/types/type";
import { MenuItemFormData,MenuItemResponse } from "@/types/type";

import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";


const MenuManagementPage = () => {
  const {toast} = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "detailed">("list");

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCategoryDeleteOpen, setIsCategoryDeleteOpen] = useState(false);
  const [categoryFormMode, setCategoryFormMode] = useState<"add" | "edit">("add");
  const [selectedCategory2, setSelectedCategory2] = useState<CategoryResponse | undefined>();

  const [imageUrl, setImageUrl] = useState<string>("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:8082/api/files/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setImageUrl(data.url); // lưu link trả về từ backend
  };


  useEffect(() => {
    getAllMenuItems()
        .then((data) => {
          console.log("Fetched menu items:", data); // full backend data
          setMenuItems(data); // lưu nguyên categoryName từ backend
        })
        .catch(() =>
            toast({
              title: "Error",
              description: "Failed to load menu items",
              variant: "destructive",
            })
        );
  }, []);


// Fetch categories từ backend
  useEffect(() => {
    fetchCategories()
        .then((res) => {
          setCategories(res.data); // Lưu full object
        })
        .catch(() =>
            toast({
              title: "Error",
              description: "Failed to load categories",
              variant: "destructive",
            })
        );
  }, []);


  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
        (item.category ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description ?? "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
        selectedCategory === "all" ||
        (item.category ?? "").toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });


  const getCategoryColor = (category?: Category) => {
    // Nếu có color riêng → dùng
    if (category?.imageUrl) return category.imageUrl;

    // Màu mặc định cho tất cả category khác
    return "#6B7280"; // màu xám
  };

  const getStatusColor = (status: MenuItemResponse["status"]) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-success text-success-foreground";
      case "unavailable":
        return "bg-destructive text-destructive-foreground";
      case "seasonal":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };


  const handleAddMenuItem = () => {
    setFormMode("add");
    setSelectedMenuItem(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setFormMode("edit");
    setSelectedMenuItem(item);
    setIsFormModalOpen(true);
  };

  const handleDeleteMenuItemClick = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setIsDeleteDialogOpen(true);
  };
  const handleDeleteMenuItem = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setIsDeleteDialogOpen(true);
  };


  const handleFormSubmit = async (data: Partial<MenuItemFormData>) => {
    setIsSubmitting(true);

    const payload = {
      name: data.name,
      categoryName: data.categoryName,
      description: data.description,
      price: Number(data.price),
      status: data.status,
      imageUrl: data.imageUrl || null
    };

    try {
      if (formMode === "add") {
        const response = await createMenuItem(payload);
        const newItem = response;
        console.log("Backend response:", response);
        // ✅ đảm bảo luôn có categoryName
        const normalizedItem = {...newItem, categoryName: newItem.category ?? "Unknown"};
        setMenuItems([...menuItems, normalizedItem]);
        console.log("Updated menuItems state:", [...menuItems, response]);
      } else if (formMode === "edit" && selectedMenuItem) {
        const response = await updateMenuItem(selectedMenuItem.id, payload);
        console.log("Backend response:", response);
        const updatedItem = response;
        const normalizedItem = {...updatedItem, categoryName: updatedItem.category ?? "Unknown"};
        setMenuItems(menuItems.map((m) => (m.id === selectedMenuItem.id ? normalizedItem : m)));
        console.log("Updated menuItems state:", [...menuItems, response]);
      }

      setIsFormModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save menu item",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


// ✅ Gọi API khi delete
  const handleDeleteConfirm = async () => {
    if (!selectedMenuItem) return;

    setIsSubmitting(true);
    try {
      // ✅ Gọi API xóa menu item
      await deleteMenuItem(selectedMenuItem.id);

      // ✅ Update state frontend
      setMenuItems(menuItems.filter(m => m.id !== selectedMenuItem.id));

      toast({
        title: "Menu Item Removed",
        description: `${selectedMenuItem.name} has been removed from the menu.`,
      });

      setIsDeleteDialogOpen(false);
      setSelectedMenuItem(undefined);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove menu item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleMenuItemUpdate = (id: number, updates: Partial<MenuItemResponse>) => {
    setMenuItems(menuItems.map(item =>
        item.id === id ? {...item, ...updates} : item
    ));
  };

  // ===== Category Handlers =====
  const handleAddCategory = () => {
    setCategoryFormMode("add");
    setSelectedCategory2(undefined);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: CategoryResponse) => {
    setCategoryFormMode("edit");
    setSelectedCategory2(category);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = (category: CategoryResponse) => {
    setSelectedCategory2(category);
    setIsCategoryDeleteOpen(true);
  };

  const handleCategorySubmit = async (data: Partial<CategoryResponse>) => {
    // build a safe payload that matches CategoryRequest
    const payload: CategoryRequest = {
      name: (data.name ?? "").trim(),
      description: (data.description ?? "").trim(),
      imageUrl: data.imageUrl ?? "",
    };

    // runtime validation (optional but recommended)
    if (!payload.name) {
      toast({
        title: "Validation error",
        description: "Category name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (categoryFormMode === "add") {
        const res = await createCategory(payload); // expects CategoryRequest
        setCategories(prev => [...prev, res.data]);
      } else if (categoryFormMode === "edit" && selectedCategory2) {
        const res = await updateCategory(selectedCategory2.id, payload); // also sends full DTO
        setCategories(prev => prev.map(c => c.id === selectedCategory2.id ? res.data : c));
      }

      setIsCategoryModalOpen(false);
      setSelectedCategory2(undefined);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      });
    }
  }

// Confirm Delete
  const handleCategoryDeleteConfirm = async () => {
    if (!selectedCategory2) return;

    setIsSubmitting(true);
    try {
      await deleteCategory(selectedCategory2.id);
      setCategories(categories.filter(c => c.id !== selectedCategory2.id));

      toast({
        title: "Category Removed",
        description: `${selectedCategory2.name} has been removed.`,
      });

      setIsCategoryDeleteOpen(false);
      setSelectedCategory2(undefined);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove category. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Menu Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage restaurant menu items, categories, pricing, and availability.
            </p>
          </div>
        </div>

        <Tabs defaultValue="menu" className="space-y-6">
          {/* Tabs same as first layout */}
          <TabsList>
            <TabsTrigger value="menu">Menu Items</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          {/* Menu Items Tab */}
          <TabsContent value="menu" className="space-y-6">
            {/* View Switcher + Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex gap-2">
                <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                >
                  List View
                </Button>
                <Button
                    variant={viewMode === "detailed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("detailed")}
                >
                  <Eye className="w-4 h-4 mr-1"/>
                  Detailed View
                </Button>
              </div>
              <Button onClick={handleAddMenuItem} className="btn-primary">
                <Plus className="w-4 h-4 mr-2"/>
                Add Menu Item
              </Button>
            </div>

            {/* Search + Filters */}
            <Card className="dashboard-card">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                  <Input
                      placeholder="Search menu items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {/* All button */}
                  <Button
                      key="all"
                      variant={selectedCategory === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory("all")}
                      className="capitalize"
                  >
                    All
                  </Button>
                  {categories.map((category) => (
                      <Button
                          key={category.id}
                          variant={
                            selectedCategory === category.name ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedCategory(category.name)}
                          className="capitalize"
                      >
                        {category.name}
                      </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Detailed View */}
            {viewMode === "detailed" && (
                <div className="flex flex-wrap gap-6 justify-start">
                  {filteredItems.map((item) => (
                      <div key={item.id} className="w-[49%] flex-shrink-0">
                        <MenuItemViewCard item={item} onUpdate={handleMenuItemUpdate} />
                      </div>
                  ))}
                </div>
            )}




            {/* List View - Desktop Table */}
            {viewMode === "list" && (
                <Card className="desktop-table">
                  <div className="table-header flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Menu Items ({filteredItems.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Item</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Category</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Price</th>
                        <th className="text-left py-4 px-6 font-medium text-muted-foreground">Image Detail</th>
                        <th className="text-center py-4 px-6 font-medium text-muted-foreground">Status</th>
                        <th className="text-right py-4 px-6 font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                      </thead>
                      <tbody>
                      {filteredItems.map((item) => (
                          <tr key={item.id} className="border-b border-border">
                            {/* Item */}
                            <td className="text-left py-4 px-6">
                              <div>
                                <div className="font-medium text-foreground">{item.name}</div>
                                <div className="text-sm text-muted-foreground">{item.description}</div>
                              </div>
                            </td>

                            <td className="text-left py-4 px-6">
                              {(() => {
                                // tìm object category tương ứng với tên
                                const categoryObj = categories.find(
                                    (c) => c.name.toLowerCase() === (item.category ?? "").toLowerCase()
                                );

                                return (
                                    <Badge style={{ backgroundColor: getCategoryColor(categoryObj) }}>
                                      {item.category ?? "Unknown"}
                                    </Badge>
                                );
                              })()}
                            </td>


                            {/* Price */}
                            <td className="text-left py-4 px-6 font-medium text-foreground">
                              ${item.price}
                            </td>

                            <td className="text-left py-4 px-6">
                              {item.imageUrl ? (
                                  <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="w-12 h-12 object-cover rounded"
                                  />
                              ) : (
                                  "-"
                              )}
                            </td>

                            {/* Status */}
                            <td className="text-center py-4 px-6">
                              <Badge className={getStatusColor(item.status)}>
                                {item.status}
                              </Badge>
                            </td>

                            {/* Actions */}
                            <td className="text-right py-4 px-6 align-middle">
                              <div className="inline-flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditMenuItem(item)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteMenuItem(item)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>


                          </tr>
                      ))}
                      </tbody>
                    </table>

                  </div>
                </Card>
            )}

            {/* List View - Mobile Cards */}
            {viewMode === "list" && (
                <div className="lg:hidden space-y-4">
                  {filteredItems.map((item) => (
                      <Card key={item.id} className="mobile-card">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{item.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Badge style={{ backgroundColor: getCategoryColor(
                                  categories.find(c => c.name.toLowerCase() === (item.category ?? "").toLowerCase())
                              ) }}>
                              {item.category ?? "Unknown"}
                            </Badge>

                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="space-y-1 text-muted-foreground">
                            <p><span className="font-medium">Price:</span> ${item.price}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditMenuItem(item)}
                          >
                            <Edit className="w-4 h-4 mr-1"/>
                            Edit
                          </Button>
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMenuItem(item)}
                          >
                            <Trash2 className="w-4 h-4 mr-1"/>
                            Delete
                          </Button>
                        </div>
                      </Card>
                  ))}
                </div>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={handleAddCategory} className="btn-primary">
                <Plus className="w-4 h-4 mr-2"/>
                Add Category
              </Button>
            </div>

            <Card className="dashboard-card">
              <div className="table-header">
                <h3 className="text-lg font-semibold">
                  Categories ({categories.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {categories.map((category) => (
                    <Card key={category.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FolderOpen className="w-5 h-5 text-primary"/>
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{category.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="w-4 h-4"/>
                          </Button>
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(category)}
                          >
                            <Trash2 className="w-4 h-4"/>
                          </Button>
                        </div>
                      </div>
                    </Card>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <MenuItemFormModal
            isOpen={isFormModalOpen}
            onClose={() => setIsFormModalOpen(false)}
            onSubmit={handleFormSubmit}
            menuItem={selectedMenuItem}
            mode={formMode}
        />

        <DeleteConfirmDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            onConfirm={handleDeleteConfirm}
            title="Remove Menu Item"
            description="Are you sure you want to remove"
            itemName={selectedMenuItem?.name}
            isLoading={isSubmitting}
        />

        <CategoryFormModal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            onSubmit={handleCategorySubmit}
            category={selectedCategory2}
            mode={categoryFormMode}
        />

        <DeleteConfirmDialog
            isOpen={isCategoryDeleteOpen}
            onClose={() => setIsCategoryDeleteOpen(false)}
            onConfirm={handleCategoryDeleteConfirm}
            title="Remove Category"
            description="Are you sure you want to remove"
            itemName={selectedCategory2?.name}
            isLoading={isSubmitting}
        />
      </div>
  );
};
  export default MenuManagementPage;