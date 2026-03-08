import { getCajaData } from "./actions"
import { ArrowDownLeft, ArrowUpRight, Landmark, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface PageProps {
    searchParams: Promise<{ from?: string; to?: string }>
}

function formatGs(v: number) { return `Gs. ${v.toLocaleString('es-PY')}` }

function today() { return new Date().toISOString().split('T')[0] }

export default async function CajaPage({ searchParams }: PageProps) {
    const { from = today(), to = today() } = await searchParams
    const { movements, totalIn, totalOut, balance } = await getCajaData(from, to)

    const typeColors: Record<string, string> = {
        'VENTA': 'bg-green-500/10 border-green-400/30 text-green-700',
        'COMPRA': 'bg-red-500/10 border-red-400/30 text-red-700',
        'PAGO_REPARACION': 'bg-blue-500/10 border-blue-400/30 text-blue-700',
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Caja</h2>
                    <p className="text-muted-foreground">Movimientos de ingresos y egresos del período</p>
                </div>
                {/* Date range filter */}
                <form method="GET" className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-sm">
                        <label htmlFor="from" className="text-muted-foreground">Desde</label>
                        <input id="from" name="from" type="date" defaultValue={from}
                            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                        <label htmlFor="to" className="text-muted-foreground">Hasta</label>
                        <input id="to" name="to" type="date" defaultValue={to}
                            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <button type="submit" className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                        Filtrar
                    </button>
                </form>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-green-400/30 bg-green-500/5">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Entradas</p>
                                <p className="text-2xl font-bold text-green-700 font-mono">{formatGs(totalIn)}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <ArrowDownLeft className="h-5 w-5 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-red-400/30 bg-red-500/5">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Salidas</p>
                                <p className="text-2xl font-bold text-red-700 font-mono">{formatGs(totalOut)}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                <ArrowUpRight className="h-5 w-5 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={balance >= 0 ? 'border-primary/30 bg-primary/5' : 'border-amber-400/30 bg-amber-500/5'}>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Balance</p>
                                <p className={`text-2xl font-bold font-mono ${balance >= 0 ? 'text-primary' : 'text-amber-700'}`}>{formatGs(balance)}</p>
                            </div>
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${balance >= 0 ? 'bg-primary/10' : 'bg-amber-500/10'}`}>
                                <TrendingUp className={`h-5 w-5 ${balance >= 0 ? 'text-primary' : 'text-amber-600'}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Movements list */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-primary" /> Movimientos
                        <span className="ml-auto text-sm font-normal text-muted-foreground">{movements.length} registros</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {movements.length === 0 ? (
                        <div className="h-24 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <Landmark className="h-6 w-6 opacity-30" />
                            <p className="text-sm">Sin movimientos en el período seleccionado</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {movements.map(m => (
                                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${m.direction === 'IN' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                        {m.direction === 'IN'
                                            ? <ArrowDownLeft className="h-4 w-4 text-green-600" />
                                            : <ArrowUpRight className="h-4 w-4 text-red-600" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{m.description}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(m.created_at).toLocaleString('es-PY')}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`font-mono font-semibold ${m.direction === 'IN' ? 'text-green-700' : 'text-red-700'}`}>
                                            {m.direction === 'IN' ? '+' : '-'}{formatGs(m.amount)}
                                        </p>
                                        <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full border ${typeColors[m.type] || ''}`}>
                                            {m.type.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
