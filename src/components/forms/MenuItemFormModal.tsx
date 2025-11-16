import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchCategories } from "@/api/category.api";
import { CategoryResponse, MenuItem, MenuItemFormData } from "@/types/type";
import ImageUpload from "@/components/ImageUpload";
// ✅ Props
interface MenuItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MenuItemFormData) => void | Promise<void>;
  menuItem?: MenuItem; // 👈 use MenuItem for UI
  mode: "add" | "edit";
}

const MenuItemFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  menuItem,
  mode,
}: MenuItemFormModalProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const form = useForm<MenuItemFormData>({
    defaultValues: {
      name: "",
      categoryName: "all",
      price: 0,
      description: "",
      status: "available",
      imageUrl: "",
    },
  });

  // Load categories
  useEffect(() => {
    fetchCategories()
      .then((res) => {
        const categoryNames = res.data.map((c: CategoryResponse) => c.name);
        setCategories(["all", ...categoryNames]);
        form.setValue("categoryName", categoryNames[0] || "all");
      })
      .catch(() =>
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive",
        })
      );
  }, [form, toast]);

  // Reset form when editing or adding
  useEffect(() => {
    if (menuItem && mode === "edit") {
      form.reset({
        name: menuItem.name,
        categoryName: menuItem.category, // 👈 map category → categoryName
        price: menuItem.price,
        description: menuItem.description,
        status: menuItem.status,
        imageUrl: menuItem.imageUrl ?? "",
      });
    } else if (mode === "add") {
      form.reset({
        name: "",
        categoryName: categories[0] || "all",
        price: 0,
        description: "",
        status: "available",
        imageUrl: "",
      });
    }
  }, [menuItem, mode, categories, form]);

  const handleSubmit = async (data: MenuItemFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data); // already in MenuItemFormData format
      toast({
        title: mode === "add" ? "Menu Item Added" : "Menu Item Updated",
        description: `${data.name} has been ${
          mode === "add" ? "added" : "updated"
        }.`,
      });
      onClose();
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Menu Item" : "Edit Menu Item"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Add a new item to your restaurant menu."
              : "Update the menu item information."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Grilled Salmon" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="categoryName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "all"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() +
                              category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the dish..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="19.99"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Availability Status</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "available"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                        <SelectItem value="seasonal">Seasonal</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    {/* Bọc tất cả trong 1 div */}
                    <div className="flex flex-col gap-2">
                      {/* Input ẩn vẫn dùng để bind form */}
                      <Input
                        placeholder="Image URL"
                        {...field}
                        className="mb-2"
                      />

                      {/* Component ImageUpload */}
                      <ImageUpload
                        uploadUrl="https://be-aynl.onrender.com/api/files/upload"
                        onUpload={(url) => field.onChange(url)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : mode === "add"
                  ? "Add Item"
                  : "Update Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MenuItemFormModal;
