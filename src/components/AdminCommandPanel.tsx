import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Users, Package, ShoppingCart, Search, Settings, LogOut, FileText } from "lucide-react";

interface AdminCommandPanelProps {
  users: any[];
  products: any[];
  orders: any[];
  onNavigate: (section: string) => void;
  onSignOut: () => void;
  onSearchUser: (userId: string) => void;
  onSearchProduct: (productId: string) => void;
  onSearchOrder: (orderId: string) => void;
}

export function AdminCommandPanel({
  users,
  products,
  orders,
  onNavigate,
  onSignOut,
  onSearchUser,
  onSearchProduct,
  onSearchOrder,
}: AdminCommandPanelProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Search className="h-4 w-4" />
          <span>Qidiruv...</span>
          <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Qidirish uchun yozing..." />
        <CommandList>
          <CommandEmpty>Hech narsa topilmadi.</CommandEmpty>

          <CommandGroup heading="Navigatsiya">
            <CommandItem onSelect={() => handleSelect(() => onNavigate("users"))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Foydalanuvchilar</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect(() => onNavigate("products"))}>
              <Package className="mr-2 h-4 w-4" />
              <span>Mahsulotlar</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect(() => onNavigate("orders"))}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              <span>Buyurtmalar</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Foydalanuvchilar">
            {users.slice(0, 5).map((user) => (
              <CommandItem
                key={user.id}
                onSelect={() => handleSelect(() => onSearchUser(user.id))}
              >
                <Users className="mr-2 h-4 w-4" />
                <span>{user.full_name}</span>
                {user.location && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {user.location}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Mahsulotlar">
            {products.slice(0, 5).map((product) => (
              <CommandItem
                key={product.id}
                onSelect={() => handleSelect(() => onSearchProduct(product.id))}
              >
                <Package className="mr-2 h-4 w-4" />
                <span>{product.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {product.price} so'm
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Buyurtmalar">
            {orders.slice(0, 5).map((order) => (
              <CommandItem
                key={order.id}
                onSelect={() => handleSelect(() => onSearchOrder(order.id))}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                <span>{order.products?.title || "N/A"}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {order.total_price} so'm
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Amallar">
            <CommandItem onSelect={() => handleSelect(onSignOut)}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Chiqish</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
