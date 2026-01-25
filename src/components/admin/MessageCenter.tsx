import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Send, Loader2, Users, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface MessageCenterProps {
  users: any[];
}

export const MessageCenter = ({ users }: MessageCenterProps) => {
  const [targetGroup, setTargetGroup] = useState<string>("all");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const getTargetCount = (): number => {
    switch (targetGroup) {
      case "all":
        return users.length;
      case "farmers":
        return users.filter((u) => u.roles?.some((r: any) => r.role === "farmer")).length;
      case "buyers":
        return users.filter((u) => !u.roles?.some((r: any) => r.role === "farmer")).length;
      default:
        return 0;
    }
  };

  const handleSend = async () => {
    if (!messageTitle.trim() || !messageContent.trim()) {
      toast({
        title: "Xatolik",
        description: "Sarlavha va matn to'ldirilishi shart",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      // Simulate sending - in production, this would call an edge function
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast({
        title: "Muvaffaqiyatli",
        description: `${getTargetCount()} ta foydalanuvchiga xabar yuborildi`,
      });
      
      setMessageTitle("");
      setMessageContent("");
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Xabar yuborishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Xabarlar markazi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Jami: {users.length}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 text-green-600">
            <Bell className="h-3 w-3" />
            Fermerlar: {users.filter((u) => u.roles?.some((r: any) => r.role === "farmer")).length}
          </Badge>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetGroup">Qabul qiluvchilar</Label>
          <Select value={targetGroup} onValueChange={setTargetGroup}>
            <SelectTrigger id="targetGroup">
              <SelectValue placeholder="Guruhni tanlang" />
            </SelectTrigger>
            <SelectContent className="bg-background border">
              <SelectItem value="all">Barcha foydalanuvchilar</SelectItem>
              <SelectItem value="farmers">Faqat fermerlar</SelectItem>
              <SelectItem value="buyers">Faqat xaridorlar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Sarlavha</Label>
          <Input
            id="title"
            placeholder="Xabar sarlavhasi..."
            value={messageTitle}
            onChange={(e) => setMessageTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Xabar matni</Label>
          <Textarea
            id="content"
            placeholder="Xabar matnini yozing..."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            rows={4}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">
            {getTargetCount()} ta foydalanuvchiga yuboriladi
          </span>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Yuborish
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
