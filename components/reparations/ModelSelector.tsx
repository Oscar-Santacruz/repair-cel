'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PHONE_MODELS } from '@/lib/phoneModels'

interface ModelSelectorProps {
    name: string
    defaultValue?: string
    required?: boolean
    selectedBrand?: string
}

export function ModelSelector({ name, defaultValue = '', required, selectedBrand }: ModelSelectorProps) {
    const [selected, setSelected] = useState(defaultValue)
    const [search, setSearch] = useState('')
    const [open, setOpen] = useState(false)
    const [customInput, setCustomInput] = useState(
        defaultValue && !getModelsForBrand(selectedBrand).includes(defaultValue) ? defaultValue : ''
    )

    function getModelsForBrand(brand?: string): string[] {
        if (!brand) return []
        return PHONE_MODELS[brand] || []
    }

    const brandModels = useMemo(() => getModelsForBrand(selectedBrand), [selectedBrand])

    const filtered = useMemo(() =>
        brandModels.filter(m => m.toLowerCase().includes(search.toLowerCase())),
        [brandModels, search]
    )

    const displayValue = selected || customInput

    function handleSelect(model: string) {
        setSelected(model)
        setCustomInput('')
        setSearch('')
        setOpen(false)
    }

    function handleCustom(val: string) {
        setCustomInput(val)
        setSelected('')
    }

    return (
        <div className="space-y-2">
            <input type="hidden" name={name} value={displayValue} required={required} />

            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                disabled={!selectedBrand && brandModels.length === 0}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border text-sm bg-background text-left transition-colors ${!selectedBrand ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent/50 cursor-pointer'} ${open ? 'border-primary ring-2 ring-primary/20' : 'border-input'}`}
            >
                <div className="flex items-center gap-2">
                    {displayValue ? (
                        <span className="font-medium">{displayValue}</span>
                    ) : (
                        <span className="text-muted-foreground">
                            {selectedBrand ? `Seleccionar modelo de ${selectedBrand}...` : 'Primero selecciona una marca'}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {displayValue && (
                        <X
                            className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                            onClick={e => { e.stopPropagation(); setSelected(''); setCustomInput('') }}
                        />
                    )}
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Dropdown */}
            {open && selectedBrand && (
                <div className="border rounded-lg bg-background shadow-xl z-50 overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder={`Buscar modelo de ${selectedBrand}...`}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-8 h-8 text-sm"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Models list */}
                    <div className="max-h-56 overflow-y-auto">
                        {filtered.length > 0 ? (
                            <div className="p-1.5 grid grid-cols-1 gap-0.5">
                                {filtered.map(model => (
                                    <button
                                        key={model}
                                        type="button"
                                        onClick={() => handleSelect(model)}
                                        className={`w-full flex items-center px-3 py-2 rounded-md text-sm text-left transition-colors ${selected === model
                                            ? 'bg-primary/10 text-primary font-semibold'
                                            : 'hover:bg-accent'
                                            }`}
                                    >
                                        {model}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground text-sm py-4">
                                No se encontraron modelos para "{search}"
                            </p>
                        )}

                        {/* Custom model input */}
                        <div className="p-2 pt-0 border-t mt-1">
                            <p className="text-xs text-muted-foreground mb-1.5 px-1">¿No está en la lista? Escribe el modelo:</p>
                            <Input
                                placeholder={`Ej: ${selectedBrand} Custom Model...`}
                                value={customInput}
                                onChange={e => handleCustom(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (customInput) setOpen(false) } }}
                                className="h-8 text-sm"
                            />
                            {customInput && (
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="mt-1.5 w-full text-xs text-primary hover:underline text-left px-1"
                                >
                                    Usar "{customInput}" como modelo →
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
