'use client'

import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { Menu, LogOut, UserCircle } from "lucide-react"
import { ModeToggle } from "./ModeToggle"
import { OrganizationSwitcher } from "./OrganizationSwitcher"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


export function Header({ onMobileMenuOpen, logoUrl = "/logo.png" }: { onMobileMenuOpen?: () => void, logoUrl?: string }) {
    const { user, profile, signOut } = useAuth()

    const displayName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : user?.email || 'Usuario'
    const initials = profile?.first_name ? `${profile.first_name.charAt(0)}${profile.last_name?.charAt(0) || ''}`.toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'

    return (
        <header className="flex h-16 items-center border-b bg-background px-6">
            <div className="flex flex-1 items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="md:hidden"
                        onClick={onMobileMenuOpen}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <img
                        src={logoUrl}
                        alt="Company Logo"
                        className="h-10 w-equipo object-contain md:hidden"
                    />
                </div>
                <div className="ml-equipo flex items-center gap-3">
                    <div className="hidden md:block mr-2">
                        <OrganizationSwitcher />
                    </div>

                    <Link href="/profile" className="flex items-center gap-3 hover:bg-accent hover:text-accent-foreground px-2 py-1 rounded-md transition-colors group">
                        <div className="flex flex-col items-end hidden sm:flex">
                            <span className="text-xs text-muted-foreground uppercase font-bold leading-none mb-1">Bienvenido</span>
                            <span className="text-sm font-medium">
                                {displayName}
                            </span>
                        </div>
                        <Avatar className="h-9 w-9 border-2 border-transparent group-hover:border-primary transition-all">
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </Link>
                    <ModeToggle />
                    <Button variant="outline" size="sm" onClick={signOut}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Salir
                    </Button>
                </div>
            </div>
        </header>
    )
}
