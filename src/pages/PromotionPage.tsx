import { useEffect, useState } from "react";
import {
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "@/api/promotion.api";
import { Plus, Edit, Trash2, Search, Calendar, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import PromotionFormModal from "@/components/forms/PromotionFormModal";
import DeleteConfirmDialog from "@/components/forms/DeleteConfirmDialog";

interface Promotion {
  id: number;
  title: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  status: "active" | "inactive" | "expired" | "scheduled";
  usageCount: number;
  maxUsage?: number;
  code?: string;
}

const PromotionPage = () => {
  const { toast } = useToast();

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===============================
  // FETCH DATA
  // ===============================
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const data = await getAllPromotions();

      // ✅ Thêm usageCount mặc định (fix lỗi TypeScript)
      const mapped: Promotion[] = data.map((p: any) => {
        const now = new Date();
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);

        let status: Promotion["status"];
        if (now < start) status = "scheduled";
        else if (now > end) status = "expired";
        else status = "active";

        return {
          id: p.id,
          title: p.title,
          description: p.description || "",
          discountType: p.discountType,
          discountValue: p.discountValue,
          startDate: p.startDate,
          endDate: p.endDate,
          status, // 🟢 status tự tính
          usageCount: p.usageCount ?? 0,
          maxUsage: p.maxUsage,
          code: p.code,
        };
      });

      setPromotions(mapped);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load promotions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  // ===============================
  // CRUD HANDLERS
  // ===============================

  const handleAddPromotion = () => {
    setFormMode("add");
    setSelectedPromotion(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setFormMode("edit");
    setSelectedPromotion(promotion);
    setIsFormModalOpen(true);
  };

  const handleDeletePromotion = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      if (formMode === "add") {
        await createPromotion(formData);
        toast({ title: "Success", description: "Promotion created successfully" });
      } else if (formMode === "edit" && selectedPromotion) {
        await updatePromotion(selectedPromotion.id, formData);
        toast({ title: "Success", description: "Promotion updated successfully" });
      }
      setIsFormModalOpen(false);
      await fetchPromotions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save promotion",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPromotion) return;
    setIsSubmitting(true);
    try {
      await deletePromotion(selectedPromotion.id);
      toast({
        title: "Deleted",
        description: `${selectedPromotion.title} has been deleted successfully.`,
      });
      setIsDeleteDialogOpen(false);
      await fetchPromotions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete promotion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===============================
  // HELPERS
  // ===============================
  const statuses = ["all", "active", "inactive", "expired", "scheduled"];

  const filteredPromotions = promotions.filter((promotion) => {
    const matchesSearch =
      promotion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || promotion.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Promotion["status"]) => {
    switch (status) {
      case "active":
        return "bg-success text-success-foreground";
      case "inactive":
        return "bg-muted text-muted-foreground";
      case "expired":
        return "bg-destructive text-destructive-foreground";
      case "scheduled":
        return "bg-primary text-primary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDiscount = (type: Promotion["discountType"], value: number) => {
    return type === "percentage" ? `${value}%` : `$${value}`;
  };

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const daysUntilEnd = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilEnd <= 7 && daysUntilEnd > 0;
  };

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Promotion Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage promotional campaigns and discount codes.
          </p>
        </div>
        <Button onClick={handleAddPromotion} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Create Promotion
        </Button>
      </div>

      {/* Search + Filter */}
      <Card className="dashboard-card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search promotions by title, description, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {statuses.map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="desktop-table">
        <div className="table-header flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {loading ? "Loading..." : `All Promotions (${filteredPromotions.length})`}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-6">Promotion</th>
                <th className="text-left py-4 px-6">Discount</th>
                <th className="text-left py-4 px-6">Duration</th>
                <th className="text-left py-4 px-6">Status</th>
                <th className="text-right py-4 px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                filteredPromotions.map((promotion) => (
                  <tr key={promotion.id} className="table-row">
                    <td>
                      <div>
                        <div className="font-medium">{promotion.title}</div>
                        <div className="text-sm text-muted-foreground">{promotion.description}</div>
                        {promotion.code && (
                          <div className="text-xs text-primary font-mono mt-1">
                            Code: {promotion.code}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{formatDiscount(promotion.discountType, promotion.discountValue)} off</td>
                    <td>{promotion.startDate} - {promotion.endDate}</td>
                    <td>
                      <Badge className={getStatusColor(promotion.status)}>{promotion.status}</Badge>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditPromotion(promotion)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeletePromotion(promotion)}>
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

      {/* Modals */}
      <PromotionFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={fetchPromotions}
        promotion={selectedPromotion}
        mode={formMode}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Promotion"
        description="Are you sure you want to delete"
        itemName={selectedPromotion?.title}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default PromotionPage;
