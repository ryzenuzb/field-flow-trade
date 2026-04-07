import { LucideIcon, Package, ShoppingBag, MessageSquare, Users, FileText, Search } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

const EmptyState = ({ icon: Icon = Package, title, description, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-4 rounded-full bg-muted mb-4">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
};

export const presets = {
  products: {
    icon: Package,
    title: "Mahsulotlar topilmadi",
    description: "Hozircha hech qanday mahsulot qo'shilmagan. Yangi mahsulot qo'shishni boshlang!",
  },
  orders: {
    icon: ShoppingBag,
    title: "Buyurtmalar yo'q",
    description: "Hozircha buyurtmalar mavjud emas. Yangi buyurtmalar kelganda bu yerda ko'rsatiladi.",
  },
  messages: {
    icon: MessageSquare,
    title: "Xabarlar yo'q",
    description: "Hech kim bilan suhbat boshlanmagan. Biror kishiga xabar yozing!",
  },
  users: {
    icon: Users,
    title: "Foydalanuvchilar topilmadi",
    description: "Ushbu filtr bo'yicha foydalanuvchilar topilmadi.",
  },
  search: {
    icon: Search,
    title: "Natija topilmadi",
    description: "Qidiruv so'rovingiz bo'yicha hech narsa topilmadi. Boshqa kalit so'z bilan urinib ko'ring.",
  },
  soil: {
    icon: FileText,
    title: "So'rovlar yo'q",
    description: "Hozircha tuproq tekshiruv so'rovlari yo'q.",
  },
};

export default EmptyState;
