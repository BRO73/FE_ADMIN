import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReviewRequest } from "@/api/review.api";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

interface FeedbackFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  review?: ReviewRequest;
  mode: "add" | "edit";
  onSubmit: (data: ReviewRequest) => void | Promise<void>; // ✅ cho phép truyền dữ liệu ra ngoài
}

const FeedbackFormModal = ({
  isOpen,
  onClose,
  review,
  mode,
  onSubmit,
}: FeedbackFormModalProps) => {
  const [formData, setFormData] = useState<ReviewRequest>({
    orderId: 0,
    ratingScore: 5,
    comment: "",
  });

  // ✅ Khi mở modal Edit, tự load dữ liệu hiện có
  useEffect(() => {
    if (review) {
      setFormData(review);
    } else {
      setFormData({
        orderId: 0,
        ratingScore: 5,
        comment: "",
      });
    }
  }, [review]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData); // ✅ gửi dữ liệu về parent (FeedbackPage)
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "orderId" || name === "ratingScore"
          ? Number(value)
          : value,
    }));
  };

  const renderStars = () => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 cursor-pointer ${
            star <= formData.ratingScore
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
          onClick={() =>
            setFormData((prev) => ({ ...prev, ratingScore: star }))
          }
        />
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Feedback" : "Edit Feedback"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="orderId">Order ID</Label>
            <Input
              id="orderId"
              name="orderId"
              type="number"
              value={formData.orderId}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label>Rating</Label>
            {renderStars()}
          </div>

          <div>
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              placeholder="Write your feedback..."
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === "add" ? "Submit" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackFormModal;
