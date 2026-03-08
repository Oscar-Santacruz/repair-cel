'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { startTransition, useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'

export type ViewMode = 'monthly' | 'annual' | 'all_time'

interface PeriodSelectorProps {
    currentYear: number
    currentMonth: number
    viewMode: ViewMode
    baseUrl?: string
}

export function PeriodSelector({
    currentYear,
    currentMonth,
    viewMode,
    baseUrl = '/dashboard'
}: PeriodSelectorProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [year, setYear] = useState(currentYear.toString())
    const [month, setMonth] = useState(currentMonth.toString())
    const [mode, setMode] = useState<ViewMode>(viewMode)

    // Generate years (current year +/- 5 years)
    const currentYearReal = new Date().getFullYear()
    const years = Array.from({ length: 11 }, (_, i) => currentYearReal - 5 + i)

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    const viewModes = [
        { value: 'monthly', label: 'Mensual' },
        { value: 'annual', label: 'Anual' },
        { value: 'all_time', label: 'Todos los tiempos' }
    ]

    const handleChange = (type: 'year' | 'month' | 'mode', value: string) => {
        const params = new URLSearchParams(searchParams)

        if (type === 'year') {
            setYear(value)
            params.set('year', value)
        } else if (type === 'month') {
            setMonth(value)
            params.set('month', value)
        } else if (type === 'mode') {
            setMode(value as ViewMode)
            params.set('viewMode', value)
        }

        // Ensure year is set
        if (!params.has('year')) params.set('year', year)

        // For monthly mode, ensure month is set
        if (mode === 'monthly' || value === 'monthly') {
            if (!params.has('month')) params.set('month', month)
        } else {
            // For annual and all_time modes, remove month parameter
            params.delete('month')
        }

        if (mode === 'all_time' || value === 'all_time') {
            params.delete('year')
        }

        startTransition(() => {
            router.push(`${baseUrl}?${params.toString()}`)
        })
    }

    // Sync state with props if they change externally
    useEffect(() => {
        setYear(currentYear.toString())
        setMonth(currentMonth.toString())
        setMode(viewMode)
    }, [currentYear, currentMonth, viewMode])

    const getDisplayLabel = () => {
        switch (mode) {
            case 'monthly':
                return `${months[parseInt(month)]} ${year}`
            case 'annual':
                return `Año ${year}`
            case 'all_time':
                return 'Todos los tiempos'
            default:
                return ''
        }
    }

    return (
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 mb-6 bg-card p-3 rounded-lg border shadow-sm">
            {/* View Mode Selector */}
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Vista:</span>
                <Select value={mode} onValueChange={(v) => handleChange('mode', v)}>
                    <SelectTrigger className="w-[140px] border-0 focus:ring-0 shadow-none font-medium">
                        <SelectValue placeholder="Modo de vista" />
                    </SelectTrigger>
                    <SelectContent>
                        {viewModes.map((vm) => (
                            <SelectItem key={vm.value} value={vm.value}>
                                {vm.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="hidden lg:block h-6 w-[1px] bg-border" />

            {/* Period Selectors */}
            {mode !== 'all_time' && (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Periodo:</span>

                    {/* Month selector - only shown in monthly mode */}
                    {mode === 'monthly' && (
                        <>
                            <Select value={month} onValueChange={(v) => handleChange('month', v)}>
                                <SelectTrigger className="w-[140px] border-0 focus:ring-0 shadow-none font-medium">
                                    <SelectValue placeholder="Mes" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((m, i) => (
                                        <SelectItem key={i} value={i.toString()}>
                                            {m}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="h-4 w-[1px] bg-border" />
                        </>
                    )}

                    {/* Year selector - always shown unless all_time */}
                    <Select value={year} onValueChange={(v) => handleChange('year', v)}>
                        <SelectTrigger className="w-[100px] border-0 focus:ring-0 shadow-none font-medium">
                            <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((y) => (
                                <SelectItem key={y} value={y.toString()}>
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Display current selection */}
            <div className="hidden lg:block h-6 w-[1px] bg-border" />
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded">
                <span className="text-xs font-semibold text-muted-foreground">Mostrando:</span>
                <span className="text-xs font-bold">{getDisplayLabel()}</span>
            </div>
        </div>
    )
}
