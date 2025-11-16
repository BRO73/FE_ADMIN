import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Save, X, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/ImageUpload";

import { updateMenuItem } from "@/api/menuItem.api";
import { mapToFormData } from "@/utils/mappers";
import { CategoryResponse, MenuItem } from "@/types/type";

interface MenuItemViewCardProps {
  item: MenuItem;
  onUpdate: (id: number, updates: Partial<MenuItem>) => void;
}

const MenuItemViewCard = ({ item, onUpdate }: MenuItemViewCardProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState<MenuItem>(item);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  useEffect(() => setEditedItem(item), [item]);

  useEffect(() => {
    import("@/api/category.api.ts")
      .then(({ fetchCategories }) => fetchCategories())
      .then((res) => setCategories(res.data))
      .catch(() =>
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive",
        })
      );
  }, []);

  const getStatusColor = (status: MenuItem["status"]) => {
    switch (status) {
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

  const getCategoryColor = (category?: CategoryResponse) => {
    if (category?.imageUrl) return category.imageUrl;
    return "#6B7280";
  };

  const handleSave = async () => {
    try {
      const payload = mapToFormData(editedItem);
      const updated = await updateMenuItem(item.id, payload);
      onUpdate(item.id, updated);
      setIsEditing(false);
      toast({
        title: "Menu Item Updated",
        description: `${updated.name} has been updated successfully.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update menu item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditedItem(item);
    setIsEditing(false);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow w-full flex">
      {/* Image Section */}
      <div className="w-1/3 relative bg-muted p-2 flex-shrink-0">
        <div className="w-full aspect-square bg-white rounded-lg overflow-hidden shadow-sm flex justify-center items-center p-2">
          {isEditing ? (
            <div className="flex flex-col justify-center items-center h-full gap-2 w-full">
              {editedItem.imageUrl ? (
                <img
                  src={editedItem.imageUrl}
                  alt={editedItem.name}
                  className="w-full h-full object-contain rounded"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <DollarSign className="w-12 h-12 opacity-50" />
                  <p className="text-sm">No image</p>
                </div>
              )}
              <ImageUpload
                uploadUrl="https://be-aynl.onrender.com/api/files/upload"
                onUpload={(url) =>
                  setEditedItem({ ...editedItem, imageUrl: url })
                }
              />
            </div>
          ) : item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              <DollarSign className="w-12 h-12 opacity-50" />
              <p className="text-sm">No image</p>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-2">
          <Badge
            style={{
              backgroundColor: getCategoryColor(
                categories.find(
                  (c) =>
                    c.name.toLowerCase() === (item.category ?? "").toLowerCase()
                )
              ),
            }}
          >
            {item.category ?? "Unknown"}
          </Badge>
          <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
        </div>
      </div>

      {/* Content Section */}
      <div className="w-2/3 p-4 flex flex-col justify-between">
        <div className="flex items-start justify-between mb-2">
          {isEditing ? (
            <Input
              value={editedItem.name}
              onChange={(e) =>
                setEditedItem({ ...editedItem, name: e.target.value })
              }
              className="text-xl font-bold w-full"
              placeholder="Item name"
            />
          ) : (
            <h3 className="text-xl font-bold text-foreground">{item.name}</h3>
          )}
          <div className="flex gap-2 ml-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 mr-1" /> Edit
              </Button>
            )}
          </div>
        </div>

        <div className="mb-2">
          {isEditing ? (
            <Textarea
              value={editedItem.description}
              onChange={(e) =>
                setEditedItem({ ...editedItem, description: e.target.value })
              }
              rows={3}
              placeholder="Description"
            />
          ) : (
            <p className="text-muted-foreground">{item.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-5 h-5 text-primary" />
          {isEditing ? (
            <Input
              type="number"
              step="0.01"
              value={editedItem.price}
              onChange={(e) =>
                setEditedItem({
                  ...editedItem,
                  price: parseFloat(e.target.value),
                })
              }
              className="w-24"
            />
          ) : (
            <span className="text-lg font-bold text-primary">{item.price}</span>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          <span>Item ID: #{item.id}</span> •{" "}
          <span className="capitalize">{item.status}</span>
        </div>
      </div>
    </Card>
  );
};

export default MenuItemViewCard;
