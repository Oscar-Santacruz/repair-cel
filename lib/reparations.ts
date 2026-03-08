// Reparation types and constants — NOT a server file, safe to import anywhere

export type ReparationStatus = 'RECEIVED' | 'IN_REVIEW' | 'DOING' | 'READY' | 'DELIVERED'

export const STATUS_LABELS: Record<ReparationStatus, string> = {
    RECEIVED: 'Recibido',
    IN_REVIEW: 'En Revisión',
    DOING: 'En Reparación',
    READY: 'Listo para Entrega',
    DELIVERED: 'Entregado',
}

export const STATUS_COLORS: Record<ReparationStatus, string> = {
    RECEIVED: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    IN_REVIEW: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    DOING: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    READY: 'bg-green-500/10 text-green-600 border-green-500/30',
    DELIVERED: 'bg-muted text-muted-foreground border-border',
}

export const STATUS_FLOW: ReparationStatus[] = ['RECEIVED', 'IN_REVIEW', 'DOING', 'READY', 'DELIVERED']

export const NEXT_ACTION_LABELS: Partial<Record<ReparationStatus, string>> = {
    RECEIVED: 'Iniciar Revisión →',
    IN_REVIEW: 'Comenzar Reparación →',
    DOING: 'Marcar como Listo →',
    READY: 'Confirmar Entrega →',
}

export interface Reparation {
    id: string
    organization_id: string
    ticket_number: string
    client_id: string
    received_by: string | null
    assigned_technician_id: string | null
    device_brand: string
    device_model: string
    imei_or_serial: string | null
    aesthetic_condition: string | null
    entry_checklist: Record<string, boolean>
    exit_checklist: Record<string, boolean>
    status: ReparationStatus
    budget: number | null
    created_at: string
    completed_at: string | null
    updated_at: string
    // Joined
    clients?: { full_name: string; phone: string | null; document: string | null }
}
