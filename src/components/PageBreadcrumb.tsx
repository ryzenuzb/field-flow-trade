import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeNames: Record<string, string> = {
  "/": "Bosh sahifa",
  "/marketplace": "Bozor",
  "/auth": "Kirish",
  "/admin": "Admin Panel",
  "/admin/login": "Admin Kirish",
  "/chat": "Chat",
  "/profile": "Profil",
  "/farmer": "Fermer Paneli",
  "/farmer/apply": "Fermer Ariza",
  "/orders": "Buyurtmalar",
  "/soil-check": "Tuproq Tahlili",
};

export function PageBreadcrumb() {
  const location = useLocation();

  if (location.pathname === "/") return null;

  const segments = location.pathname.split("/").filter(Boolean);
  const crumbs: { path: string; label: string }[] = [
    { path: "/", label: "Bosh sahifa" },
  ];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = routeNames[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ path: currentPath, label });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <BreadcrumbItem key={crumb.path}>
                {index > 0 && <BreadcrumbSeparator />}
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.path}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
