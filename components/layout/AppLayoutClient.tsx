'use client'

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { MobileMenu } from "@/components/layout/MobileMenu"

import { AlertCircle } from "lucide-react"

interface AppLayoutClientProps {
    children: React.ReactNode
    userRole: string
    logoUrl: string
    emailConfirmed?: boolean
    orgPlan?: 'free' | 'pro'
}

export function AppLayoutClient({ children, userRole, logoUrl, emailConfirmed = true, orgPlan = 'free' }: AppLayoutClientProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            <Sidebar className="hidden md:block w-64 flex-shrink-0" userRole={userRole} logoUrl={logoUrl} emailConfirmed={emailConfirmed} />
            <MobileMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} userRole={userRole} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header onMobileMenuOpen={() => setMobileMenuOpen(true)} logoUrl={logoUrl} />

                {/* Banner de confirmación de correo */}
                {!emailConfirmed && (
                    <div className="bg-destructive/15 text-destructive border-b border-destructive/20 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium z-20">
                        <AlertCircle className="h-4 w-4" />
                        <span>Favor confirmar tu email para continuar utilizando todas las funciones.</span>
                    </div>
                )}

                {/* Banner de Plan Free */}
                {orgPlan === 'free' && (
                    <div className="bg-gradient-to-r from-red-500/10 via-blue-500/10 to-red-500/5 border-b border-red-500/20 px-4 py-2 flex items-center justify-center gap-3 text-sm z-20">
                        <span className="font-medium text-foreground">
                            Estás usando el <span className="font-bold text-red-500">Plan Free</span>. Descubrí el potencial completo de Reparar-Cel.
                        </span>
                        <a
                            href="https://wa.me/595961853895"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded-full transition-colors hidden sm:inline-block shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                        >
                            Pasar a PRO ✨
                        </a>
                    </div>
                )}

                <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-muted/20 relative">
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.03] bg-center bg-no-repeat bg-contain"
                        style={{ backgroundImage: `url(${logoUrl})` }}
                    />
                    <div className="relative z-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
