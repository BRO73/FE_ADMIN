import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  createPromotion,
  updatePromotion,
  PromotionFormData,
} from "@/api/promotion.api";

interface PromotionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  promotion?: any;
  mode: "add" | "edit";
}

const PromotionFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  promotion,
  mode,
}: PromotionFormModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PromotionFormData>({
    title: "",
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    startDate: "",
    endDate: "",
    minSpend: 0,
    maxUsage: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (promotion && mode === "edit") {
      setFormData({
        title: promotion.title,
        code: promotion.code,
        description: promotion.description,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        minSpend: promotion.minSpend || 0,
        maxUsage: promotion.maxUsage || 0,
      });
    } else {
      setFormData({
        title: "",
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: 0,
        startDate: "",
        endDate: "",
        minSpend: 0,
        maxUsage: 0,
      });
    }
  }, [promotion, mode, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "discountValue" || name === "minSpend" || name === "maxUsage" ? Number(value) : value,
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (mode === "add") {
        await createPromotion(formData);
        toast({ title: "Created", description: "Promotion created successfully." });
      } else if (promotion) {
        await updatePromotion(promotion.id, formData);
        toast({ title: "Updated", description: "Promotion updated successfully." });
      }
      onSubmit(); // Gọi hàm reload lại danh sách trong PromotionPage
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save promotion.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Create Promotion" : "Edit Promotion"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter promotion name"
              />
            </div>
            <div>
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="E.g. SUMMER25"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-border rounded-md p-2"
              placeholder="Describe the promotion..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discountType">Discount Type</Label>
              <select
                id="discountType"
                name="discountType"
                value={formData.discountType}
                onChange={handleChange}
                className="w-full border border-border rounded-md p-2"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <Label htmlFor="discountValue">Discount Value</Label>
              <Input
                type="number"
                id="discountValue"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minSpend">Min Spend</Label>
              <Input
                type="number"
                id="minSpend"
                name="minSpend"
                value={formData.minSpend}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="maxUsage">Max Usage</Label>
              <Input
                type="number"
                id="maxUsage"
                name="maxUsage"
                value={formData.maxUsage}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? mode === "add"
                ? "Creating..."
                : "Saving..."
              : mode === "add"
              ? "Create"
              : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionFormModal;
