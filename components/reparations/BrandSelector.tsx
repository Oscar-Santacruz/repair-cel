'use client'

import { useState } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

const BRANDS = [
    { name: 'Samsung', slug: 'samsung', color: '#1428A0' },
    { name: 'Apple', slug: 'apple', color: '#555555' },
    { name: 'Motorola', slug: 'motorola', color: '#E1001A' },
    { name: 'Xiaomi', slug: 'xiaomi', color: '#FF6900' },
    { name: 'Huawei', slug: 'huawei', color: '#CF0A2C' },
    { name: 'Nokia', slug: 'nokia', color: '#124191' },
    { name: 'Sony', slug: 'sony', color: '#000000' },
    { name: 'LG', slug: 'lg', color: '#A50034' },
    { name: 'OnePlus', slug: 'oneplus', color: '#F5010C' },
    { name: 'OPPO', slug: 'oppo', color: '#1D8348' },
    { name: 'Vivo', slug: 'vivo', color: '#415FFF' },
    { name: 'Realme', slug: 'realme', color: '#FFBB00' },
    { name: 'Honor', slug: 'honor', color: '#B71C1C' },
    { name: 'Tecno', slug: '', color: '#00AEEF' },
    { name: 'Alcatel', slug: '', color: '#0033A0' },
    { name: 'ZTE', slug: '', color: '#E30613' },
    { name: 'TCL', slug: '', color: '#E30613' },
    { name: 'Infinix', slug: '', color: '#FF0000' },
]

function BrandAvatar({ name, slug, color, size = 40 }: { name: string; slug: string; color: string; size?: number }) {
    const [imgError, setImgError] = useState(false)

    if (slug && !imgError) {
        return (
            <img
                src={`https://cdn.simpleicons.org/${slug}/${color.replace('#', '')}`}
                alt={name}
                width={size}
                height={size}
                onError={() => setImgError(true)}
                className="object-contain"
                style={{ width: size, height: size }}
            />
        )
    }

    // Fallback: colored letter avatar
    return (
        <div
            className="rounded-full flex items-center justify-center text-white font-bold"
            style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.4 }}
        >
            {name[0]}
        </div>
    )
}

interface BrandSelectorProps {
    name: string
    defaultValue?: string
    required?: boolean
    onBrandChange?: (brand: string) => void
}

export function BrandSelector({ name, defaultValue = '', required, onBrandChange }: BrandSelectorProps) {
    const [selected, setSelected] = useState(defaultValue)
    const [search, setSearch] = useState('')
    const [open, setOpen] = useState(false)
    const [customInput, setCustomInput] = useState(
        defaultValue && !BRANDS.find(b => b.name === defaultValue) ? defaultValue : ''
    )

    const filtered = BRANDS.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase())
    )

    const selectedBrand = BRANDS.find(b => b.name === selected)
    const displayValue = selected || customInput

    function handleSelect(brandName: string) {
        setSelected(brandName)
        setCustomInput('')
        setSearchText('')
        setOpen(false)
        onBrandChange?.(brandName)
    }

    function setSearchText(val: string) {
        setSearch(val)
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
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border text-sm bg-background text-left transition-colors hover:bg-accent/50 ${open ? 'border-primary ring-2 ring-primary/20' : 'border-input'}`}
            >
                <div className="flex items-center gap-2">
                    {selectedBrand ? (
                        <>
                            <BrandAvatar {...selectedBrand} size={20} />
                            <span className="font-medium">{selectedBrand.name}</span>
                        </>
                    ) : displayValue ? (
                        <span className="font-medium">{displayValue}</span>
                    ) : (
                        <span className="text-muted-foreground">Seleccionar marca...</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {displayValue && (
                        <X
                            className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                            onClick={e => { e.stopPropagation(); setSelected(''); setCustomInput(''); onBrandChange?.('') }}
                        />
                    )}
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="border rounded-lg bg-background shadow-xl z-50 overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Buscar marca..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-8 h-8 text-sm"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Brands grid */}
                    <div className="p-2 max-h-64 overflow-y-auto">
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                            {filtered.map(brand => (
                                <button
                                    key={brand.name}
                                    type="button"
                                    onClick={() => handleSelect(brand.name)}
                                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-all hover:shadow-md ${selected === brand.name
                                        ? 'border-primary bg-primary/10 shadow-sm'
                                        : 'border-border bg-card hover:border-primary/50 hover:bg-accent/50'
                                        }`}
                                >
                                    <BrandAvatar {...brand} size={32} />
                                    <span className="text-center leading-tight">{brand.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Custom input */}
                        <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1.5 px-1">¿No está en la lista? Escribe la marca:</p>
                            <Input
                                placeholder="Ej: Blackberry, Asus, Google Pixel..."
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
                                    Usar "{customInput}" como marca →
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
