import { useState, useEffect } from "react";
import { Search, Filter, SlidersHorizontal, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ui/product-card";
import productTomato from "@/assets/product-tomato.jpg";
import productWheat from "@/assets/product-wheat.jpg";
import productMilk from "@/assets/product-milk.jpg";
import productApricot from "@/assets/product-apricot.jpg";
import productCarrot from "@/assets/product-carrot.jpg";
import productCottonSeeds from "@/assets/product-cotton-seeds.jpg";
import productCucumber from "@/assets/product-cucumber.jpg";
import productPepper from "@/assets/product-pepper.jpg";
import productEggplant from "@/assets/product-eggplant.jpg";
import productPotato from "@/assets/product-potato.jpg";
import productOnion from "@/assets/product-onion.jpg";
import productGarlic from "@/assets/product-garlic.jpg";
import productGrapes from "@/assets/product-grapes.jpg";
import productMelon from "@/assets/product-melon.jpg";
import productWatermelon from "@/assets/product-watermelon.jpg";
import productApple from "@/assets/product-apple.jpg";
import productPeach from "@/assets/product-peach.jpg";
import productRice from "@/assets/product-rice.jpg";
import productCorn from "@/assets/product-corn.jpg";
import productBarley from "@/assets/product-barley.jpg";
import productCheese from "@/assets/product-cheese.jpg";
import productYogurt from "@/assets/product-yogurt.jpg";
import productHoney from "@/assets/product-honey.jpg";
import productEggs from "@/assets/product-eggs.jpg";
import productNuts from "@/assets/product-nuts.jpg";
import productCabbage from "@/assets/product-cabbage.jpg";

const Marketplace = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  // Mock data for products
  const products = [
    { id: "1", name: "Organik pomidor", price: 15000, unit: "kg", image: productTomato, seller: "Ali Valiyev", location: "Toshkent vil.", rating: 4.8, category: "Sabzavot", inStock: true },
    { id: "2", name: "Yangi bug'doy", price: 3500, unit: "kg", image: productWheat, seller: "Karim Abdullayev", location: "Sirdaryo vil.", rating: 4.9, category: "Don", inStock: true },
    { id: "3", name: "Toza mol suti", price: 8000, unit: "litr", image: productMilk, seller: "Nodira Tosheva", location: "Samarqand vil.", rating: 4.7, category: "Sut mahsuloti", inStock: true },
    { id: "4", name: "Shirinoy", price: 25000, unit: "kg", image: productApricot, seller: "Bobur Rahimov", location: "Farg'ona vil.", rating: 4.6, category: "Meva", inStock: true },
    { id: "5", name: "Organik sabzi", price: 12000, unit: "kg", image: productCarrot, seller: "Feruza Nazarova", location: "Qashqadaryo vil.", rating: 4.8, category: "Sabzavot", inStock: true },
    { id: "6", name: "Paxta urug'i", price: 5500, unit: "kg", image: productCottonSeeds, seller: "Sanjar Ismoilov", location: "Buxoro vil.", rating: 4.5, category: "Urug'", inStock: true },
    { id: "7", name: "Yangi bodring", price: 10000, unit: "kg", image: productCucumber, seller: "Dilshod Karimov", location: "Andijon vil.", rating: 4.7, category: "Sabzavot", inStock: true },
    { id: "8", name: "Rangli qalampir", price: 18000, unit: "kg", image: productPepper, seller: "Zarina Rustamova", location: "Toshkent vil.", rating: 4.9, category: "Sabzavot", inStock: true },
    { id: "9", name: "Qora baqlajon", price: 13000, unit: "kg", image: productEggplant, seller: "Shavkat Mahmudov", location: "Namangan vil.", rating: 4.6, category: "Sabzavot", inStock: true },
    { id: "10", name: "Yangi kartoshka", price: 7000, unit: "kg", image: productPotato, seller: "Gulnora Azimova", location: "Jizzax vil.", rating: 4.8, category: "Sabzavot", inStock: true },
    { id: "11", name: "Sariq piyoz", price: 6000, unit: "kg", image: productOnion, seller: "Anvar Tursunov", location: "Surxondaryo vil.", rating: 4.5, category: "Sabzavot", inStock: true },
    { id: "12", name: "Sarimsoq", price: 22000, unit: "kg", image: productGarlic, seller: "Malika Akbarova", location: "Qashqadaryo vil.", rating: 4.7, category: "Sabzavot", inStock: true },
    { id: "13", name: "Yashil uzum", price: 20000, unit: "kg", image: productGrapes, seller: "Rustam Yo'ldoshev", location: "Samarqand vil.", rating: 4.9, category: "Meva", inStock: true },
    { id: "14", name: "Qovun", price: 15000, unit: "kg", image: productMelon, seller: "Dilbar Saidova", location: "Xorazm vil.", rating: 4.8, category: "Meva", inStock: true },
    { id: "15", name: "Tarvuz", price: 12000, unit: "kg", image: productWatermelon, seller: "Otabek Hasanov", location: "Qoraqalpog'iston", rating: 4.6, category: "Meva", inStock: true },
    { id: "16", name: "Qizil olma", price: 16000, unit: "kg", image: productApple, seller: "Umida Rahimova", location: "Farg'ona vil.", rating: 4.9, category: "Meva", inStock: true },
    { id: "17", name: "Shaftoli", price: 24000, unit: "kg", image: productPeach, seller: "Jasur Normatov", location: "Andijon vil.", rating: 4.7, category: "Meva", inStock: true },
    { id: "18", name: "Oq guruch", price: 4500, unit: "kg", image: productRice, seller: "Sardor Ismoilov", location: "Sirdaryo vil.", rating: 4.8, category: "Don", inStock: true },
    { id: "19", name: "Makkajo'xori", price: 6500, unit: "kg", image: productCorn, seller: "Nargiza Qodirova", location: "Toshkent vil.", rating: 4.6, category: "Sabzavot", inStock: true },
    { id: "20", name: "Arpa donasi", price: 3200, unit: "kg", image: productBarley, seller: "Bahrom Umarov", location: "Samarqand vil.", rating: 4.5, category: "Don", inStock: true },
    { id: "21", name: "Qo'y pishloqi", price: 45000, unit: "kg", image: productCheese, seller: "Laylo Yusupova", location: "Buxoro vil.", rating: 4.9, category: "Sut mahsuloti", inStock: true },
    { id: "22", name: "Qatiq", price: 12000, unit: "litr", image: productYogurt, seller: "Jamshid Aliyev", location: "Namangan vil.", rating: 4.7, category: "Sut mahsuloti", inStock: true },
    { id: "23", name: "Tabiiy asal", price: 80000, unit: "kg", image: productHoney, seller: "Shoira Karimova", location: "Qashqadaryo vil.", rating: 4.9, category: "Boshqa", inStock: true },
    { id: "24", name: "Uy tovuq tuxumi", price: 2000, unit: "dona", image: productEggs, seller: "Abdulla Sharipov", location: "Toshkent vil.", rating: 4.8, category: "Boshqa", inStock: true },
    { id: "25", name: "Yong'oq aralashmasi", price: 65000, unit: "kg", image: productNuts, seller: "Munira Hasanova", location: "Farg'ona vil.", rating: 4.8, category: "Boshqa", inStock: true },
    { id: "26", name: "Yashil karam", price: 9000, unit: "kg", image: productCabbage, seller: "Davron Tojiyev", location: "Andijon vil.", rating: 4.6, category: "Sabzavot", inStock: true },
    { id: "27", name: "Cherry pomidor", price: 18000, unit: "kg", image: productTomato, seller: "Aziza Saidova", location: "Toshkent vil.", rating: 4.9, category: "Sabzavot", inStock: true },
    { id: "28", name: "Qora bug'doy", price: 4000, unit: "kg", image: productWheat, seller: "Nodir Mahmudov", location: "Sirdaryo vil.", rating: 4.7, category: "Don", inStock: true },
    { id: "29", name: "Qaymoq", price: 35000, unit: "kg", image: productMilk, seller: "Gulnara Azimova", location: "Samarqand vil.", rating: 4.8, category: "Sut mahsuloti", inStock: true },
    { id: "30", name: "O'rik quritilgan", price: 45000, unit: "kg", image: productApricot, seller: "Akmal Yo'ldoshev", location: "Farg'ona vil.", rating: 4.6, category: "Meva", inStock: true },
    { id: "31", name: "Turp", price: 8000, unit: "kg", image: productCarrot, seller: "Dildora Karimova", location: "Qashqadaryo vil.", rating: 4.5, category: "Sabzavot", inStock: true },
    { id: "32", name: "Kungaboqar urug'i", price: 7500, unit: "kg", image: productCottonSeeds, seller: "Rustam Normatov", location: "Buxoro vil.", rating: 4.7, category: "Urug'", inStock: true },
    { id: "33", name: "Qizil bodring", price: 11000, unit: "kg", image: productCucumber, seller: "Madina Tursunova", location: "Andijon vil.", rating: 4.8, category: "Sabzavot", inStock: true },
    { id: "34", name: "Achchiq qalampir", price: 25000, unit: "kg", image: productPepper, seller: "Sardor Aliyev", location: "Toshkent vil.", rating: 4.9, category: "Sabzavot", inStock: true },
    { id: "35", name: "Oq baqlajon", price: 14000, unit: "kg", image: productEggplant, seller: "Nilufar Hasanova", location: "Namangan vil.", rating: 4.6, category: "Sabzavot", inStock: true },
    { id: "36", name: "Qizil kartoshka", price: 8500, unit: "kg", image: productPotato, seller: "Jamila Yo'ldosheva", location: "Jizzax vil.", rating: 4.7, category: "Sabzavot", inStock: true },
    { id: "37", name: "Qizil piyoz", price: 7000, unit: "kg", image: productOnion, seller: "Ulug'bek Karimov", location: "Surxondaryo vil.", rating: 4.6, category: "Sabzavot", inStock: true },
    { id: "38", name: "Yashil sarimsoq", price: 20000, unit: "kg", image: productGarlic, seller: "Shahlo Azimova", location: "Qashqadaryo vil.", rating: 4.8, category: "Sabzavot", inStock: true },
    { id: "39", name: "Qora uzum", price: 28000, unit: "kg", image: productGrapes, seller: "Alisher Mahmudov", location: "Samarqand vil.", rating: 4.9, category: "Meva", inStock: true },
    { id: "40", name: "Kok qovun", price: 13000, unit: "kg", image: productMelon, seller: "Farida Rustamova", location: "Xorazm vil.", rating: 4.7, category: "Meva", inStock: true },
    { id: "41", name: "Qora tarvuz", price: 14000, unit: "kg", image: productWatermelon, seller: "Davron Normatov", location: "Qoraqalpog'iston", rating: 4.8, category: "Meva", inStock: true },
    { id: "42", name: "Yashil olma", price: 14000, unit: "kg", image: productApple, seller: "Zebo Hasanova", location: "Farg'ona vil.", rating: 4.8, category: "Meva", inStock: true },
    { id: "43", name: "Nektarin", price: 26000, unit: "kg", image: productPeach, seller: "Sanjar Yo'ldoshev", location: "Andijon vil.", rating: 4.9, category: "Meva", inStock: true },
    { id: "44", name: "Javdar guruchi", price: 5000, unit: "kg", image: productRice, seller: "Mohira Saidova", location: "Sirdaryo vil.", rating: 4.7, category: "Don", inStock: true },
    { id: "45", name: "Qaynatma makkajo'xori", price: 5000, unit: "kg", image: productCorn, seller: "Bekzod Karimov", location: "Toshkent vil.", rating: 4.6, category: "Sabzavot", inStock: true },
    { id: "46", name: "Bug'doy uni", price: 4800, unit: "kg", image: productBarley, seller: "Gulnoza Azimova", location: "Samarqand vil.", rating: 4.8, category: "Don", inStock: true },
    { id: "47", name: "Suzma", price: 25000, unit: "kg", image: productCheese, seller: "Jasurbek Mahmudov", location: "Buxoro vil.", rating: 4.9, category: "Sut mahsuloti", inStock: true },
    { id: "48", name: "Ayran", price: 6000, unit: "litr", image: productYogurt, seller: "Dilorom Rustamova", location: "Namangan vil.", rating: 4.7, category: "Sut mahsuloti", inStock: true },
    { id: "49", name: "Tog' asali", price: 95000, unit: "kg", image: productHoney, seller: "Abdurashid Normatov", location: "Qashqadaryo vil.", rating: 5.0, category: "Boshqa", inStock: true },
    { id: "50", name: "Bedana tuxumi", price: 2500, unit: "dona", image: productEggs, seller: "Sevara Hasanova", location: "Toshkent vil.", rating: 4.8, category: "Boshqa", inStock: true },
    { id: "51", name: "Bodom", price: 85000, unit: "kg", image: productNuts, seller: "Otabek Yo'ldoshev", location: "Farg'ona vil.", rating: 4.9, category: "Boshqa", inStock: true },
    { id: "52", name: "Qizil karam", price: 11000, unit: "kg", image: productCabbage, seller: "Komila Saidova", location: "Andijon vil.", rating: 4.7, category: "Sabzavot", inStock: true },
    { id: "53", name: "San'at pomidori", price: 16000, unit: "kg", image: productTomato, seller: "Rustam Karimov", location: "Toshkent vil.", rating: 4.8, category: "Sabzavot", inStock: true },
    { id: "54", name: "Jo'xori uni", price: 3800, unit: "kg", image: productWheat, seller: "Madina Azimova", location: "Sirdaryo vil.", rating: 4.6, category: "Don", inStock: true },
    { id: "55", name: "Qurg'oqchilik suti", price: 9000, unit: "litr", image: productMilk, seller: "Dilshod Mahmudov", location: "Samarqand vil.", rating: 4.7, category: "Sut mahsuloti", inStock: true },
  ];

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

      // For now, we'll just show a success message since products are mock data
      // In real implementation, this would call the create-order edge function
      toast({
        title: "Buyurtma qabul qilindi!",
        description: `${selectedProduct.name} uchun buyurtmangiz qabul qilindi`,
      });

      setOrderDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Order error:', error);
      toast({
        title: "Xatolik",
        description: "Buyurtma berishda xatolik yuz berdi",
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
                <SelectItem value="price-low">Narx: Kam</SelectItem>
                <SelectItem value="price-high">Narx: Yuqori</SelectItem>
                <SelectItem value="rating">Reyting</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="h-12 px-6">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtrlar
            </Button>
          </div>

          {/* Active filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Filter className="w-3 h-3 mr-1" />
              Barcha mahsulotlar
            </Badge>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              onFavoriteToggle={handleFavoriteToggle}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>

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
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedProduct.seller}</p>
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