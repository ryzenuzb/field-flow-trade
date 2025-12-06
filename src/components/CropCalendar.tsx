import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Plus, Sprout, Wheat, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CropEvent {
  id: string;
  date: Date;
  type: "planting" | "harvest";
  cropName: string;
  notes?: string;
}

const CROP_OPTIONS = [
  "Bug'doy", "Sholi", "Makkajo'xori", "Paxta", "Pomidor", "Bodring",
  "Kartoshka", "Piyoz", "Sabzi", "Qalampir", "Baqlajon", "Karam",
  "Tarvuz", "Qovun", "Uzum", "Olma", "O'rik", "Shaftoli"
];

export function CropCalendar() {
  const [events, setEvents] = useState<CropEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eventType, setEventType] = useState<"planting" | "harvest">("planting");
  const [cropName, setCropName] = useState("");
  const [notes, setNotes] = useState("");

  const handleAddEvent = () => {
    if (!selectedDate || !cropName) return;

    const newEvent: CropEvent = {
      id: Date.now().toString(),
      date: selectedDate,
      type: eventType,
      cropName,
      notes: notes || undefined,
    };

    setEvents([...events, newEvent]);
    setDialogOpen(false);
    setCropName("");
    setNotes("");
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(
      event => format(event.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Get all dates that have events for highlighting
  const eventDates = events.map(e => format(e.date, "yyyy-MM-dd"));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Ekin Kalendari
            </CardTitle>
            <CardDescription>
              Ekish va yig'im vaqtlarini rejalashtiring
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="sm" className="btn-farm">
            <Plus className="w-4 h-4 mr-2" />
            Reja qo'shish
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={uz}
              className="rounded-md border pointer-events-auto"
              modifiers={{
                hasEvent: (date) => eventDates.includes(format(date, "yyyy-MM-dd")),
              }}
              modifiersStyles={{
                hasEvent: {
                  backgroundColor: "hsl(var(--primary) / 0.2)",
                  fontWeight: "bold",
                },
              }}
            />
          </div>

          {/* Selected Date Events */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                {selectedDate ? format(selectedDate, "d MMMM, yyyy", { locale: uz }) : "Sanani tanlang"}
              </h3>
              <Badge variant="outline">
                {selectedDateEvents.length} reja
              </Badge>
            </div>

            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Bu sana uchun rejalar yo'q</p>
                <Button
                  variant="link"
                  onClick={() => setDialogOpen(true)}
                  className="mt-2"
                >
                  Reja qo'shish
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "p-4 rounded-lg border flex items-start justify-between gap-3",
                      event.type === "planting"
                        ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                        : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        event.type === "planting"
                          ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                          : "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400"
                      )}>
                        {event.type === "planting" ? (
                          <Sprout className="w-4 h-4" />
                        ) : (
                          <Wheat className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{event.cropName}</p>
                        <p className={cn(
                          "text-sm",
                          event.type === "planting"
                            ? "text-green-600 dark:text-green-400"
                            : "text-amber-600 dark:text-amber-400"
                        )}>
                          {event.type === "planting" ? "Ekish" : "Yig'im"}
                        </p>
                        {event.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEvent(event.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Upcoming Events Summary */}
            {events.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Yaqinlashib kelayotgan rejalar
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>{events.filter(e => e.type === "planting").length} ekish</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span>{events.filter(e => e.type === "harvest").length} yig'im</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Event Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi reja qo'shish</DialogTitle>
              <DialogDescription>
                Ekish yoki yig'im rejasini qo'shing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Sana</Label>
                <Input
                  value={selectedDate ? format(selectedDate, "d MMMM, yyyy", { locale: uz }) : ""}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>Reja turi</Label>
                <Select value={eventType} onValueChange={(v) => setEventType(v as "planting" | "harvest")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planting">
                      <div className="flex items-center gap-2">
                        <Sprout className="w-4 h-4 text-green-500" />
                        Ekish
                      </div>
                    </SelectItem>
                    <SelectItem value="harvest">
                      <div className="flex items-center gap-2">
                        <Wheat className="w-4 h-4 text-amber-500" />
                        Yig'im
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ekin nomi</Label>
                <Select value={cropName} onValueChange={setCropName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ekinni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {CROP_OPTIONS.map((crop) => (
                      <SelectItem key={crop} value={crop}>
                        {crop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Izoh (ixtiyoriy)</Label>
                <Input
                  placeholder="Qo'shimcha ma'lumot..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Bekor qilish
              </Button>
              <Button onClick={handleAddEvent} disabled={!cropName} className="btn-farm">
                Qo'shish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}