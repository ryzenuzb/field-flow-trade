import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface FilterState {
  search: string;
  status: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  role: string;
}

interface AdvancedFiltersProps {
  type: "users" | "products" | "orders";
  onFilterChange: (filters: FilterState) => void;
  activeFilters: FilterState;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Barchasi" },
  { value: "pending", label: "Kutilmoqda" },
  { value: "accepted", label: "Qabul qilingan" },
  { value: "processing", label: "Jarayonda" },
  { value: "shipped", label: "Yuborilgan" },
  { value: "delivered", label: "Yetkazilgan" },
  { value: "cancelled", label: "Bekor qilingan" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "Barchasi" },
  { value: "Sabzavot", label: "Sabzavotlar" },
  { value: "Meva", label: "Mevalar" },
  { value: "Don", label: "Don mahsulotlari" },
  { value: "Sut", label: "Sut mahsulotlari" },
  { value: "Boshqa", label: "Boshqa" },
];

const ROLE_OPTIONS = [
  { value: "all", label: "Barchasi" },
  { value: "admin", label: "Admin" },
  { value: "farmer", label: "Fermer" },
  { value: "buyer", label: "Xaridor" },
];

export const AdvancedFilters = ({
  type,
  onFilterChange,
  activeFilters,
}: AdvancedFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...activeFilters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      search: "",
      status: "all",
      category: "all",
      dateFrom: "",
      dateTo: "",
      role: "all",
    });
  };

  const activeCount = Object.entries(activeFilters).filter(
    ([key, value]) => value && value !== "all" && value !== ""
  ).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtrlar
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Tozalash
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Yopish" : "Kengaytirish"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick search - always visible */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Qidirish..."
            value={activeFilters.search}
            onChange={(e) => handleChange("search", e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Expanded filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {type === "orders" && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={activeFilters.status}
                  onValueChange={(v) => handleChange("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border">
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {type === "products" && (
              <div className="space-y-2">
                <Label>Kategoriya</Label>
                <Select
                  value={activeFilters.category}
                  onValueChange={(v) => handleChange("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategoriya" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border">
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {type === "users" && (
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={activeFilters.role}
                  onValueChange={(v) => handleChange("role", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border">
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Sana (dan)</Label>
              <Input
                type="date"
                value={activeFilters.dateFrom}
                onChange={(e) => handleChange("dateFrom", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Sana (gacha)</Label>
              <Input
                type="date"
                value={activeFilters.dateTo}
                onChange={(e) => handleChange("dateTo", e.target.value)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
