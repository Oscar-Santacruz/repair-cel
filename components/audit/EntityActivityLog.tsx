"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { History, User, Activity as ActivityIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ActivityLog {
    id: string
    action: 'INSERT' | 'UPDATE' | 'DELETE'
    table_name: string
    old_data: any
    new_data: any
    created_at: string
    user_id: string
}

interface UserProfile {
    id: string
    email: string
    first_name?: string
    last_name?: string
}

interface EntityActivityLogProps {
    tableName: string
    recordId: string
    title?: string
}

export function EntityActivityLog({ tableName, recordId, title = "Historial de Actividad" }: EntityActivityLogProps) {
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [users, setUsers] = useState<Record<string, UserProfile>>({})
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchLogs = async () => {
            setIsLoading(true)
            try {
                // Fetch logs
                const { data: logsData, error: logsError } = await supabase
                    .from('activity_logs')
                    .select('*')
                    .eq('table_name', tableName)
                    .eq('record_id', recordId)
                    .order('created_at', { ascending: false })

                if (logsError) throw logsError
                if (!logsData || logsData.length === 0) {
                    setLogs([])
                    return
                }

                setLogs(logsData as ActivityLog[])

                // Fetch users
                const userIds = Array.from(new Set(logsData.map(log => log.user_id).filter(Boolean)))
                if (userIds.length > 0) {
                    try {
                        const { data: usersData } = await supabase
                            .from('profiles')
                            .select('id, email, first_name, last_name')
                            .in('id', userIds)

                        if (usersData) {
                            const usersMap: Record<string, UserProfile> = {}
                            usersData.forEach((u: any) => {
                                usersMap[u.id] = u
                            })
                            setUsers(usersMap)
                        }
                    } catch (e) {
                        console.error('Error fetching users for logs', e)
                    }
                }
            } catch (error) {
                console.error("Error fetching activity logs:", error)
            } finally {
                setIsLoading(false)
            }
        }

        if (recordId) {
            fetchLogs()
        }
    }, [recordId, tableName])

    const getUserName = (userId: string) => {
        if (!userId) return "Sistema"
        const user = users[userId]
        if (!user) return "Usuario Desconocido"
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
        return fullName || user.email || "Usuario"
    }

    const translateField = (field: string) => {
        const translations: Record<string, string> = {
            'name': 'Nombre',
            'phone': 'Teléfono',
            'address': 'Dirección',
            'city': 'Ciudad',
            'neighborhood': 'Barrio',
            'motor_number': 'Nº de Motor',
            'plate': 'Chapa',
            'color': 'Color',
            'interior_color': 'Color Interior',
            'engine': 'Motor (Cilindrada)',
            'fuel_type': 'Tipo de Combustible',
            'mileage': 'Kilometraje',
            'list_price': 'Precio de Lista',
            'purchase_price': 'Precio de Compra',
            'status': 'Estado',
            'is_active': 'Activo',
            'ci': 'CI/RUC',
            'description': 'Descripción'
        }
        return translations[field] || field
    }

    const formatAction = (action: string) => {
        switch (action) {
            case 'INSERT': return { label: 'Creación', color: 'bg-green-100 text-green-800 border-green-200' }
            case 'UPDATE': return { label: 'Modificación', color: 'bg-blue-100 text-blue-800 border-blue-200' }
            case 'DELETE': return { label: 'Eliminación', color: 'bg-red-100 text-red-800 border-red-200' }
            default: return { label: action, color: 'bg-gray-100 text-gray-800 border-gray-200' }
        }
    }

    const renderChanges = (log: ActivityLog) => {
        if (log.action === 'INSERT') {
            return <p className="text-sm text-muted-foreground mt-2">Registro creado inicializado con todos los campos.</p>
        }
        if (log.action === 'DELETE') {
            return <p className="text-sm text-muted-foreground mt-2">Registro eliminado. Los datos fueron archivados.</p>
        }

        if (log.action === 'UPDATE' && log.old_data && log.new_data) {
            const changes: { field: string, old: any, new: any }[] = []

            // Compare fields
            Object.keys(log.new_data).forEach(key => {
                // Ignore audit fields and internal state
                if (['updated_at', 'updated_by', 'created_at', 'created_by'].includes(key)) return

                const oldVal = log.old_data[key]
                const newVal = log.new_data[key]

                // Simple comparison (might need deeper compare for JSON objects)
                if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                    changes.push({ field: key, old: oldVal, new: newVal })
                }
            })

            if (changes.length === 0) {
                return <p className="text-sm text-muted-foreground mt-2">Actualización sin cambios en campos visibles.</p>
            }

            return (
                <div className="mt-3 space-y-2">
                    {changes.map((change, idx) => (
                        <div key={idx} className="bg-muted/40 rounded-md p-1.5 text-xs grid grid-cols-[1fr_auto_1fr] gap-x-2 items-center">
                            <div className="font-semibold col-span-3 text-[10px] uppercase tracking-wider text-muted-foreground/80">{translateField(change.field)}</div>
                            <div className="text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20 px-1.5 py-0.5 rounded line-through truncate" title={String(change.old ?? 'Nulo')}>
                                {String(change.old ?? 'Nulo')}
                            </div>
                            <span className="text-muted-foreground/50 text-[10px]">→</span>
                            <div className="text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-950/20 px-1.5 py-0.5 rounded truncate" title={String(change.new ?? 'Nulo')}>
                                {String(change.new ?? 'Nulo')}
                            </div>
                        </div>
                    ))}
                </div>
            )
        }

        return null
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="h-5 w-5" />
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-32 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Cargando historial...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        {title}
                    </div>
                    <Badge variant="outline" className="font-normal">
                        {logs.length} {logs.length === 1 ? 'registro' : 'registros'}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {logs.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed rounded-lg m-4">
                        <ActivityIcon className="h-8 w-8 text-muted-foreground/50 mx-equipo mb-2" />
                        <p className="text-muted-foreground text-sm">No hay registro de actividad aún.</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[450px]">
                        <div className="p-6 space-y-8 relative before:absolute before:inset-0 before:ml-8 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-300 before:to-transparent">
                            {logs.map((log) => {
                                const actionStyle = formatAction(log.action)
                                return (
                                    <div key={log.id} className="relative flex items-start group pb-2">
                                        {/* Timeline dots pattern - simplified to stay on the left */}
                                        <div className="absolute left-2 mt-2 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-background bg-slate-400 group-hover:bg-primary transition-colors z-10" />

                                        <div className="flex-1 ml-8">
                                            {/* Container per item - always full width/left aligned */}
                                            <div className="flex flex-col gap-2 p-4 rounded-xl border bg-card/50 shadow-sm transition-shadow hover:shadow-md">
                                                <div className="flex justify-between items-center gap-2 mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className={`border ${actionStyle.color} text-[10px]`}>
                                                            {actionStyle.label}
                                                        </Badge>
                                                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                            {format(new Date(log.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <User className="h-3 w-3" />
                                                        <span>{getUserName(log.user_id)}</span>
                                                    </div>
                                                </div>

                                                {renderChanges(log)}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}
