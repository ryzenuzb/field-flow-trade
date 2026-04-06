import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { WeatherWidget } from "@/components/WeatherWidget";
import { CropCalendar } from "@/components/CropCalendar";
import { FarmerStats } from "@/components/farmer/FarmerStats";
import { FarmerProductsTable } from "@/components/farmer/FarmerProductsTable";
import { FarmerOrdersTable } from "@/components/farmer/FarmerOrdersTable";
import { ProductFormDialog } from "@/components/farmer/ProductFormDialog";
import { ArrowLeft, Home, MessageCircle } from "lucide-react";
import { useRequireRole } from "@/hooks/useAuth";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  unit: string;
  category: string;
  stock_quantity: number | null;
  location: string | null;
  image_url: string | null;
  is_active: boolean | null;
}

interface Order {
  id: string;
  quantity: number;
  total_price: number;
  status: string | null;
  created_at: string;
  products: { title: string; unit: string };
}

const FarmerDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const auth = useRequireRole("farmer", "/auth");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    unit: "kg",
    category: "Sabzavot",
    stock_quantity: "",
    location: "",
  });

  const userId = auth.user?.id;

  useEffect(() => {
    if (userId) fetchProducts();
  }, [userId]);

  useEffect(() => {
    if (userId && products.length > 0) fetchOrders();
  }, [userId, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({ title: "Xatolik", description: "Mahsulotlarni yuklashda xatolik", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!userId || products.length === 0) return;
    try {
      const productIds = products.map((p) => p.id);
      const { data, error } = await supabase
        .from("orders")
        .select("*, products(title, unit)")
        .in("product_id", productIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Buyurtmalarni yuklashda xatolik:", error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase.functions.invoke("update-order-status", {
        body: { order_id: orderId, status },
      });
      if (error) throw error;
      const msgs: Record<string, string> = {
        processing: "Buyurtma qabul qilindi",
        shipped: "Buyurtma yuborildi",
        delivered: "Buyurtma yetkazildi",
        cancelled: "Buyurtma rad etildi",
      };
      toast({ title: "Muvaffaqiyatli!", description: msgs[status] || "Holat yangilandi" });
      fetchOrders();
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message || "Holat yangilashda xatolik", variant: "destructive" });
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        title: product.title,
        description: product.description || "",
        price: product.price.toString(),
        unit: product.unit,
        category: product.category,
        stock_quantity: product.stock_quantity?.toString() || "",
        location: product.location || "",
      });
      setImagePreview(product.image_url || null);
    } else {
      setEditingProduct(null);
      setFormData({ title: "", description: "", price: "", unit: "kg", category: "Sabzavot", stock_quantity: "", location: "" });
      setImagePreview(null);
    }
    setImageFile(null);
    setProductDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Xatolik", description: "Rasm hajmi 5MB dan oshmasligi kerak", variant: "destructive" });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from("product-images").upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(fileName);
      return publicUrl;
    } catch {
      return null;
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.title || !formData.price || !formData.stock_quantity) {
      toast({ title: "Xatolik", description: "Barcha majburiy maydonlarni to'ldiring", variant: "destructive" });
      return;
    }
    try {
      setUploading(true);
      let imageUrl = editingProduct?.image_url || null;
      if (imageFile) {
        const uploaded = await uploadImage(imageFile);
        if (uploaded) imageUrl = uploaded;
      } else if (!imagePreview && editingProduct?.image_url) {
        imageUrl = null;
      }

      const productData = {
        title: formData.title,
        description: formData.description || null,
        price: parseFloat(formData.price),
        unit: formData.unit,
        category: formData.category,
        stock_quantity: parseInt(formData.stock_quantity),
        location: formData.location || null,
        seller_id: userId,
        is_active: true,
        image_url: imageUrl,
      };

      if (editingProduct) {
        const { error } = await supabase.from("products").update(productData).eq("id", editingProduct.id);
        if (error) throw error;
        toast({ title: "Muvaffaqiyatli!", description: "Mahsulot yangilandi" });
      } else {
        const { error } = await supabase.from("products").insert(productData);
        if (error) throw error;
        toast({ title: "Muvaffaqiyatli!", description: "Mahsulot qo'shildi" });
      }
      setProductDialogOpen(false);
      setImageFile(null);
      setImagePreview(null);
      fetchProducts();
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message || "Saqlashda xatolik", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Ushbu mahsulotni o'chirmoqchimisiz?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
      toast({ title: "Muvaffaqiyatli!", description: "Mahsulot o'chirildi" });
      fetchProducts();
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message || "O'chirishda xatolik", variant: "destructive" });
    }
  };

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.is_active).length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_price, 0);

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Ortga
              </Button>
              <div className="h-4 w-px bg-border" />
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Home className="w-4 h-4" />
                  Bosh sahifa
                </Button>
              </Link>
              <Link to="/chat">
                <Button variant="ghost" size="sm" className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="section-field border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-poppins font-bold text-foreground">
                Fermer <span className="gradient-text">Paneli</span>
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Mahsulotlaringizni boshqaring va buyurtmalarni kuzating
              </p>
            </div>
            <Button onClick={() => handleOpenDialog()} className="btn-farm">
              <Plus className="w-4 h-4 mr-2" />
              Yangi mahsulot
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8"><WeatherWidget /></div>
        <div className="mb-8"><CropCalendar /></div>

        <FarmerStats
          totalProducts={totalProducts}
          activeProducts={activeProducts}
          totalOrders={totalOrders}
          totalRevenue={totalRevenue}
        />

        <FarmerProductsTable
          products={products}
          onEdit={handleOpenDialog}
          onDelete={handleDeleteProduct}
        />

        <FarmerOrdersTable orders={orders} onUpdateStatus={updateOrderStatus} />
      </div>

      <ProductFormDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        formData={formData}
        setFormData={setFormData}
        imagePreview={imagePreview}
        onImageChange={handleImageChange}
        onRemoveImage={removeImage}
        onSave={handleSaveProduct}
        isEditing={!!editingProduct}
        uploading={uploading}
      />
    </div>
  );
};

export default FarmerDashboard;
