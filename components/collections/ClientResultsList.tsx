'use client'

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Calendar, AlertTriangle, Wallet, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { getArrearsTextColor, getArrearsHexColor } from "@/lib/utils"

type ClientResult = {
    id: string
    name: string
    ci: string
    pendingCount: number
    nearestDueDate: string | null
    totalOverdue: number
    maxDaysOverdue: number
    status: 'clean' | 'overdue' | 'warning'
}

interface ClientResultsListProps {
    clients: ClientResult[]
    onSelectClient: (clientId: string) => void
    isLoading?: boolean
}

type SortKey = 'name' | 'status' | 'pendingCount' | 'nearestDueDate'
type SortDir = 'asc' | 'desc'

const STATUS_ORDER: Record<string, number> = { overdue: 0, warning: 1, clean: 2 }

function SortableHead({ label, sortKey, currentSort, currentDir, onSort }: {
    label: string
    sortKey: SortKey
    currentSort: SortKey
    currentDir: SortDir
    onSort: (key: SortKey) => void
}) {
    const isActive = currentSort === sortKey
    return (
        <TableHead
            className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
            onClick={() => onSort(sortKey)}
        >
            <div className="flex items-center gap-1">
                {label}
                {isActive ? (
                    currentDir === 'asc'
                        ? <ChevronUp className="h-3 w-3 text-primary" />
                        : <ChevronDown className="h-3 w-3 text-primary" />
                ) : (
                    <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />
                )}
            </div>
        </TableHead>
    )
}

export function ClientResultsList({ clients, onSelectClient, isLoading }: ClientResultsListProps) {
    const [sortKey, setSortKey] = useState<SortKey>('status')
    const [sortDir, setSortDir] = useState<SortDir>('asc')

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDir('asc')
        }
    }

    const sorted = useMemo(() => {
        return [...clients].sort((a, b) => {
            let cmp = 0
            switch (sortKey) {
                case 'name':
                    cmp = (a.name || '').localeCompare(b.name || '')
                    break
                case 'status': {
                    const statusCmp = (STATUS_ORDER[a.status] ?? 2) - (STATUS_ORDER[b.status] ?? 2)
                    if (statusCmp !== 0) return sortDir === 'asc' ? statusCmp : -statusCmp
                    // Same status: sub-sort by days overdue descending (most urgent first)
                    return (b.maxDaysOverdue || 0) - (a.maxDaysOverdue || 0)
                }
                case 'pendingCount':
                    cmp = a.pendingCount - b.pendingCount
                    break
                case 'nearestDueDate': {
                    const da = a.nearestDueDate ? new Date(a.nearestDueDate).getTime() : Infinity
                    const db = b.nearestDueDate ? new Date(b.nearestDueDate).getTime() : Infinity
                    cmp = da - db
                    break
                }
            }
            return sortDir === 'asc' ? cmp : -cmp
        })
    }, [clients, sortKey, sortDir])

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Cargando resultados...</div>
    }

    if (clients.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/10 text-muted-foreground h-[300px]">
                <User className="h-12 w-12 mb-4 opacity-30" />
                <p>No se encontraron clientes con los filtros seleccionados</p>
            </div>
        )
    }

    return (
        <div className="border rounded-md overflow-hidden bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <SortableHead label="Cliente / Equipos" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                        <SortableHead label="Estado" sortKey="status" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                        <SortableHead label="Cuotas Pendientes" sortKey="pendingCount" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                        <SortableHead label="Próximo Vencimiento" sortKey="nearestDueDate" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                        <TableHead className="text-right"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sorted.map((client) => {
                        const isOverdue = client.status === 'overdue'

                        return (
                            <TableRow key={client.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => onSelectClient(client.id)}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                            {client.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium">{client.name}</div>
                                            <div className="text-sm text-muted-foreground">CI: {client.ci}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    {client.status === 'clean' && <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Al Día</Badge>}
                                    {client.status === 'warning' && <Badge variant="secondary" className="text-yellow-700 bg-yellow-100">Próximo</Badge>}
                                    {client.status === 'overdue' && (
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ring-1 ring-inset ${getArrearsTextColor(client.maxDaysOverdue || 0)}`}
                                            style={{ backgroundColor: `${getArrearsHexColor(client.maxDaysOverdue || 0)}18`, borderColor: `${getArrearsHexColor(client.maxDaysOverdue || 0)}40` }}
                                        >
                                            <AlertTriangle className="h-3 w-3" />
                                            Mora {client.maxDaysOverdue > 0 ? `${client.maxDaysOverdue}d` : ''}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="font-bold text-lg">{client.pendingCount}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        {client.nearestDueDate ? new Date(client.nearestDueDate).toLocaleDateString() : '-'}
                                    </div>
                                    {isOverdue && (
                                        <div className={`text-xs mt-1 font-semibold ${getArrearsTextColor(client.maxDaysOverdue || 0)}`}>
                                            {client.maxDaysOverdue > 0 ? `${client.maxDaysOverdue} días vencido` : 'Vencido'}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" onClick={(e) => {
                                        e.stopPropagation()
                                        onSelectClient(client.id)
                                    }}>
                                        <Wallet className="mr-2 h-4 w-4" />
                                        Plan de Pagos
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
