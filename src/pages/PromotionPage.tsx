import { useEffect, useState } from "react";
import {
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "@/api/promotion.api";
import { Plus, Edit, Trash2, Search, Calendar, Percent, Users, Clock } from "lucide-react";
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
          status,
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
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDiscount = (type: Promotion["discountType"], value: number) => {
    return type === "percentage" ? `${value}%` : `$${value}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getUsagePercentage = (usageCount: number, maxUsage?: number) => {
    if (!maxUsage) return 0;
    return Math.min((usageCount / maxUsage) * 100, 100);
  };

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Promotion Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage promotional campaigns and discount codes.
          </p>
        </div>
        <Button onClick={handleAddPromotion} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Promotion
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-l-4 border-l-blue-400 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Promotions</p>
              <p className="text-2xl font-bold text-foreground">{promotions.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Percent className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-green-400 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-foreground">
                {promotions.filter(p => p.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-yellow-400 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold text-foreground">
                {promotions.filter(p => p.status === 'scheduled').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-purple-400 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Expired</p>
              <p className="text-2xl font-bold text-foreground">
                {promotions.filter(p => p.status === 'expired').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search + Filter */}
      <Card className="p-6 hover:shadow-lg transition-shadow">
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
                {status === "all" ? "All Status" : status}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-foreground">
            {loading ? "Loading promotions..." : `All Promotions (${filteredPromotions.length})`}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="text-center py-4 px-4 font-semibold text-gray-700">Promotion</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700">Discount</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700">Duration</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700">Usage</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading promotions...</p>
                  </td>
                </tr>
              ) : filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="text-muted-foreground text-lg mb-2">No promotions found</div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchTerm || selectedStatus !== "all" 
                        ? "Try adjusting your search or filters" 
                        : "Create your first promotion to get started"
                      }
                    </p>
                    {!searchTerm && selectedStatus === "all" && (
                      <Button onClick={handleAddPromotion} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Promotion
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((promotion) => (
                  <tr key={promotion.id} className="border-b border-border hover:bg-gray-50/30 transition-colors">
                    {/* Promotion Info */}
                    <td className="py-4 px-4">
                        <div className="font-semibold text-foreground mb-1">{promotion.title}</div>
                        <div className="text-sm text-muted-foreground mb-2">{promotion.description}</div>
                        {promotion.code && (
                          <div className="text-xs bg-blue-50 text-blue-700 font-mono px-2 py-1 rounded border border-blue-200 inline-block">
                            {promotion.code}
                          </div>
                        )}
                    </td>

                    {/* Discount */}
                    <td className="py-4 px-4 ">
                      <div className="flex flex-col items-center">
                        <div className="text-lg font-bold text-green-600">
                          {formatDiscount(promotion.discountType, promotion.discountValue)}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {promotion.discountType}
                        </div>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span>{formatDate(promotion.startDate)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">to</div>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span>{formatDate(promotion.endDate)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Usage */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-sm font-medium">
                          {promotion.usageCount} {promotion.maxUsage ? `/ ${promotion.maxUsage}` : ''}
                        </div>
                        {promotion.maxUsage && (
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${getUsagePercentage(promotion.usageCount, promotion.maxUsage)}%` 
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-center">
                      <Badge 
                        className={`capitalize border ${getStatusColor(promotion.status)} font-medium`}
                      >
                        {promotion.status}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditPromotion(promotion)}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeletePromotion(promotion)}
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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