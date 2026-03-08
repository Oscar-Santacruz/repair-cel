'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, TrendingUp, Users } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

interface AgingBucket {
    label: string
    count: number
    clientCount: number
    amount: number
    color: string
}

interface AgingPortfolioCardProps {
    agingData: AgingBucket[]
    overdueAmount: number
}

export function AgingPortfolioCard({ agingData, overdueAmount }: AgingPortfolioCardProps) {
    const [viewMode, setViewMode] = useState<'installments' | 'clients'>('installments')

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Antigüedad de Cartera Vencida
                </CardTitle>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-[180px]">
                    <TabsList className="grid w-full grid-cols-2 h-8">
                        <TabsTrigger value="installments" className="text-[10px] py-1">Cuotas</TabsTrigger>
                        <TabsTrigger value="clients" className="text-[10px] py-1">Clientes</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {agingData.map((bucket, idx) => (
                        <Link href="/reports/due-installments" key={idx} className="block hover:opacity-80 transition-opacity">
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium">{bucket.label}</span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        {viewMode === 'installments' ? (
                                            <>
                                                <TrendingUp className="h-3 w-3 inline" /> {bucket.count} cuotas
                                            </>
                                        ) : (
                                            <>
                                                <Users className="h-3 w-3 inline" /> {bucket.clientCount} clientes
                                            </>
                                        )}
                                        <span className="ml-1">→</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${overdueAmount > 0 ? (bucket.amount / overdueAmount) * 100 : 0}%`,
                                                backgroundColor: bucket.color
                                            }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold min-w-[100px] text-right">
                                        {formatCurrency(bucket.amount)}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
