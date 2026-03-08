"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Activity, Search, Filter, History } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface ActivityLog {
    id: string
    organization_id: string
    table_name: string
    record_id: string
    action: 'INSERT' | 'UPDATE' | 'DELETE'
    old_data: any
    new_data: any
    user_id: string
    created_at: string
}

interface UserProfile {
    id: string
    email: string
    first_name?: string
    last_name?: string
}

export default function GlobalActivitiesPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [users, setUsers] = useState<Record<string, UserProfile>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [filterTable, setFilterTable] = useState<string>("all")
    const [filterAction, setFilterAction] = useState<string>("all")

    const supabase = createClient()

    useEffect(() => {
        fetchActivities()
    }, [filterTable, filterAction])

    const fetchActivities = async () => {
        setIsLoading(true)
        try {
            let query = supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100)

            if (filterTable !== "all") {
                query = query.eq('table_name', filterTable)
            }
            if (filterAction !== "all") {
                query = query.eq('action', filterAction)
            }

            const { data: logsData, error } = await query

            if (error) throw error

            if (logsData) {
                setLogs(logsData as ActivityLog[])

                // Fetch users mapping
                const userIds = Array.from(new Set(logsData.map(log => log.user_id).filter(Boolean)))
                if (userIds.length > 0) {
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
                }
            }
        } catch (error) {
            console.error("Error fetching global activities:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const getUserName = (userId: string) => {
        if (!userId) return "Sistema"
        const user = users[userId]
        if (!user) return "Usuario Desconocido"
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
        return fullName || user.email || "Usuario"
    }

    const translateTableName = (tableName: string) => {
        const translations: Record<string, string> = {
            'clients': 'Clientes',
            'organization_settings': 'Configuración Organizacional',
            'brands': 'Marcas',
            'models': 'Modelos',
            'vehicle_categories': 'Categorías de Equipos',
            'vehicle_types': 'Tipos de Equipos',
            'cost_concepts': 'Conceptos de Costos',
            'payment_methods': 'Métodos de Pago',
            'taxes': 'Impuestos',
            'bank_accounts': 'Cuentas Bancarias',
            'creditors': 'Acreedores',
            'equipos': 'Equipos',
            'sales': 'Ventas'
        }
        return translations[tableName] || tableName
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
            case 'INSERT': return { label: 'Creación', color: 'bg-green-100 text-green-800' }
            case 'UPDATE': return { label: 'Modificación', color: 'bg-blue-100 text-blue-800' }
            case 'DELETE': return { label: 'Eliminación', color: 'bg-red-100 text-red-800' }
            default: return { label: action, color: 'bg-gray-100 text-gray-800' }
        }
    }

    return (
        <div className="max-w-6xl mx-equipo space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Registro de Actividades</h2>
                <p className="text-muted-foreground mt-2">
                    Auditoría de todos los cambios de datos e información en el sistema.
                </p>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Filtros de Búsqueda
                        </CardTitle>
                        <div className="flex items-center gap-3 w-full md:w-equipo">
                            <Select value={filterTable} onValueChange={setFilterTable}>
                                <SelectTrigger className="w-full md:w-[200px]">
                                    <SelectValue placeholder="Módulo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los módulos</SelectItem>
                                    <SelectItem value="clients">Clientes</SelectItem>
                                    <SelectItem value="organization_settings">Configuración General</SelectItem>
                                    <SelectItem value="brands">Marcas</SelectItem>
                                    <SelectItem value="models">Modelos</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filterAction} onValueChange={setFilterAction}>
                                <SelectTrigger className="w-full md:w-[150px]">
                                    <SelectValue placeholder="Acción" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las acciones</SelectItem>
                                    <SelectItem value="INSERT">Creaciones</SelectItem>
                                    <SelectItem value="UPDATE">Modificaciones</SelectItem>
                                    <SelectItem value="DELETE">Eliminaciones</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button variant="outline" size="icon" onClick={fetchActivities} disabled={isLoading}>
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Cargando actividades...</div>
                    ) : logs.length === 0 ? (
                        <div className="p-8 text-center">
                            <History className="h-10 w-10 mx-equipo text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground">No se encontraron registros de actividad.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {logs.map((log) => {
                                const actionStyle = formatAction(log.action)
                                return (
                                    <div key={log.id} className="p-4 flex flex-col sm:flex-row gap-4 hover:bg-muted/50 transition-colors">
                                        <div className="sm:w-48 flex-shrink-0">
                                            <p className="text-sm font-medium">{format(new Date(log.created_at), "dd MMM yyyy, HH:mm", { locale: es })}</p>
                                            <Badge variant="secondary" className="mt-1 font-normal opacity-80">
                                                {getUserName(log.user_id)}
                                            </Badge>
                                        </div>

                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge className={`${actionStyle.color} border-transparent font-medium hover:opacity-100`}>
                                                    {actionStyle.label}
                                                </Badge>
                                                <span className="text-sm font-semibold">
                                                    Módulo: {translateTableName(log.table_name)}
                                                </span>
                                            </div>

                                            <div className="text-sm text-muted-foreground mt-2">
                                                {log.action === 'UPDATE' && log.new_data && log.old_data && (
                                                    <span className="line-clamp-2">
                                                        Se modificó el registro. Algunos cambios incluyeron: {' '}
                                                        {Object.keys(log.new_data)
                                                            .filter(key => !['updated_at', 'updated_by', 'created_at', 'created_by'].includes(key) && JSON.stringify(log.old_data[key]) !== JSON.stringify(log.new_data[key]))
                                                            .slice(0, 3)
                                                            .map(k => translateField(k))
                                                            .join(', ')}
                                                    </span>
                                                )}
                                                {log.action === 'INSERT' && (
                                                    <span>Se ha creado un nuevo registro.</span>
                                                )}
                                                {log.action === 'DELETE' && (
                                                    <span>El registro fue eliminado del sistema.</span>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
