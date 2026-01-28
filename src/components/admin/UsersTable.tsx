import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { User, MapPin, Phone, Ban, CheckCircle, Loader2, ShieldAlert, Mail, UserCog, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email?: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
  is_blocked?: boolean;
  blocked_at?: string | null;
  block_reason?: string | null;
  roles?: { role: string }[];
}

interface UsersTableProps {
  users: UserProfile[];
  onRefresh?: () => void;
  isMainAdmin?: boolean;
  isSubAdmin?: boolean;
  currentUserId?: string | null;
}

export const UsersTable = ({ users, onRefresh, isMainAdmin = false, isSubAdmin = false, currentUserId }: UsersTableProps) => {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [subAdminDialogOpen, setSubAdminDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getRoleBadge = (roles?: { role: string }[]) => {
    if (!roles || roles.length === 0) {
      return <Badge variant="outline">Xaridor</Badge>;
    }

    return (
      <div className="flex gap-1 flex-wrap">
        {roles.map((r, idx) => (
          <Badge
            key={idx}
            variant={
              r.role === "admin" ? "destructive" : 
              r.role === "sub_admin" ? "default" :
              r.role === "farmer" ? "secondary" : "outline"
            }
            className={r.role === "sub_admin" ? "bg-amber-500 hover:bg-amber-600" : ""}
          >
            {r.role === "admin" ? "Asosiy Admin" : 
             r.role === "sub_admin" ? "Kichik Admin" :
             r.role === "farmer" ? "Fermer" : "Xaridor"}
          </Badge>
        ))}
      </div>
    );
  };

  const isUserSubAdmin = (user: UserProfile | null) => user?.roles?.some((r) => r.role === "sub_admin") ?? false;

  const handleSubAdminClick = (user: UserProfile) => {
    setSelectedUser(user);
    setSubAdminDialogOpen(true);
  };

  const handleToggleSubAdmin = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const hasSubAdminRole = isUserSubAdmin(selectedUser);
      
      if (hasSubAdminRole) {
        // Remove sub_admin role
        const { error } = await supabase.rpc("remove_sub_admin_role", {
          target_user_id: selectedUser.user_id,
        });
        if (error) throw error;
        
        toast({
          title: "Muvaffaqiyatli",
          description: `${selectedUser.full_name} kichik admin rolidan olib tashlandi`,
        });
      } else {
        // Add sub_admin role
        const { error } = await supabase.rpc("assign_sub_admin_role", {
          target_user_id: selectedUser.user_id,
        });
        if (error) throw error;
        
        toast({
          title: "Muvaffaqiyatli",
          description: `${selectedUser.full_name} kichik admin sifatida tayinlandi`,
        });
      }

      setSubAdminDialogOpen(false);
      setSelectedUser(null);
      onRefresh?.();
    } catch (error: any) {
      console.error("Sub-admin toggle error:", error);
      toast({
        title: "Xatolik",
        description: error.message || "Kichik admin rolini o'zgartirishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockClick = (user: UserProfile) => {
    setSelectedUser(user);
    setBlockReason(user.block_reason || "");
    setBlockDialogOpen(true);
  };

  const sendBlockNotification = async (user: UserProfile, isBlocked: boolean, reason?: string) => {
    // Only send if user has email
    if (!user.email) {
      console.log("No email found for user, skipping notification");
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("send-block-notification", {
        body: {
          email: user.email,
          fullName: user.full_name,
          blockReason: reason,
          isBlocked: isBlocked,
        },
      });

      if (error) {
        console.error("Email notification error:", error);
      } else {
        console.log("Block notification sent successfully to:", user.email);
      }
    } catch (err) {
      console.error("Failed to send block notification:", err);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const newBlockedStatus = !selectedUser.is_blocked;

      const { error } = await supabase
        .from("profiles")
        .update({
          is_blocked: newBlockedStatus,
          blocked_at: selectedUser.is_blocked ? null : new Date().toISOString(),
          blocked_by: selectedUser.is_blocked ? null : currentUser?.id,
          block_reason: selectedUser.is_blocked ? null : blockReason || null,
        })
        .eq("id", selectedUser.id);

      if (error) throw error;

      // Send email notification in background
      sendBlockNotification(selectedUser, newBlockedStatus, blockReason);

      toast({
        title: "Muvaffaqiyatli",
        description: selectedUser.is_blocked
          ? `${selectedUser.full_name} blokdan chiqarildi`
          : `${selectedUser.full_name} bloklandi. Email xabar yuborildi.`,
      });

      setBlockDialogOpen(false);
      setBlockReason("");
      setSelectedUser(null);
      onRefresh?.();
    } catch (error) {
      console.error("Block user error:", error);
      toast({
        title: "Xatolik",
        description: "Foydalanuvchini bloklashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = (user: UserProfile) => user.roles?.some((r) => r.role === "admin");

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Foydalanuvchilar ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Foydalanuvchilar topilmadi
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ism</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Joylashuv</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Ro'yxatdan o'tgan</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className={user.is_blocked ? "bg-destructive/5" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            user.is_blocked ? "bg-destructive/10" : "bg-primary/10"
                          }`}>
                            {user.is_blocked ? (
                              <Ban className="h-4 w-4 text-destructive" />
                            ) : (
                              <User className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <span className={`font-medium ${user.is_blocked ? "text-muted-foreground line-through" : ""}`}>
                            {user.full_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.email ? (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="text-sm">{user.email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.phone ? (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {user.location ? (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {user.location}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{getRoleBadge(user.roles)}</TableCell>
                      <TableCell>
                        {user.is_blocked ? (
                          <Badge variant="destructive" className="gap-1">
                            <ShieldAlert className="h-3 w-3" />
                            Bloklangan
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Faol
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.created_at), "dd.MM.yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {/* Sub-admin toggle - only for main admin */}
                          {isMainAdmin && !isAdmin(user) && user.user_id !== currentUserId && (
                            <Button
                              variant={isUserSubAdmin(user) ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => handleSubAdminClick(user)}
                              className={isUserSubAdmin(user) ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
                            >
                              <UserCog className="h-4 w-4 mr-1" />
                              {isUserSubAdmin(user) ? "Kichik Admin" : "Admin qilish"}
                            </Button>
                          )}
                          {/* Block toggle - admins can't be blocked, sub-admins can't block */}
                          {!isAdmin(user) && !isSubAdmin && (
                            <Button
                              variant={user.is_blocked ? "outline" : "destructive"}
                              size="sm"
                              onClick={() => handleBlockClick(user)}
                            >
                              {user.is_blocked ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Blokdan chiqarish
                                </>
                              ) : (
                                <>
                                  <Ban className="h-4 w-4 mr-1" />
                                  Bloklash
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedUser?.is_blocked ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Blokdan chiqarish
                </>
              ) : (
                <>
                  <Ban className="h-5 w-5 text-destructive" />
                  Foydalanuvchini bloklash
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.is_blocked
                ? `${selectedUser?.full_name} ni blokdan chiqarmoqchimisiz?`
                : `${selectedUser?.full_name} ni bloklash. Bloklangan foydalanuvchilar tizimga kira olmaydi.`}
            </DialogDescription>
          </DialogHeader>

          {!selectedUser?.is_blocked && (
            <div className="space-y-2">
              <Label htmlFor="blockReason">Bloklash sababi (ixtiyoriy)</Label>
              <Textarea
                id="blockReason"
                placeholder="Bloklash sababini kiriting..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {selectedUser?.is_blocked && selectedUser.block_reason && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Bloklash sababi:</strong> {selectedUser.block_reason}
              </p>
              {selectedUser.blocked_at && (
                <p className="text-sm text-muted-foreground mt-1">
                  <strong>Bloklangan sana:</strong> {format(new Date(selectedUser.blocked_at), "dd.MM.yyyy HH:mm")}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)} disabled={loading}>
              Bekor qilish
            </Button>
            <Button
              variant={selectedUser?.is_blocked ? "default" : "destructive"}
              onClick={handleBlockUser}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedUser?.is_blocked ? "Blokdan chiqarish" : "Bloklash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sub-Admin Dialog */}
      <Dialog open={subAdminDialogOpen} onOpenChange={setSubAdminDialogOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              {isUserSubAdmin(selectedUser) ? "Kichik admin rolini olib tashlash" : "Kichik admin tayinlash"}
            </DialogTitle>
            <DialogDescription>
              {isUserSubAdmin(selectedUser)
                ? `${selectedUser?.full_name} ning kichik admin huquqlarini olib tashlamoqchimisiz?`
                : `${selectedUser?.full_name} ni kichik admin sifatida tayinlamoqchimisiz? Kichik adminlar cheklangan huquqlarga ega bo'ladi.`}
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">Kichik admin huquqlari:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Mahsulotlarni ko'rish va moderatsiya qilish</li>
              <li>Buyurtmalarni ko'rish</li>
              <li>Sotuvchi tasdiqlashlarini ko'rib chiqish</li>
            </ul>
            <p className="text-sm font-medium mt-3">Cheklangan huquqlar:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li className="text-destructive">Foydalanuvchilarni bloklash mumkin emas</li>
              <li className="text-destructive">Ma'lumotlarni eksport qilish mumkin emas</li>
              <li className="text-destructive">Ommaviy xabar yuborish mumkin emas</li>
              <li className="text-destructive">Boshqa adminlarni tayinlash mumkin emas</li>
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSubAdminDialogOpen(false)} disabled={loading}>
              Bekor qilish
            </Button>
            <Button
              variant={isUserSubAdmin(selectedUser) ? "destructive" : "default"}
              onClick={handleToggleSubAdmin}
              disabled={loading}
              className={!isUserSubAdmin(selectedUser) ? "bg-amber-500 hover:bg-amber-600" : ""}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isUserSubAdmin(selectedUser) ? "Huquqni olib tashlash" : "Tayinlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
