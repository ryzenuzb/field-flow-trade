import { useState } from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "@/components/ui/product-card";

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  // Mock data for products
  const products = [
    {
      id: "1",
      name: "Organik pomidor",
      price: 15000,
      unit: "kg",
      image: "/api/placeholder/300/200",
      seller: "Ali Valiyev",
      location: "Toshkent vil.",
      rating: 4.8,
      category: "Sabzavot",
      inStock: true,
    },
    {
      id: "2",
      name: "Yangi bug'doy",
      price: 3500,
      unit: "kg",
      image: "/api/placeholder/300/200",
      seller: "Karim Abdullayev",
      location: "Sirdaryo vil.",
      rating: 4.9,
      category: "Don",
      inStock: true,
    },
    {
      id: "3",
      name: "Toza mol suti",
      price: 8000,
      unit: "litr",
      image: "/api/placeholder/300/200",
      seller: "Nodira Tosheva",
      location: "Samarqand vil.",
      rating: 4.7,
      category: "Sut mahsuloti",
      inStock: true,
    },
    {
      id: "4",
      name: "Shirinoy",
      price: 25000,
      unit: "kg",
      image: "/api/placeholder/300/200",
      seller: "Bobur Rahimov",
      location: "Farg'ona vil.",
      rating: 4.6,
      category: "Meva",
      inStock: false,
    },
    {
      id: "5",
      name: "Organik sabzi",
      price: 12000,
      unit: "kg",
      image: "/api/placeholder/300/200",
      seller: "Feruza Nazarova",
      location: "Qashqadaryo vil.",
      rating: 4.8,
      category: "Sabzavot",
      inStock: true,
    },
    {
      id: "6",
      name: "Paxta urug'i",
      price: 5500,
      unit: "kg",
      image: "/api/placeholder/300/200",
      seller: "Sanjar Ismoilov",
      location: "Buxoro vil.",
      rating: 4.5,
      category: "Urug'",
      inStock: true,
    },
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
    console.log("Add to cart:", id);
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
    </div>
  );
};

export default Marketplace;