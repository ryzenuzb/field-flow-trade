import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, SlidersHorizontal, ShoppingBag, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ui/product-card";

interface Product {
  id: string;
  title: string;
  price: number;
  unit: string;
  image_url: string | null;
  seller_id: string;
  location: string | null;
  category: string;
  stock_quantity: number | null;
  description: string | null;
  profiles?: { full_name: string; location: string | null } | null;
  reviews?: { rating: number }[];
}

const Marketplace = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [maxPrice, setMaxPrice] = useState(10000000);
  const [selectedLocation, setSelectedLocation] = useState("all");

  useEffect(() => {
    checkAuthAndRole();
    fetchProducts();
  }, []);

  const checkAuthAndRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setIsAuthenticated(true);
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      if (roles && roles.some(r => r.role === 'farmer')) {
        toast({
          title: "Ruxsat yo'q",
          description: "Fermerlar bozorga kira olmaydi",
          variant: "destructive",
        });
        navigate('/farmer');
        return;
      }
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          reviews (rating)
        `)
        .eq('is_active', true)
        .is('deleted_at', null)
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch seller profiles separately
      const sellerIds = [...new Set((data || []).map(p => p.seller_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, location')
        .in('user_id', sellerIds);

      const profileMap = new Map((profilesData || []).map(p => [p.user_id, p]));

      const enriched = (data || []).map(p => ({
        ...p,
        profiles: profileMap.get(p.seller_id) || null,
      }));

      setProducts(enriched as Product[]);
      
      // Calculate max price for slider
      if (data && data.length > 0) {
        const max = Math.max(...data.map(p => p.price));
        setMaxPrice(max);
        setPriceRange([0, max]);
      }
    } catch (error) {
      console.error('Mahsulotlarni yuklashda xatolik:', error);
      toast({
        title: "Xatolik",
        description: "Mahsulotlarni yuklashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get unique locations from products
  const locations = useMemo(() => {
    const locs = new Set(products.map(p => p.location).filter(Boolean) as string[]);
    return Array.from(locs).sort();
  }, [products]);

  // Apply all filters and sorting
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.location && p.location.toLowerCase().includes(q)) ||
        (p.profiles && typeof p.profiles === 'object' && 'full_name' in p.profiles && p.profiles.full_name?.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Location filter
    if (selectedLocation !== "all") {
      result = result.filter(p => p.location === selectedLocation);
    }

    // Price range filter
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sorting
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => {
          const avgA = a.reviews?.length ? a.reviews.reduce((s, r) => s + r.rating, 0) / a.reviews.length : 0;
          const avgB = b.reviews?.length ? b.reviews.reduce((s, r) => s + r.rating, 0) / b.reviews.length : 0;
          return avgB - avgA;
        });
        break;
      case "recent":
      default:
        // Already sorted by created_at desc from DB
        break;
    }

    return result;
  }, [products, searchQuery, selectedCategory, sortBy, selectedLocation, priceRange]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (selectedLocation !== "all") count++;
    if (searchQuery.trim()) count++;
    if (priceRange[0] > 0 || priceRange[1] < maxPrice) count++;
    return count;
  }, [selectedCategory, selectedLocation, searchQuery, priceRange, maxPrice]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedLocation("all");
    setSortBy("recent");
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);


  const categories = [
    { value: "all", label: "Barcha kategoriyalar" },
    { value: "sabzavot", label: "Sabzavot" },
    { value: "meva", label: "Meva" },
    { value: "don", label: "Don" },
    { value: "sut", label: "Sut mahsulotlari" },
    { value: "urug", label: "Urug'lar" },
  ];

  const handleFavoriteToggle = (id: string) => {
    console.log("Toggle favorite for product:", id);
  };

  const handleAddToCart = (id: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Tizimga kiring",
        description: "Buyurtma berish uchun tizimga kirishingiz kerak",
        variant: "destructive",
      });
      return;
    }

    const product = products.find(p => p.id === id);
    if (product) {
      setSelectedProduct(product);
      setQuantity(1);
      setOrderDialogOpen(true);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedProduct || !isAuthenticated) return;

    setIsOrdering(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Xatolik",
          description: "Foydalanuvchi topilmadi",
          variant: "destructive",
        });
        return;
      }

      // Call create-order edge function
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          product_id: selectedProduct.id,
          quantity: quantity,
        },
      });

      if (error) throw error;

      toast({
        title: "Buyurtma qabul qilindi!",
        description: `${selectedProduct.title} uchun buyurtmangiz qabul qilindi`,
      });

      setOrderDialogOpen(false);
      setSelectedProduct(null);
      fetchProducts(); // Refresh products to update stock
    } catch (error: any) {
      console.error('Buyurtma xatoligi:', error);
      toast({
        title: "Xatolik",
        description: error.message || "Buyurtma berishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="section-field border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-poppins font-bold text-foreground fade-in">
              Fermerlar <span className="gradient-text">Bozori</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto slide-up">
              Sifatli qishloq xo'jaligi mahsulotlarini to'g'ridan-to'g'ri fermerlardan sotib oling
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Mahsulot nomi, fermer yoki joylashuv..."
                className="pl-10 h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-[250px] h-12">
                <SelectValue placeholder="Kategoriya tanlang" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-[200px] h-12">
                <SelectValue placeholder="Saralash" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Yangi qo'shilgan</SelectItem>
                <SelectItem value="price-low">Narx: Kam → Yuqori</SelectItem>
                <SelectItem value="price-high">Narx: Yuqori → Kam</SelectItem>
                <SelectItem value="rating">Reyting bo'yicha</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showAdvancedFilters ? "default" : "outline"}
              className="h-12 px-6"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtrlar
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-border space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Location filter */}
                <div className="space-y-2">
                  <Label>Joylashuv</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Hudud tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha hududlar</SelectItem>
                      {locations.map((loc) => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price range */}
                <div className="space-y-2">
                  <Label>
                    Narx oralig'i: {priceRange[0].toLocaleString()} — {priceRange[1].toLocaleString()} so'm
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={(val) => setPriceRange(val as [number, number])}
                    min={0}
                    max={maxPrice}
                    step={Math.max(1000, Math.floor(maxPrice / 100))}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Filtrlarni tozalash
                </Button>
              </div>
            </div>
          )}

          {/* Active filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {activeFilterCount === 0 ? (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Filter className="w-3 h-3 mr-1" />
                Barcha mahsulotlar ({filteredProducts.length})
              </Badge>
            ) : (
              <>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Filter className="w-3 h-3 mr-1" />
                  {filteredProducts.length} ta natija
                </Badge>
                {selectedCategory !== "all" && (
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setSelectedCategory("all")}>
                    {categories.find(c => c.value === selectedCategory)?.label}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
                {selectedLocation !== "all" && (
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setSelectedLocation("all")}>
                    {selectedLocation}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
                {searchQuery.trim() && (
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchQuery("")}>
                    "{searchQuery}"
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-lg text-muted-foreground">
              {products.length === 0 ? "Hozircha mahsulotlar yo'q" : "Filtrga mos mahsulot topilmadi"}
            </p>
            {activeFilterCount > 0 && (
              <Button variant="outline" onClick={clearAllFilters}>
                Filtrlarni tozalash
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const avgRating = product.reviews?.length
                ? Math.round((product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length) * 10) / 10
                : 0;
              const sellerName = product.profiles && typeof product.profiles === 'object' && 'full_name' in product.profiles
                ? product.profiles.full_name
                : "Fermer";
              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.title}
                  price={product.price}
                  unit={product.unit}
                  image={product.image_url || ''}
                  seller={sellerName}
                  location={product.location || "Noma'lum"}
                  rating={avgRating}
                  category={product.category}
                  inStock={!!product.stock_quantity && product.stock_quantity > 0}
                  onFavoriteToggle={handleFavoriteToggle}
                  onAddToCart={handleAddToCart}
                />
              );
            })}
          </div>
        )}

        {/* Load More */}
        <div className="text-center mt-12">
          <Button className="btn-farm px-8 py-3">
            Ko'proq yuklash
          </Button>
        </div>
      </div>

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Buyurtma berish
            </DialogTitle>
            <DialogDescription>
              Buyurtma ma'lumotlarini tasdiqlang
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-6 py-4">
              {/* Product Info */}
              <div className="flex gap-4">
                <img
                  src={selectedProduct.image_url || '/placeholder.svg'}
                  alt={selectedProduct.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedProduct.title}</h3>
                  <p className="text-sm text-muted-foreground">Fermer</p>
                  <p className="text-lg font-bold text-primary mt-1">
                    {selectedProduct.price.toLocaleString()} so'm/{selectedProduct.unit}
                  </p>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Miqdor ({selectedProduct.unit})</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-center w-24"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Total */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Jami:</span>
                  <span className="text-2xl font-bold text-primary">
                    {(selectedProduct.price * quantity).toLocaleString()} so'm
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOrderDialogOpen(false)}
              disabled={isOrdering}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handlePlaceOrder}
              disabled={isOrdering}
              className="btn-farm"
            >
              {isOrdering ? "Yuborilmoqda..." : "Buyurtma berish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Marketplace;