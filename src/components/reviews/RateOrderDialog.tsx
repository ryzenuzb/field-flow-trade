import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { StarRating } from "./StarRating";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { reviewSchema } from "@/lib/validations/review";

interface RateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  sellerId: string;
  productId?: string | null;
  productTitle?: string;
  existingRating?: number;
  existingComment?: string | null;
  onSaved: (rating: number, comment: string) => void;
}

const labels: Record<number, string> = {
  1: "Juda yomon",
  2: "Yomon",
  3: "O'rtacha",
  4: "Yaxshi",
  5: "Ajoyib!",
};

export const RateOrderDialog = ({
  open,
  onOpenChange,
  orderId,
  sellerId,
  productId,
  productTitle,
  existingRating,
  existingComment,
  onSaved,
}: RateOrderDialogProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(existingRating ?? 0);
  const [comment, setComment] = useState(existingComment ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const parsed = reviewSchema.safeParse({ order_id: orderId, rating, comment: comment || null });
    if (!parsed.success) {
      toast({
        title: "Xatolik",
        description: rating === 0 ? "Iltimos, yulduzchalarni tanlang" : parsed.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Iltimos, tizimga kiring");

      const { error } = await supabase.from("reviews").upsert(
        {
          order_id: orderId,
          reviewer_id: user.id,
          seller_id: sellerId,
          product_id: productId ?? null,
          rating,
          comment: comment.trim() || null,
          is_verified_purchase: true,
          is_visible: true,
        },
        { onConflict: "order_id,reviewer_id" }
      );
      if (error) throw error;

      toast({ title: "Rahmat!", description: "Bahoyingiz saqlandi" });
      onSaved(rating, comment.trim());
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message || "Bahoni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fermerni baholang</DialogTitle>
          <DialogDescription>
            {productTitle ? `"${productTitle}" uchun` : "Buyurtma uchun"} 1 dan 5 gacha yulduz qo'ying.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex flex-col items-center gap-2">
            <StarRating value={rating} onChange={setRating} size="lg" />
            <p className="text-sm text-muted-foreground h-5">{rating ? labels[rating] : ""}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-comment">Izoh (ixtiyoriy)</Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Mahsulot sifati, yetkazib berish haqida yozing..."
              maxLength={1000}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="btn-farm">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
