import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sprout, 
  ShoppingCart, 
  MessageCircle, 
  User, 
  Menu,
  Home,
  Tractor,
  ClipboardList,
  LogOut,
  Microscope,
  GraduationCap
} from "lucide-react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFarmer, setIsFarmer] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setIsAuthenticated(true);
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (roles && roles.some(r => r.role === 'farmer')) {
        setIsFarmer(true);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setIsFarmer(false);
    navigate('/');
  };

  const allNavItems = [
    { name: "Bosh sahifa", href: "/", icon: Home, farmerAllowed: true, requiresAuth: false },
    { name: "Bozor", href: "/marketplace", icon: ShoppingCart, farmerAllowed: false, requiresAuth: false },
    { name: "Buyurtmalar", href: "/orders", icon: ClipboardList, farmerAllowed: false, requiresAuth: true },
    { name: "Fermer Paneli", href: "/farmer", icon: Tractor, farmerAllowed: true, requiresAuth: true },
    { name: "Chat", href: "/chat", icon: MessageCircle, farmerAllowed: true, requiresAuth: true },
    { name: "Profil", href: "/profile", icon: User, farmerAllowed: false, requiresAuth: true },
    { name: "Tuproq Tahlili", href: "/soil-check", icon: Microscope, farmerAllowed: true, requiresAuth: false },
  ];

  const navItems = allNavItems.filter(item => {
    // Hide items that require auth if user is not authenticated
    if (item.requiresAuth && !isAuthenticated) return false;
    // Hide items not allowed for farmers
    if (isFarmer && !item.farmerAllowed) return false;
    return true;
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary-light rounded-lg flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-poppins font-bold gradient-text">
              FarmTrade
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg font-inter font-medium transition-all duration-200 flex items-center space-x-2 ${
                    isActive(item.href)
                      ? "bg-primary text-white shadow-green"
                      : "text-foreground hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {isFarmer && (
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                Fermer
              </Badge>
            )}
            {isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Chiqish
              </Button>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    Kirish
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="btn-farm" size="sm">
                    Ro'yxatdan o'tish
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <div className="flex flex-col space-y-4 mt-8">
                <div className="flex items-center space-x-2 pb-4 border-b border-border">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-light rounded-lg flex items-center justify-center">
                    <Sprout className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-poppins font-bold gradient-text">
                    FarmTrade
                  </span>
                </div>
                
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-inter font-medium transition-all duration-200 ${
                        isActive(item.href)
                          ? "bg-primary text-white shadow-green"
                          : "text-foreground hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                
                <div className="pt-6 border-t border-border space-y-3">
                  {isAuthenticated ? (
                    <Button variant="outline" className="w-full" onClick={() => { handleLogout(); setIsOpen(false); }}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Chiqish
                    </Button>
                  ) : (
                    <>
                      <Link to="/auth" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full">
                          Kirish
                        </Button>
                      </Link>
                      <Link to="/auth" onClick={() => setIsOpen(false)}>
                        <Button className="btn-farm w-full">
                          Ro'yxatdan o'tish
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;