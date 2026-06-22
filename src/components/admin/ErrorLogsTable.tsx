import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, Trash2, RefreshCw, Bug } from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/ui/empty-state";

interface ErrorLog {
  id: string;
  function_name: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  stack: string | null;
  context: any;
  user_id: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

const severityColor: Record<string, string> = {
  info: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  warning: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  error: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  critical: "bg-red-500/15 text-red-700 dark:text-red-300",
};

export const ErrorLogsTable = () => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("unresolved");
  const [selected, setSelected] = useState<ErrorLog | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("error_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error("Loglarni yuklashda xato: " + error.message);
    } else {
      setLogs((data ?? []) as ErrorLog[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("error_logs_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "error_logs" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (severityFilter !== "all" && l.severity !== severityFilter) return false;
      if (statusFilter === "resolved" && !l.resolved) return false;
      if (statusFilter === "unresolved" && l.resolved) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !l.message.toLowerCase().includes(q) &&
          !l.function_name.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [logs, severityFilter, statusFilter, search]);

  const counts = useMemo(() => {
    const c = { total: logs.length, critical: 0, error: 0, warning: 0, unresolved: 0 };
    logs.forEach((l) => {
      if (l.severity === "critical") c.critical++;
      if (l.severity === "error") c.error++;
      if (l.severity === "warning") c.warning++;
      if (!l.resolved) c.unresolved++;
    });
    return c;
  }, [logs]);

  const resolve = async (id: string, resolved: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("error_logs")
      .update({
        resolved,
        resolved_at: resolved ? new Date().toISOString() : null,
        resolved_by: resolved ? user?.id : null,
      })
      .eq("id", id);
    if (error) toast.error(error.message);
    else toast.success(resolved ? "Yopildi" : "Qayta ochildi");
  };

  const remove = async (id: string) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    const { error } = await supabase.from("error_logs").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("O'chirildi");
  };

  const clearResolved = async () => {
    if (!confirm("Barcha yopilgan loglarni o'chirilsinmi?")) return;
    const { error } = await supabase.from("error_logs").delete().eq("resolved", true);
    if (error) toast.error(error.message);
    else toast.success("Tozalandi");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Jami" value={counts.total} icon={<Bug className="h-4 w-4" />} />
        <StatCard label="Yopilmagan" value={counts.unresolved} icon={<AlertTriangle className="h-4 w-4 text-orange-500" />} />
        <StatCard label="Kritik" value={counts.critical} icon={<AlertTriangle className="h-4 w-4 text-red-500" />} />
        <StatCard label="Xato" value={counts.error} icon={<AlertTriangle className="h-4 w-4 text-orange-500" />} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" /> Backend xatolari
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="h-4 w-4 mr-1" /> Yangilash
            </Button>
            <Button variant="outline" size="sm" onClick={clearResolved}>
              <Trash2 className="h-4 w-4 mr-1" /> Yopilganlarni tozalash
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Funksiya yoki xabar bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha darajalar</SelectItem>
                <SelectItem value="critical">Kritik</SelectItem>
                <SelectItem value="error">Xato</SelectItem>
                <SelectItem value="warning">Ogohlantirish</SelectItem>
                <SelectItem value="info">Ma'lumot</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="unresolved">Yopilmagan</SelectItem>
                <SelectItem value="resolved">Yopilgan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Yuklanmoqda...</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Xatoliklar topilmadi"
              description="Hozircha bu filtrga mos xato yo'q. Yaxshi yangilik!"
            />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Daraja</TableHead>
                    <TableHead>Funksiya</TableHead>
                    <TableHead>Xabar</TableHead>
                    <TableHead>Vaqt</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow
                      key={l.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(l)}
                    >
                      <TableCell>
                        <Badge className={severityColor[l.severity]}>{l.severity}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{l.function_name}</TableCell>
                      <TableCell className="max-w-md truncate">{l.message}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString("uz-UZ")}
                      </TableCell>
                      <TableCell>
                        {l.resolved ? (
                          <Badge variant="outline" className="text-green-600">Yopilgan</Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600">Ochiq</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resolve(l.id, !l.resolved)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(l.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected && (
                <Badge className={severityColor[selected.severity]}>{selected.severity}</Badge>
              )}
              {selected?.function_name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold mb-1">Xabar</p>
                <p className="bg-muted p-3 rounded-md whitespace-pre-wrap break-words">
                  {selected.message}
                </p>
              </div>
              {selected.stack && (
                <div>
                  <p className="font-semibold mb-1">Stack</p>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
                    {selected.stack}
                  </pre>
                </div>
              )}
              {selected.context && Object.keys(selected.context).length > 0 && (
                <div>
                  <p className="font-semibold mb-1">Kontekst</p>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(selected.context, null, 2)}
                  </pre>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Vaqt: {new Date(selected.created_at).toLocaleString("uz-UZ")}</div>
                <div>User: {selected.user_id ?? "—"}</div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => resolve(selected.id, !selected.resolved)} variant="outline">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {selected.resolved ? "Qayta ochish" : "Yopish"}
                </Button>
                <Button variant="destructive" onClick={() => { remove(selected.id); setSelected(null); }}>
                  <Trash2 className="h-4 w-4 mr-1" /> O'chirish
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) => (
  <Card>
    <CardContent className="p-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      {icon}
    </CardContent>
  </Card>
);
