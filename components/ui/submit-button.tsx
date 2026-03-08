'use client'

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function SubmitButton({
    children,
    className,
    loadingText = "Guardando...",
    disabled: disabledProp = false
}: {
    children: React.ReactNode
    className?: string
    loadingText?: string
    disabled?: boolean
}) {
    const { pending } = useFormStatus()

    return (
        <Button type="submit" disabled={pending || disabledProp} className={className}>
            {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {pending ? loadingText : children}
        </Button>
    )
}
