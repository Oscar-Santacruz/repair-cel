import { format } from "date-fns"
import { es } from "date-fns/locale"
import { User } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface AuditInfoProps {
    creation?: {
        by: string | null   // nombre ya resuelto desde el servidor
        at: string | null
    }
    update?: {
        by: string | null   // nombre ya resuelto desde el servidor
        at: string | null
    }
}

export function AuditInfo({ creation, update }: AuditInfoProps) {
    if (!creation?.at && !update?.at) return null

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "PP p", { locale: es })
        } catch (e) {
            return dateString
        }
    }

    const hasModification = update?.at && creation?.at && update.at !== creation.at

    return (
        <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-4 pt-4 border-t">
            {creation?.at && (
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                    <span className="font-semibold">Creado:</span>
                                    <span>{formatDate(creation.at as string)}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Por: {creation.by || 'Desconocido'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <span className="text-muted-foreground/50">|</span>
                    <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {creation.by || 'Desconocido'}
                    </span>
                </div>
            )}

            {hasModification && update?.at && (
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                    <span className="font-semibold">Modificado:</span>
                                    <span>{formatDate(update.at as string)}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Por: {update.by || 'Desconocido'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <span className="text-muted-foreground/50">|</span>
                    <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {update.by || 'Desconocido'}
                    </span>
                </div>
            )}
        </div>
    )
}
