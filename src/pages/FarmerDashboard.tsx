import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Package, ShoppingCart, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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
  products: {
    title: string;
    unit: string;
  };
}

const FarmerDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    unit: "kg",
    category: "Sabzavot",
    stock_quantity: "",
    location: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchProducts();
    }
  }, [userId]);

  useEffect(() => {
    if (userId && products.length > 0) {
      fetchOrders();
    }
  }, [userId, products]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Kirish kerak",
        description: "Ushbu sahifaga kirish uchun tizimga kirishingiz kerak",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Check if user has farmer role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'farmer')
      .single();

    if (!roleData) {
      toast({
        title: "Ruxsat yo'q",
        description: "Ushbu sahifaga faqat fermerlar kira oladi",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setUserId(user.id);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
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

  const fetchOrders = async () => {
    if (!userId || products.length === 0) return;
    
    try {
      const productIds = products.map(p => p.id);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products (
            title,
            unit
          )
        `)
        .in('product_id', productIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Buyurtmalarni yuklashda xatolik:', error);
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
    } else {
      setEditingProduct(null);
      setFormData({
        title: "",
        description: "",
        price: "",
        unit: "kg",
        category: "Sabzavot",
        stock_quantity: "",
        location: "",
      });
    }
    setProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.title || !formData.price || !formData.stock_quantity) {
      toast({
        title: "Xatolik",
        description: "Barcha majburiy maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }

    try {
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
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: "Muvaffaqiyatli!",
          description: "Mahsulot yangilandi",
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;

        toast({
          title: "Muvaffaqiyatli!",
          description: "Mahsulot qo'shildi",
        });
      }

      setProductDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error('Mahsulotni saqlashda xatolik:', error);
      toast({
        title: "Xatolik",
        description: error.message || "Mahsulotni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Ushbu mahsulotni o'chirmoqchimisiz?")) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyatli!",
        description: "Mahsulot o'chirildi",
      });
      fetchProducts();
    } catch (error: any) {
      console.error('Mahsulotni o\'chirishda xatolik:', error);
      toast({
        title: "Xatolik",
        description: error.message || "Mahsulotni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_price, 0);

  return (
    <div className="min-h-screen bg-background">
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
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami mahsulotlar</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                {activeProducts} faol
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Buyurtmalar</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                Jami buyurtmalar soni
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daromad</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} so'm</div>
              <p className="text-xs text-muted-foreground">
                Jami daromad
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">O'rtacha</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalOrders > 0 ? Math.round(totalRevenue / totalOrders).toLocaleString() : 0} so'm
              </div>
              <p className="text-xs text-muted-foreground">
                Har bir buyurtma
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Mening mahsulotlarim</CardTitle>
            <CardDescription>
              Mahsulotlaringizni boshqaring va tahrirlang
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomi</TableHead>
                  <TableHead>Kategoriya</TableHead>
                  <TableHead>Narx</TableHead>
                  <TableHead>Zaxira</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Hozircha mahsulotlar yo'q
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.title}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.price.toLocaleString()} so'm/{product.unit}</TableCell>
                      <TableCell>{product.stock_quantity || 0}</TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Faol" : "Nofaol"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Buyurtmalar</CardTitle>
            <CardDescription>
              Mahsulotlaringiz uchun qabul qilingan buyurtmalar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mahsulot</TableHead>
                  <TableHead>Miqdor</TableHead>
                  <TableHead>Jami narx</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Sana</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Hozircha buyurtmalar yo'q
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.products.title}</TableCell>
                      <TableCell>{order.quantity} {order.products.unit}</TableCell>
                      <TableCell>{order.total_price.toLocaleString()} so'm</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'pending' ? "secondary" : "default"}>
                          {order.status === 'pending' ? 'Kutilmoqda' : order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString('uz-UZ')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
            </DialogTitle>
            <DialogDescription>
              Mahsulot ma'lumotlarini kiriting
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Nomi *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Masalan: Organik pomidor"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Tavsif</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mahsulot haqida qo'shimcha ma'lumot"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Narx *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="15000"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="unit">O'lchov birligi *</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="litr">litr</SelectItem>
                    <SelectItem value="dona">dona</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Kategoriya *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sabzavot">Sabzavot</SelectItem>
                    <SelectItem value="Meva">Meva</SelectItem>
                    <SelectItem value="Don">Don</SelectItem>
                    <SelectItem value="Sut mahsuloti">Sut mahsuloti</SelectItem>
                    <SelectItem value="Urug'">Urug'</SelectItem>
                    <SelectItem value="Boshqa">Boshqa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="stock">Zaxira *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Joylashuv</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Toshkent vil."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProductDialogOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button onClick={handleSaveProduct} className="btn-farm">
              {editingProduct ? "Saqlash" : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FarmerDashboard;
