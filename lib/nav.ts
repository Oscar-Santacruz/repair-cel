import { LayoutDashboard, Users, Wrench, Receipt, FileText, Settings, Wallet, MessageSquare, UserCircle, ClipboardList, LucideIcon, Package, Building2, ShoppingCart, ShoppingBag, Landmark } from "lucide-react"
import { UserRole } from "@/lib/permissions"

export interface NavLink {
    title: string
    href: string
    icon: LucideIcon
    roles: UserRole[]
}

export interface NavGroup {
    label: string
    links: NavLink[]
}

export const sidebarGroups: NavGroup[] = [
    {
        label: "Taller",
        links: [
            {
                title: "Dashboard",
                href: "/dashboard-v2",
                icon: LayoutDashboard,
                roles: ["admin", "owner"],
            },
            {
                title: "Recepciones",
                href: "/reparations",
                icon: Wrench,
                roles: ["admin", "owner", "user", "technician", "receptionist"],
            },
            {
                title: "Inventario",
                href: "/inventory",
                icon: Package,
                roles: ["admin", "owner", "user", "technician", "receptionist"],
            },
            {
                title: "Clientes",
                href: "/clients",
                icon: Users,
                roles: ["admin", "owner", "user", "technician", "receptionist"],
            },
            {
                title: "Proveedores",
                href: "/suppliers",
                icon: Building2,
                roles: ["admin", "owner", "user", "receptionist"],
            },
            {
                title: "Compras",
                href: "/purchases",
                icon: ShoppingCart,
                roles: ["admin", "owner", "user", "receptionist"],
            },
        ],
    },
    {
        label: "Finanzas",
        links: [
            {
                title: "Punto de Venta",
                href: "/pos",
                icon: ShoppingBag,
                roles: ["admin", "owner", "user", "receptionist"],
            },
            {
                title: "Caja",
                href: "/caja",
                icon: Landmark,
                roles: ["admin", "owner", "user", "receptionist"],
            },
            {
                title: "Notificaciones",
                href: "/notifications",
                icon: MessageSquare,
                roles: ["admin", "owner", "user", "receptionist"],
            },
        ],
    },
    {
        label: "Administración",
        links: [
            {
                title: "Auditoría",
                href: "/activities",
                icon: ClipboardList,
                roles: ["admin", "owner"],
            },
            {
                title: "Usuarios",
                href: "/users",
                icon: Users,
                roles: ["admin", "owner"],
            },
            {
                title: "Mi Perfil",
                href: "/profile",
                icon: UserCircle,
                roles: ["admin", "owner", "user", "technician", "receptionist", "viewer"],
            },
            {
                title: "Configuración",
                href: "/settings",
                icon: Settings,
                roles: ["admin", "owner"],
            },
        ],
    },
]

// Backward-compat flat list for any code still importing sidebarLinks
export const sidebarLinks = sidebarGroups.flatMap((g) => g.links)
