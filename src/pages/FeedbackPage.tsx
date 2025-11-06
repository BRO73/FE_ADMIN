import { useEffect, useState } from "react";
import { Search, Star, MessageSquare, Calendar, Plus, Trash2, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  getAllReviews,
  createReview,
  updateReview,
  deleteReview,
  ReviewResponse,
  ReviewRequest,
} from "@/api/review.api";
import FeedbackFormModal from "@/components/forms/FeedbackFormModal";
import DeleteConfirmDialog from "@/components/forms/DeleteConfirmDialog";

const FeedbackPage = () => {
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedFeedback, setSelectedFeedback] = useState<ReviewResponse | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===============================
  // FETCH DATA
  // ===============================
  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const data = await getAllReviews();
      setFeedback(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  // ===============================
  // CRUD HANDLERS
  // ===============================
  const handleAddFeedback = () => {
    setFormMode("add");
    setSelectedFeedback(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditFeedback = (review: ReviewResponse) => {
    setFormMode("edit");
    setSelectedFeedback(review);
    setIsFormModalOpen(true);
  };

  const handleDeleteFeedback = (review: ReviewResponse) => {
    setSelectedFeedback(review);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: ReviewRequest) => {
  setIsSubmitting(true);
  try {
    if (formMode === "add") {
      const newReview = await createReview(data);
      setFeedback((prev) => [...prev, newReview]); // thêm review mới vào danh sách
      toast({
        title: "Review Added",
        description: "Feedback has been created successfully.",
      });
    } else if (formMode === "edit" && selectedFeedback) {
      const updatedReview = await updateReview(selectedFeedback.id, data);
      setFeedback((prev) =>
        prev.map((item) => (item.id === updatedReview.id ? updatedReview : item))
      ); // cập nhật lại ngay review vừa sửa
      toast({
        title: "Review Updated",
        description: "Feedback has been updated successfully.",
      });
    }

    // đóng modal và reset trạng thái
    setIsFormModalOpen(false);
    setSelectedFeedback(undefined);
  } catch {
    toast({
      title: "Error",
      description: "Failed to save feedback.",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};


  const handleDeleteConfirm = async () => {
    if (!selectedFeedback) return;
    setIsSubmitting(true);
    try {
      await deleteReview(selectedFeedback.id);
      toast({
        title: "Deleted",
        description: `Feedback #${selectedFeedback.id} deleted successfully.`,
      });
      setIsDeleteDialogOpen(false);
      await fetchFeedback();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete feedback.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===============================
  // FILTERING
  // ===============================
  const ratings = ["all", "5", "4", "3", "2", "1"];

  const filteredFeedback = feedback.filter((item) => {
    const matchesSearch = item.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating =
      selectedRating === "all" || item.ratingScore.toString() === selectedRating;
    return matchesSearch && matchesRating;
  });

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
        />
      ))}
      <span className="ml-2 text-sm font-medium">{rating}/5</span>
    </div>
  );

  const getAverageRating = () => {
    if (filteredFeedback.length === 0) return "0.0";
    const total = filteredFeedback.reduce((sum, item) => sum + item.ratingScore, 0);
    return (total / filteredFeedback.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    filteredFeedback.forEach((item) => {
      distribution[item.ratingScore as keyof typeof distribution]++;
    });
    return distribution;
  };

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Feedback</h1>
          <p className="text-muted-foreground mt-1">
            View and manage customer reviews submitted after orders.
          </p>
        </div>
        <Button onClick={handleAddFeedback} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Add Feedback
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
              <p className="text-2xl font-bold text-foreground">{getAverageRating()}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
        <Card className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
              <p className="text-2xl font-bold text-foreground">{filteredFeedback.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>
        <Card className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">5-Star Reviews</p>
              <p className="text-2xl font-bold text-foreground">
                {getRatingDistribution()[5]}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search + Filter */}
      <Card className="dashboard-card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search feedback by comment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {ratings.map((rating) => (
              <Button
                key={rating}
                variant={selectedRating === rating ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRating(rating)}
              >
                {rating === "all" ? "All Ratings" : `${rating} Stars`}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Feedback List */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading reviews...</p>
        ) : filteredFeedback.length === 0 ? (
          <Card className="dashboard-card">
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No feedback found</h3>
              <p className="text-muted-foreground">
                No feedback matches your current filters.
              </p>
            </div>
          </Card>
        ) : (
          filteredFeedback.map((item) => (
            <Card key={item.id} className="dashboard-card">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="flex-shrink-0 lg:w-64">
                  <div className="flex items-center justify-between lg:flex-col lg:items-start lg:space-y-3">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {item.customerName?.trim()
                          ? item.customerName
                          : "Khách hàng ẩn danh"}
                      </h4>
                      {item.customerEmail?.trim() && (
                        <p className="text-sm text-muted-foreground">{item.customerEmail}</p>
                      )}

                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {/* 👇 THÊM PHẦN NÀY 👇 */}
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium text-foreground">Order ID:</span>{" "}
                        #{item.orderId}
                      </p>
                    </div>

                    <div className="lg:w-full">{renderStars(item.ratingScore)}</div>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-foreground leading-relaxed">{item.comment}</p>
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditFeedback(item)}
                    >
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFeedback(item)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      <FeedbackFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        review={
          selectedFeedback
            ? {
              orderId: selectedFeedback.orderId,
              ratingScore: selectedFeedback.ratingScore,
              comment: selectedFeedback.comment,
            }
            : undefined
        }
        mode={formMode}
        onSubmit={handleFormSubmit}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Feedback"
        description="Are you sure you want to delete this feedback?"
        itemName={selectedFeedback?.id?.toString()}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default FeedbackPage;
