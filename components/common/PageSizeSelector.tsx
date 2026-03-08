"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

interface PageSizeSelectorProps {
    currentSize: number
    sizes?: number[]
}

export function PageSizeSelector({ currentSize, sizes = [20, 50, 100, 200] }: PageSizeSelectorProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const handleValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('limit', value)
        // Reset to page 1 when changing page size
        params.set('page', '1')
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Mostrar:</span>
            <Select value={currentSize.toString()} onValueChange={handleValueChange}>
                <SelectTrigger className="h-9 w-[70px]">
                    <SelectValue placeholder={currentSize.toString()} />
                </SelectTrigger>
                <SelectContent>
                    {sizes.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                            {size}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
