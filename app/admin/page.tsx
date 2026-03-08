import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import AdminDashboardClient from './AdminDashboardClient'
import { getAdminStats } from './actions'

const ADMIN_EMAIL = 'oscar.sntcrz@gmail.com'

async function getUser() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

export default async function AdminPage() {
    const user = await getUser()

    if (!user) {
        redirect('/login')
    }

    if (user.email !== ADMIN_EMAIL) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4 p-8 max-w-md">
                    <div className="text-6xl">🚫</div>
                    <h1 className="text-2xl font-bold text-foreground">Acceso Denegado</h1>
                    <p className="text-muted-foreground">
                        No tenés permisos para acceder al panel de administración.
                    </p>
                    <a
                        href="/dashboard-v2"
                        className="inline-block mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                        Volver al dashboard
                    </a>
                </div>
            </div>
        )
    }

    const stats = await getAdminStats()

    return <AdminDashboardClient stats={stats} />
}
