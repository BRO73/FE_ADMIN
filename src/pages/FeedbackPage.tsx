import { useEffect, useState } from "react";
import { Search, Star, MessageSquare, Calendar, Plus, Trash2, Edit, Filter, X } from "lucide-react";
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
  const [showFilters, setShowFilters] = useState(false);

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
        setFeedback((prev) => [...prev, newReview]);
        toast({
          title: "Review Added",
          description: "Feedback has been created successfully.",
        });
      } else if (formMode === "edit" && selectedFeedback) {
        const updatedReview = await updateReview(selectedFeedback.id, data);
        setFeedback((prev) =>
          prev.map((item) => (item.id === updatedReview.id ? updatedReview : item))
        );
        toast({
          title: "Review Updated",
          description: "Feedback has been updated successfully.",
        });
      }
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
          className={`w-4 h-4 ${
            star <= rating 
              ? "fill-yellow-400 text-yellow-400" 
              : "text-gray-300"
          }`}
        />
      ))}
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

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRating("all");
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600 bg-green-50 border-green-200";
    if (rating >= 3) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getRatingText = (rating: number) => {
    if (rating >= 4) return "Excellent";
    if (rating >= 3) return "Good";
    return "Needs Improvement";
  };

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Feedback</h1>
          <p className="text-muted-foreground mt-1">
            View and manage customer reviews submitted after orders.
          </p>
        </div>
        <Button onClick={handleAddFeedback} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Feedback
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-l-4 border-l-yellow-400 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
              <p className="text-2xl font-bold text-foreground">{getAverageRating()}<span className="text-lg text-muted-foreground">/5</span></p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-blue-400 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
              <p className="text-2xl font-bold text-foreground">{filteredFeedback.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-green-400 hover:shadow-lg transition-shadow">
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

        <Card className="p-6 border-l-4 border-l-purple-400 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Filters</p>
              <p className="text-2xl font-bold text-foreground">
                {selectedRating !== "all" || searchTerm ? "1" : "0"}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Filter className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search + Filter */}
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex flex-col gap-4">
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Filter className="w-4 h-4" />
                Filters
                {(selectedRating !== "all" || searchTerm) && (
                  <Badge variant="secondary" className="ml-1 bg-blue-500">1</Badge>
                )}
              </Button>
              {(selectedRating !== "all" || searchTerm) && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground hover:bg-gray-100"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Filter by Rating:</p>
              <div className="flex gap-2 flex-wrap">
                {ratings.map((rating) => (
                  <Button
                    key={rating}
                    variant={selectedRating === rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRating(rating)}
                    className={selectedRating === rating ? "bg-blue-600" : ""}
                  >
                    {rating === "all" ? "All Ratings" : `${rating} Stars`}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Feedback List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading reviews...</p>
          </div>
        ) : filteredFeedback.length === 0 ? (
          <Card className="p-12 text-center hover:shadow-lg transition-shadow">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No feedback found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || selectedRating !== "all" 
                ? "No reviews match your current filters." 
                : "No feedback available yet."
              }
            </p>
            {!searchTerm && selectedRating === "all" && (
              <Button onClick={handleAddFeedback} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" /> Add First Review
              </Button>
            )}
          </Card>
        ) : (
          filteredFeedback.map((item) => (
            <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* Customer Info Section */}
                <div className="flex-shrink-0 lg:w-80">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {item.customerName?.charAt(0) || "A"}
                    </div>
                    
                    <div className="flex-1">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-bold text-foreground text-lg">
                            {item.customerName?.trim() || "Anonymous Customer"}
                          </h4>
                          {item.customerEmail?.trim() && (
                            <p className="text-sm text-muted-foreground mt-1">{item.customerEmail}</p>
                          )}
                        </div>

                        {/* Order & Date Info Box */}
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2 border">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {new Date(item.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium">Order #{item.orderId}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comment & Rating Section */}
                <div className="flex-1">
                  {/* Rating Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-50 px-4 py-2 rounded-full border border-yellow-200 flex items-center gap-2">
                        {renderStars(item.ratingScore)}
                        <span className="text-lg font-bold text-gray-900">{item.ratingScore}.0/5</span>
                      </div>
                    </div>
                    
                    {/* Rating Status Badge */}
                    <Badge 
                      className={`px-3 py-1 text-sm font-medium border ${getRatingColor(item.ratingScore)}`}
                    >
                      {getRatingText(item.ratingScore)}
                    </Badge>
                  </div>

                  {/* Comment Box */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-4 mb-4 relative">
                    <div className="absolute top-3 left-3 text-3xl text-gray-300">"</div>
                    <p className="text-foreground leading-relaxed text-base pl-6">
                      {item.comment}
                    </p>
                    <div className="absolute bottom-3 right-3 text-3xl text-gray-300">"</div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditFeedback(item)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                    >
                      <Edit className="w-4 h-4 mr-2" /> 
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFeedback(item)}
                      className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> 
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Footer Stats */}
      {filteredFeedback.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="text-center">
            <p className="text-sm text-blue-700">
              Showing <span className="font-semibold">{filteredFeedback.length}</span> of{" "}
              <span className="font-semibold">{feedback.length}</span> reviews
              {selectedRating !== "all" && ` • Filtered by ${selectedRating} stars`}
            </p>
          </div>
        </Card>
      )}

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
        description="Are you sure you want to delete this feedback? This action cannot be undone."
        itemName={selectedFeedback?.id?.toString()}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default FeedbackPage;