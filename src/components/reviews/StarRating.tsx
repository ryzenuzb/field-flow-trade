import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-9 h-9",
};

export const StarRating = ({ value, onChange, size = "md", className }: StarRatingProps) => {
  const interactive = typeof onChange === "function";

  return (
    <div className={cn("flex items-center gap-1", className)} role={interactive ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          aria-label={`${star} yulduz`}
          className={cn(
            "transition-transform",
            interactive && "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
            !interactive && "cursor-default"
          )}
        >
          <Star
            className={cn(
              sizes[size],
              star <= value ? "fill-primary text-primary" : "text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
};
