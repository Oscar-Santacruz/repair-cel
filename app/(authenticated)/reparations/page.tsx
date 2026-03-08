import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Wrench, Clock, CheckCircle2 } from "lucide-react"
import { getReparations } from "./actions"
import { STATUS_LABELS, STATUS_COLORS, ReparationStatus } from '@/lib/reparations'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"

const STATUS_OPTIONS = ['', 'RECEIVED', 'IN_REVIEW', 'DOING', 'READY', 'DELIVERED'] as const

interface PageProps {
    searchParams: Promise<{ q?: string; status?: string; page?: string }>
}

export default async function ReparationsPage({ searchParams }: PageProps) {
    const { q = '', status = '', page = '1' } = await searchParams
    const currentPage = parseInt(page)

    const { reparations, totalCount } = await getReparations(q, status, currentPage)

    const countByStatus = {
        active: totalCount, // We'll show total for now
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Recepciones</h2>
                    <p className="text-muted-foreground">Órdenes de reparación del taller · {totalCount} en total</p>
                </div>
                <Link href="/reparations/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Recepción
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <form method="GET" className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        name="q"
                        defaultValue={q}
                        placeholder="Buscar por ticket, marca, modelo..."
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {STATUS_OPTIONS.map(s => (
                        <Link
                            key={s}
                            href={`/reparations?q=${q}&status=${s}`}
                        >
                            <Button
                                variant={status === s ? 'default' : 'outline'}
                                size="sm"
                                type="button"
                            >
                                {s === '' ? 'Todos' : STATUS_LABELS[s as ReparationStatus]}
                            </Button>
                        </Link>
                    ))}
                </div>
            </form>

            {/* Table */}
            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ticket</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Equipo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Presupuesto</TableHead>
                            <TableHead>Fecha</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reparations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Wrench className="h-8 w-8 opacity-30" />
                                        <p>No hay órdenes de reparación.</p>
                                        <Link href="/reparations/new">
                                            <Button size="sm" variant="secondary">
                                                <Plus className="h-4 w-4 mr-1" /> Crear primera recepción
                                            </Button>
                                        </Link>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : reparations.map(rep => (
                            <TableRow key={rep.id} className="cursor-pointer hover:bg-muted/50">
                                <TableCell>
                                    <Link href={`/reparations/${rep.id}`} className="font-mono font-medium text-primary hover:underline">
                                        {rep.ticket_number}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <p className="font-medium text-sm">{rep.clients?.full_name}</p>
                                        <p className="text-xs text-muted-foreground">{rep.clients?.phone || rep.clients?.document || '-'}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="font-medium text-sm">{rep.device_brand} {rep.device_model}</p>
                                    {rep.imei_or_serial && (
                                        <p className="text-xs text-muted-foreground font-mono">{rep.imei_or_serial}</p>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[rep.status as ReparationStatus]}`}>
                                        {STATUS_LABELS[rep.status as ReparationStatus]}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                    {rep.budget ? `Gs. ${rep.budget.toLocaleString('es-PY')}` : <span className="text-muted-foreground">-</span>}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {new Date(rep.created_at).toLocaleDateString('es-PY')}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
