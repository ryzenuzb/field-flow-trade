import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/reviews/StarRating";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trophy, ArrowLeft, MapPin, Package, Medal } from "lucide-react";

interface LeaderRow {
  seller_id: string;
  full_name: string;
  location: string | null;
  avg_rating: number;
  reviews_count: number;
  five_star_count: number;
  delivered_orders: number;
}

const medalColor = (rank: number) => {
  if (rank === 1) return "text-yellow-500";
  if (rank === 2) return "text-slate-400";
  if (rank === 3) return "text-amber-700";
  return "text-muted-foreground";
};

const Leaderboard = () => {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase.rpc("get_farmer_leaderboard", { p_limit: 100 });
        if (error) throw error;
        setRows((data as any as LeaderRow[]) || []);
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Reytingni yuklashda xatolik yuz berdi",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-poppins font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-7 h-7 text-primary" />
              Fermerlar reytingi
            </h1>
            <p className="text-muted-foreground mt-1">
              Xaridorlar bahosi asosida eng yaxshi 100 fermer
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Hozircha reyting bo'sh</h2>
              <p className="text-muted-foreground mb-6">
                Xaridorlar mahsulotlarni baholaganidan so'ng fermerlar bu yerda paydo bo'ladi.
              </p>
              <Button className="btn-farm" onClick={() => navigate("/marketplace")}>
                Bozorga o'tish
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((row, index) => {
              const rank = index + 1;
              return (
                <Card
                  key={row.seller_id}
                  className={rank <= 3 ? "border-primary/40 shadow-soft" : undefined}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 flex flex-col items-center">
                      {rank <= 3 ? (
                        <Medal className={`w-7 h-7 ${medalColor(rank)}`} />
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">{rank}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate">{row.full_name}</h3>
                        {row.five_star_count > 0 && (
                          <Badge variant="secondary">{row.five_star_count} × 5 yulduz</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <StarRating value={Math.round(Number(row.avg_rating))} size="sm" />
                          <span className="font-medium text-foreground">
                            {Number(row.avg_rating).toFixed(1)}
                          </span>
                          ({row.reviews_count} baho)
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {row.delivered_orders} yetkazilgan
                        </span>
                        {row.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {row.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;
