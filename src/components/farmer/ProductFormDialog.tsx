import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X } from "lucide-react";

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  unit: string;
  category: string;
  stock_quantity: string;
  location: string;
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ProductFormData;
  setFormData: (data: ProductFormData) => void;
  imagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onSave: () => void;
  isEditing: boolean;
  uploading: boolean;
}

export const ProductFormDialog = ({
  open,
  onOpenChange,
  formData,
  setFormData,
  imagePreview,
  onImageChange,
  onRemoveImage,
  onSave,
  isEditing,
  uploading,
}: ProductFormDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}</DialogTitle>
          <DialogDescription>Mahsulot ma'lumotlarini kiriting</DialogDescription>
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
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="tonna">tonna</SelectItem>
                  <SelectItem value="litr">litr</SelectItem>
                  <SelectItem value="dona">dona</SelectItem>
                  <SelectItem value="paket">paket</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Kategoriya *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Label htmlFor="location">Viloyat</Label>
            <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
              <SelectTrigger><SelectValue placeholder="Viloyatni tanlang" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Toshkent shahri">Toshkent shahri</SelectItem>
                <SelectItem value="Toshkent viloyati">Toshkent viloyati</SelectItem>
                <SelectItem value="Andijon viloyati">Andijon viloyati</SelectItem>
                <SelectItem value="Buxoro viloyati">Buxoro viloyati</SelectItem>
                <SelectItem value="Farg'ona viloyati">Farg'ona viloyati</SelectItem>
                <SelectItem value="Jizzax viloyati">Jizzax viloyati</SelectItem>
                <SelectItem value="Xorazm viloyati">Xorazm viloyati</SelectItem>
                <SelectItem value="Namangan viloyati">Namangan viloyati</SelectItem>
                <SelectItem value="Navoiy viloyati">Navoiy viloyati</SelectItem>
                <SelectItem value="Qashqadaryo viloyati">Qashqadaryo viloyati</SelectItem>
                <SelectItem value="Qoraqalpog'iston">Qoraqalpog'iston</SelectItem>
                <SelectItem value="Samarqand viloyati">Samarqand viloyati</SelectItem>
                <SelectItem value="Sirdaryo viloyati">Sirdaryo viloyati</SelectItem>
                <SelectItem value="Surxondaryo viloyati">Surxondaryo viloyati</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Mahsulot rasmi</Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onImageChange}
              accept="image/*"
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={onRemoveImage}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Rasm yuklash uchun bosing</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, max 5MB</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
          <Button onClick={onSave} className="btn-farm" disabled={uploading}>
            {uploading ? "Yuklanmoqda..." : (isEditing ? "Saqlash" : "Qo'shish")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
