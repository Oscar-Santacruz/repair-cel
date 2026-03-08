'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { sidebarGroups } from "@/lib/nav"
import { UserRole } from "@/lib/permissions"

export function Sidebar({ className, userRole = "viewer", logoUrl = "/LOGO_default.png", emailConfirmed = true }: { className?: string, userRole?: string, logoUrl?: string, emailConfirmed?: boolean }) {
    const pathname = usePathname()

    return (
        <div className={cn("pb-12 h-screen border-r bg-background flex flex-col", className)}>
            {/* Logo */}
            <div className="px-6 pt-5 pb-4 flex items-center justify-center shrink-0">
                <img
                    src={logoUrl}
                    alt="Company Logo"
                    className="h-16 w-equipo object-contain"
                />
            </div>

            {/* Nav groups */}
            <nav className="flex-1 overflow-y-equipo px-3 pb-4 space-y-5">
                {sidebarGroups.map((group, groupIndex) => {
                    // Filter links the current user can see
                    const visibleLinks = group.links.filter((link) =>
                        link.roles.includes(userRole as UserRole)
                    )
                    if (visibleLinks.length === 0) return null

                    return (
                        <div key={group.label}>
                            {/* Divider (skip for first group) */}
                            {groupIndex > 0 && (
                                <div className="border-t border-border/50 mb-3" />
                            )}

                            {/* Group label */}
                            <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
                                {group.label}
                            </p>

                            {/* Links */}
                            <div className="space-y-0.5">
                                {visibleLinks.map((link) => {
                                    const isLinkDisabled = !emailConfirmed && link.href !== '/dashboard-v2'
                                    const isActive = !isLinkDisabled && (pathname === link.href || pathname.startsWith(link.href + "/"))
                                    const Icon = link.icon

                                    return (
                                        <Link
                                            key={link.href}
                                            href={isLinkDisabled ? '#' : link.href}
                                            className={cn(
                                                "flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
                                                isLinkDisabled
                                                    ? "opacity-50 cursor-not-allowed text-muted-foreground"
                                                    : "hover:bg-accent hover:text-accent-foreground",
                                                isActive
                                                    ? "bg-accent/50 text-accent-foreground"
                                                    : !isLinkDisabled ? "text-muted-foreground" : ""
                                            )}
                                            onClick={(e) => {
                                                if (isLinkDisabled) e.preventDefault()
                                            }}
                                            title={isLinkDisabled ? "Confirma tu email para acceder" : ""}
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
        </div>
    )
}
