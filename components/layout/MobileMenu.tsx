'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { sidebarGroups } from "@/lib/nav"
import { X } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { UserRole } from "@/lib/permissions"
import { OrganizationSwitcher } from "./OrganizationSwitcher"

export function MobileMenu({ open, onOpenChange, userRole = "viewer" }: { open: boolean; onOpenChange: (open: boolean) => void; userRole?: string }) {
    const pathname = usePathname()

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="border-b p-4">
                    <div className="flex items-center justify-between">
                        <SheetTitle>Reparar-Cel</SheetTitle>
                        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </SheetHeader>

                <div className="p-4 border-b md:hidden">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2 px-3">
                        Empresa Actual
                    </p>
                    <div className="px-2">
                        <OrganizationSwitcher />
                    </div>
                </div>

                <nav className="py-4 overflow-y-equipo space-y-4">
                    {sidebarGroups.map((group, groupIndex) => {
                        const visibleLinks = group.links.filter((link) =>
                            link.roles.includes(userRole as UserRole)
                        )
                        if (visibleLinks.length === 0) return null

                        return (
                            <div key={group.label}>
                                {groupIndex > 0 && (
                                    <div className="border-t border-border/50 mb-3" />
                                )}
                                <p className="px-7 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
                                    {group.label}
                                </p>
                                <div className="space-y-0.5 px-3">
                                    {visibleLinks.map((link) => {
                                        const Icon = link.icon
                                        const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
                                        return (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                onClick={() => onOpenChange(false)}
                                                className={cn(
                                                    "flex items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                                                    isActive
                                                        ? "bg-accent/50 text-accent-foreground"
                                                        : "text-muted-foreground"
                                                )}
                                            >
                                                <Icon className="mr-2 h-4 w-4 shrink-0" />
                                                {link.title}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </nav>
            </SheetContent>
        </Sheet>
    )
}
