import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { User, MapPin, Phone } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  location: string | null;
  created_at: string;
  roles?: { role: string }[];
}

interface UsersTableProps {
  users: UserProfile[];
}

export const UsersTable = ({ users }: UsersTableProps) => {
  const getRoleBadge = (roles?: { role: string }[]) => {
    if (!roles || roles.length === 0) {
      return <Badge variant="outline">Xaridor</Badge>;
    }

    return (
      <div className="flex gap-1 flex-wrap">
        {roles.map((r, idx) => (
          <Badge
            key={idx}
            variant={r.role === "admin" ? "destructive" : r.role === "farmer" ? "default" : "secondary"}
          >
            {r.role === "admin" ? "Admin" : r.role === "farmer" ? "Fermer" : "Xaridor"}
          </Badge>
        ))}
      </div>
    );
  };

  return (
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
                  <TableHead>Telefon</TableHead>
                  <TableHead>Joylashuv</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Ro'yxatdan o'tgan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{user.full_name}</span>
                      </div>
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
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), "dd.MM.yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
