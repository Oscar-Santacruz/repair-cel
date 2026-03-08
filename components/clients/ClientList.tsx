"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { LayoutGrid, List, Phone as PhoneIcon, Users as UsersIcon, Smartphone, AlertTriangle, CalendarDays, MessageSquare, ArrowUp, ArrowDown, ArrowUpDown, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ClickableTableRow } from "@/components/common/ClickableTableRow"

// Import Server Action
import { getClients } from "@/app/(authenticated)/clients/actions"

interface Client {
    id: string
    full_name: string | null
    document: string | null
    phone: string | null
    address: string | null
    reparations_count: number
    is_arrears: boolean
    last_purchase_date: string | null
    whatsapp_reminders_enabled?: boolean
    [key: string]: any
}

type SortKey = 'full_name' | 'document' | 'phone' | 'reparations_count' | 'is_arrears' | 'last_purchase_date'
type SortDir = 'asc' | 'desc'

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    const dateStringToParse = dateStr.includes(' ') || dateStr.includes('T')
        ? dateStr
        : dateStr + 'T00:00:00'
    const date = new Date(dateStringToParse)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function SortableHead({
    label,
    sortKey,
    currentSort,
    currentDir,
    onSort,
    align = 'left',
}: {
    label: string
    sortKey: SortKey
    currentSort: SortKey | null
    currentDir: SortDir
    onSort: (key: SortKey) => void
    align?: 'left' | 'center' | 'right'
}) {
    const isActive = currentSort === sortKey
    return (
        <TableHead className={align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : ''}>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onSort(sortKey)}
                className={`-ml-3 h-8 font-medium text-xs ${align === 'right' ? 'ml-auto flex justify-end w-full pr-0' : align === 'center' ? 'mx-auto flex justify-center w-full' : ''}`}
            >
                <span>{label}</span>
                {isActive ? (
                    currentDir === 'asc'
                        ? <ArrowUp className="ml-1 h-3 w-3 shrink-0" />
                        : <ArrowDown className="ml-1 h-3 w-3 shrink-0" />
                ) : (
                    <ArrowUpDown className="ml-1 h-3 w-3 shrink-0 text-muted-foreground/40" />
                )}
            </Button>
        </TableHead>
    )
}

interface ClientListProps {
    initialClients: Client[]
    limit: number
    query: string
    totalCount: number
}

export function ClientList({ initialClients, limit, query, totalCount }: ClientListProps) {
    const [view, setView] = useState<'card' | 'table'>('card')
    const [sortKey, setSortKey] = useState<SortKey | null>(null)
    const [sortDir, setSortDir] = useState<SortDir>('asc')

    // Infinite Scroll state
    const [clients, setClients] = useState<Client[]>(initialClients)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(initialClients.length < totalCount)

    const observer = useRef<IntersectionObserver | null>(null)

    // Reset state when props change
    useEffect(() => {
        setClients(initialClients)
        setPage(1)
        setHasMore(initialClients.length < totalCount)
    }, [initialClients, query, limit, totalCount])

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return

        setLoading(true)
        try {
            const nextPage = page + 1
            const result = await getClients(query, nextPage, limit)

            if (result.clients.length > 0) {
                setClients(prev => [...prev, ...result.clients])
                setPage(nextPage)
                // Filter out any duplicates just in case
                setHasMore(clients.length + result.clients.length < totalCount)
            } else {
                setHasMore(false)
            }
        } catch (error) {
            console.error("Error loading more clients:", error)
        } finally {
            setLoading(false)
        }
    }, [page, loading, hasMore, query, limit, clients.length, totalCount])

    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return
        if (observer.current) observer.current.disconnect()

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMore()
            }
        })

        if (node) observer.current.observe(node)
    }, [loading, hasMore, loadMore])


    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            if (sortDir === 'asc') {
                setSortDir('desc')
            } else {
                setSortKey(null)
                setSortDir('asc')
            }
        } else {
            setSortKey(key)
            setSortDir('asc')
        }
    }

    const sortedClients = [...clients].sort((a, b) => {
        if (!sortKey) return 0

        let valA: any
        let valB: any

        switch (sortKey) {
            case 'full_name':
                valA = (a.full_name || '').toLowerCase()
                valB = (b.full_name || '').toLowerCase()
                break
            case 'document':
                valA = (a.document || '').toLowerCase()
                valB = (b.document || '').toLowerCase()
                break
            case 'phone':
                valA = (a.phone || '').toLowerCase()
                valB = (b.phone || '').toLowerCase()
                break
            case 'reparations_count':
                valA = a.reparations_count || 0
                valB = b.reparations_count || 0
                break
            case 'is_arrears':
                valA = a.is_arrears ? 1 : 0
                valB = b.is_arrears ? 1 : 0
                break
            case 'last_purchase_date':
                valA = a.last_purchase_date ? new Date(a.last_purchase_date).getTime() : 0
                valB = b.last_purchase_date ? new Date(b.last_purchase_date).getTime() : 0
                break
            default:
                return 0
        }

        if (valA < valB) return sortDir === 'asc' ? -1 : 1
        if (valA > valB) return sortDir === 'asc' ? 1 : -1
        return 0
    })

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2">
                <Button
                    variant={view === 'card' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setView('card')}
                    title="Vista de Tarjetas"
                >
                    <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                    variant={view === 'table' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setView('table')}
                    title="Vista de Lista"
                >
                    <List className="h-4 w-4" />
                </Button>
            </div>

            {view === 'card' ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {clients.length === 0 ? (
                        <div className="col-span-full text-center h-24 text-muted-foreground flex items-center justify-center border rounded-md bg-card">
                            No hay clientes registrados.
                        </div>
                    ) : (
                        sortedClients.map((client, index) => {
                            const isLast = index === sortedClients.length - 1;

                            return (
                                <div key={client.id} ref={isLast ? lastElementRef : null}>
                                    <Card className={client.is_arrears ? 'border-2 border-red-500/50 h-full flex flex-col' : 'h-full flex flex-col'}>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">
                                                {client.full_name}
                                            </CardTitle>
                                            <div className="flex items-center gap-2">
                                                {client.whatsapp_reminders_enabled && (
                                                    <span title="Recordatorios WhatsApp activos" className="text-green-400">
                                                        <MessageSquare className="h-4 w-4" />
                                                    </span>
                                                )}
                                                {client.is_arrears && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px] px-1.5 py-0.5 border font-semibold text-red-500 border-red-500"
                                                    >
                                                        Saldo Pendiente
                                                    </Badge>
                                                )}
                                                <UsersIcon className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-2 flex-grow">
                                            <div className="text-2xl font-bold">{client.document}</div>
                                            <div className="text-xs text-muted-foreground break-words truncate">
                                                {client.address || 'Sin dirección'}
                                            </div>
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <PhoneIcon className="mr-1 h-3 w-3" />
                                                {client.phone || 'Sin teléfono'}
                                            </div>
                                            <div className="border-t pt-2 mt-2 grid grid-cols-2 gap-2 text-xs">
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Smartphone className="h-3 w-3" />
                                                    <span>Reparaciones: <span className="font-semibold text-foreground">{client.reparations_count}</span></span>
                                                </div>
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <CalendarDays className="h-3 w-3" />
                                                    <span>Últ. actividad: <span className="font-semibold text-foreground">{formatDate(client.last_purchase_date)}</span></span>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="mt-auto">
                                            <Link href={`/clients/${client.id}`} className="w-full">
                                                <Button className="w-full" variant="secondary">Ver Detalles</Button>
                                            </Link>
                                        </CardFooter>
                                    </Card>
                                </div>
                            )
                        })
                    )}
                    {loading && (
                        <div className="col-span-full flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </div>
            ) : (
                <div className="rounded-md border bg-card overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableHead label="Nombre" sortKey="full_name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                                <SortableHead label="Documento" sortKey="document" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                                <SortableHead label="Teléfono" sortKey="phone" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                                <SortableHead label="Reparaciones" sortKey="reparations_count" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="center" />
                                <SortableHead label="Deuda" sortKey="is_arrears" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="center" />
                                <SortableHead label="Últ. Actividad" sortKey="last_purchase_date" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedClients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No hay clientes registrados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedClients.map((client, index) => {
                                    const isLast = index === sortedClients.length - 1;

                                    return (
                                        <ClickableTableRow
                                            key={client.id}
                                            href={`/clients/${client.id}`}
                                            ref={isLast ? lastElementRef : null}
                                        >
                                            <TableCell className="font-medium">{client.full_name}</TableCell>
                                            <TableCell>{client.document}</TableCell>
                                            <TableCell>{client.phone || '-'}</TableCell>
                                            <TableCell className="text-center">{client.reparations_count}</TableCell>
                                            <TableCell className="text-center">
                                                {client.is_arrears ? (
                                                    <span className="inline-flex items-center gap-1 text-red-500 font-medium text-xs">
                                                        <AlertTriangle className="h-3 w-3" /> Sí
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">No</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs">{formatDate(client.last_purchase_date)}</TableCell>
                                        </ClickableTableRow>
                                    )
                                })
                            )}
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-16">
                                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
