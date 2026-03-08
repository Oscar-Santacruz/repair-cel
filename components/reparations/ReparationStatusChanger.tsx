'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'
import { ReparationStatus, STATUS_LABELS, STATUS_FLOW, NEXT_ACTION_LABELS } from '@/lib/reparations'

interface Props {
    id: string
    currentStatus: ReparationStatus
    updateStatusAction: (id: string, status: ReparationStatus) => Promise<void>
}

export function ReparationStatusChanger({ id, currentStatus, updateStatusAction }: Props) {
    const [loading, setLoading] = useState(false)
    const currentIndex = STATUS_FLOW.indexOf(currentStatus)
    const nextStatus = currentIndex < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIndex + 1] : null
    const isDelivered = currentStatus === 'DELIVERED'

    async function handleAdvance() {
        if (!nextStatus) return
        setLoading(true)
        try {
            await updateStatusAction(id, nextStatus)
        } finally {
            setLoading(false)
        }
    }

    if (isDelivered) {
        return (
            <div className="flex items-center justify-center gap-2 text-green-600 py-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Equipo entregado al cliente</span>
            </div>
        )
    }

    return (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="text-sm text-muted-foreground">
                Estado actual: <span className="font-semibold text-foreground">{STATUS_LABELS[currentStatus]}</span>
            </div>
            {nextStatus && (
                <Button
                    onClick={handleAdvance}
                    disabled={loading}
                    className="gap-2"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                    {NEXT_ACTION_LABELS[currentStatus]}
                </Button>
            )}
        </div>
    )
}
