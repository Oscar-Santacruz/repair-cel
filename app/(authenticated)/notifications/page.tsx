import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, ListTodo, Settings2 } from "lucide-react"
import { getPendingReminders, getWhatsAppSettings } from "@/app/notification-actions"
import { NotificationHistory } from "@/components/notifications/NotificationHistory"
import { NotificationManagement } from "@/components/notifications/NotificationManagement"
import { NotificationSettings } from "@/components/notifications/NotificationSettings"

export const dynamic = 'force-dynamic'

async function getNotifications() {
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
    if (!user) return []

    const { data, error } = await supabase
        .from('whatsapp_notifications')
        .select(`
            *,
            clients (id, full_name, phone)
        `)
        .order('sent_at', { ascending: false })
        .limit(200)

    if (error) {
        console.error("Error fetching notifications", error)
        return []
    }

    return data || []
}

export default async function NotificationsPage() {
    try {
        const [notifications, reminders, settings] = await Promise.all([
            getNotifications(),
            getPendingReminders().catch(() => []),
            getWhatsAppSettings().catch(() => null)
        ])

        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Centro de WhatsApp</h1>
                        <p className="text-muted-foreground mt-1">
                            Gestioná recordatorios automáticos, morosidad y revisá el historial de envíos.
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="management" className="space-y-4">
                    <TabsList className="bg-muted p-1 rounded-lg">
                        <TabsTrigger value="management" className="flex items-center gap-2">
                            <ListTodo className="h-4 w-4" /> Gestión de Envíos
                            {reminders.length > 0 && (
                                <span className="ml-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                    {reminders.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" /> Historial
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="flex items-center gap-2">
                            <Settings2 className="h-4 w-4" /> Configuración
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="management" className="space-y-4">
                        <NotificationManagement reminders={reminders} settings={settings} />
                    </TabsContent>

                    <TabsContent value="history">
                        <NotificationHistory notifications={notifications} />
                    </TabsContent>

                    <TabsContent value="settings">
                        <NotificationSettings settings={settings} />
                    </TabsContent>
                </Tabs>
            </div>
        )
    } catch (error: any) {
        console.error("Error rendering NotificationsPage:", error)
        return (
            <div className="p-8 text-center space-y-4">
                <div className="text-red-600 font-bold text-xl">Error al cargar la página</div>
                <p className="text-muted-foreground">{error.message || "Ocurrió un error inesperado al cargar las notificaciones."}</p>
                <div className="bg-gray-50 p-4 rounded border text-left text-xs font-mono overflow-equipo max-h-[200px]">
                    {JSON.stringify(error, null, 2)}
                </div>
            </div>
        )
    }
}
