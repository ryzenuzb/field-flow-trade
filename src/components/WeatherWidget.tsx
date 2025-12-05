import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Thermometer, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
}

interface Location {
  name: string;
  lat: number;
  lon: number;
}

const uzbekistanLocations: Location[] = [
  { name: "Toshkent", lat: 41.2995, lon: 69.2401 },
  { name: "Samarqand", lat: 39.6542, lon: 66.9597 },
  { name: "Buxoro", lat: 39.7681, lon: 64.4556 },
  { name: "Namangan", lat: 40.9983, lon: 71.6726 },
  { name: "Andijon", lat: 40.7821, lon: 72.3442 },
  { name: "Farg'ona", lat: 40.3842, lon: 71.7975 },
  { name: "Qo'qon", lat: 40.5286, lon: 70.9425 },
  { name: "Qarshi", lat: 38.8600, lon: 65.8000 },
  { name: "Nukus", lat: 42.4619, lon: 59.6166 },
  { name: "Urganch", lat: 41.5500, lon: 60.6333 },
  { name: "Navoiy", lat: 40.0844, lon: 65.3792 },
  { name: "Jizzax", lat: 40.1158, lon: 67.8422 },
  { name: "Termiz", lat: 37.2242, lon: 67.2783 },
  { name: "Guliston", lat: 40.4897, lon: 68.7842 },
];

const getWeatherIcon = (code: number) => {
  if (code === 0) return <Sun className="h-8 w-8 text-yellow-500" />;
  if (code >= 1 && code <= 3) return <Cloud className="h-8 w-8 text-gray-400" />;
  if (code >= 51 && code <= 67) return <CloudRain className="h-8 w-8 text-blue-500" />;
  if (code >= 71 && code <= 77) return <CloudSnow className="h-8 w-8 text-blue-200" />;
  if (code >= 80 && code <= 99) return <CloudRain className="h-8 w-8 text-blue-600" />;
  return <Cloud className="h-8 w-8 text-gray-400" />;
};

const getWeatherDescription = (code: number): string => {
  if (code === 0) return "Ochiq osmon";
  if (code === 1) return "Asosan ochiq";
  if (code === 2) return "Qisman bulutli";
  if (code === 3) return "Bulutli";
  if (code >= 45 && code <= 48) return "Tumanli";
  if (code >= 51 && code <= 55) return "Mayda yomg'ir";
  if (code >= 56 && code <= 57) return "Muzlagan yomg'ir";
  if (code >= 61 && code <= 65) return "Yomg'ir";
  if (code >= 66 && code <= 67) return "Muzlagan yomg'ir";
  if (code >= 71 && code <= 75) return "Qor";
  if (code === 77) return "Qor donalari";
  if (code >= 80 && code <= 82) return "Jala";
  if (code >= 85 && code <= 86) return "Qor jala";
  if (code >= 95 && code <= 99) return "Momaqaldiroq";
  return "Noma'lum";
};

const getDayName = (dateString: string): string => {
  const days = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
  const date = new Date(dateString);
  return days[date.getDay()];
};

export const WeatherWidget = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location>(uzbekistanLocations[0]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${selectedLocation.lat}&longitude=${selectedLocation.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Asia%2FTashkent&forecast_days=7`
        );
        
        if (!response.ok) {
          throw new Error('Ob-havo ma\'lumotlarini olishda xatolik');
        }
        
        const data = await response.json();
        setWeatherData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [selectedLocation]);

  const handleLocationChange = (locationName: string) => {
    const location = uzbekistanLocations.find(loc => loc.name === locationName);
    if (location) {
      setSelectedLocation(location);
    }
  };

  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-950 dark:to-sky-900 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2 text-xl text-blue-900 dark:text-blue-100">
            <Cloud className="h-6 w-6" />
            Ob-havo prognozi
          </CardTitle>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <Select value={selectedLocation.name} onValueChange={handleLocationChange}>
              <SelectTrigger className="w-[160px] bg-white/80 dark:bg-black/20 border-blue-300 dark:border-blue-700">
                <SelectValue placeholder="Shaharni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {uzbekistanLocations.map((location) => (
                  <SelectItem key={location.name} value={location.name}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
          </div>
        ) : weatherData ? (
          <div className="space-y-6">
            {/* Current Weather */}
            <div className="flex items-center justify-between flex-wrap gap-4 bg-white/50 dark:bg-black/20 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-black/30 rounded-full shadow-lg">
                  {getWeatherIcon(weatherData.current.weather_code)}
                </div>
                <div>
                  <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">
                    {Math.round(weatherData.current.temperature_2m)}°C
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    {getWeatherDescription(weatherData.current.weather_code)}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Droplets className="h-5 w-5" />
                  <span>{weatherData.current.relative_humidity_2m}%</span>
                </div>
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Wind className="h-5 w-5" />
                  <span>{Math.round(weatherData.current.wind_speed_10m)} km/s</span>
                </div>
              </div>
            </div>
            
            {/* 7-Day Forecast */}
            <div>
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">7 kunlik prognoz</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {weatherData.daily.time.map((date, index) => (
                  <div
                    key={date}
                    className="bg-white/60 dark:bg-black/20 rounded-lg p-3 text-center hover:bg-white/80 dark:hover:bg-black/30 transition-colors"
                  >
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                      {index === 0 ? "Bugun" : getDayName(date)}
                    </p>
                    <div className="flex justify-center my-2">
                      {getWeatherIcon(weatherData.daily.weather_code[index])}
                    </div>
                    <div className="flex items-center justify-center gap-1 text-sm">
                      <span className="font-semibold text-blue-900 dark:text-blue-100">
                        {Math.round(weatherData.daily.temperature_2m_max[index])}°
                      </span>
                      <span className="text-blue-500 dark:text-blue-400">
                        {Math.round(weatherData.daily.temperature_2m_min[index])}°
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
