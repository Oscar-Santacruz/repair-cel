"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface SalesTrendData {
    label: string
    totalSales: number
    unitsSold: number
}

interface SalesTrendChartProps {
    data: SalesTrendData[]
    title?: string
}

export function MonthlySalesChart({ data, title = "Evolución de Ventas" }: SalesTrendChartProps) {
    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="label"
                            tick={{ fill: 'var(--color-muted-foreground)' }}
                            tickLine={{ stroke: 'var(--color-muted-foreground)' }}
                        />
                        <YAxis
                            yAxisId="left"
                            width={100}
                            tick={{ fill: 'var(--color-muted-foreground)' }}
                            tickLine={{ stroke: 'var(--color-muted-foreground)' }}
                            tickFormatter={(value) => {
                                if (value === 0) return '0 Gs.'
                                const millions = value / 1_000_000
                                return `${new Intl.NumberFormat('es-PY', { maximumFractionDigits: 1 }).format(millions)} mm Gs.`
                            }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fill: 'var(--color-muted-foreground)' }}
                            tickLine={{ stroke: 'var(--color-muted-foreground)' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '0.5rem',
                                color: 'hsl(var(--foreground))'
                            }}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                            formatter={(value: number | undefined, name: string | undefined) => {
                                if (value === undefined || name === undefined) return [null, '']
                                if (name === 'totalSales') {
                                    return [formatCurrency(value), 'Ventas']
                                }
                                return [value, 'Unidades']
                            }}
                        />
                        <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                        <Bar
                            yAxisId="left"
                            dataKey="totalSales"
                            fill="var(--color-chart-1)"
                            name="Ventas"
                            radius={[8, 8, 0, 0]}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="unitsSold"
                            stroke="var(--color-chart-2)"
                            strokeWidth={2}
                            name="Unidades"
                            dot={{ fill: 'var(--color-chart-2)', r: 4 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
