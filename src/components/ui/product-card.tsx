import { Heart, MapPin, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  unit: string;
  image: string;
  seller: string;
  location: string;
  rating: number;
  category: string;
  inStock: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  onAddToCart?: (id: string) => void;
}

const ProductCard = ({
  id,
  name,
  price,
  unit,
  image,
  seller,
  location,
  rating,
  category,
  inStock,
  isFavorite = false,
  onFavoriteToggle,
  onAddToCart,
}: ProductCardProps) => {
  return (
    <Card className="product-card group">
      <div className="relative overflow-hidden rounded-t-xl">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Category badge */}
        <Badge className="absolute top-3 left-3 bg-primary text-white">
          {category}
        </Badge>
        
        {/* Favorite button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 w-auto h-auto"
          onClick={() => onFavoriteToggle?.(id)}
        >
          <Heart
            className={`w-4 h-4 ${
              isFavorite
                ? "fill-red-500 text-red-500"
                : "text-gray-600 hover:text-red-500"
            }`}
          />
        </Button>

        {/* Stock status */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold">Mavjud emas</span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Product name and rating */}
          <div className="flex justify-between items-start">
            <h3 className="font-poppins font-semibold text-lg text-foreground leading-tight">
              {name}
            </h3>
            <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-muted-foreground">
                {rating}
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-primary">
              {price.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">so'm/{unit}</span>
          </div>

          {/* Seller info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="font-medium">{seller}</span>
            <div className="flex items-center space-x-1">
              <MapPin className="w-3 h-3" />
              <span>{location}</span>
            </div>
          </div>

          {/* Action button */}
          <Button
            className="w-full btn-farm mt-4"
            disabled={!inStock}
            onClick={() => onAddToCart?.(id)}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {inStock ? "Savatga qo'shish" : "Mavjud emas"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;