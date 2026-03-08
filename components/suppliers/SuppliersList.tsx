'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, Phone, Mail, MapPin, Pencil, Trash2, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { deleteSupplierAction, Supplier } from '@/app/(authenticated)/suppliers/actions'

export function SuppliersList({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
    const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
    const [search, setSearch] = useState('')
    const [deleting, setDeleting] = useState<string | null>(null)

    const filtered = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.phone || '').includes(search) ||
        (s.ruc_or_document || '').includes(search)
    )

    async function handleDelete(id: string) {
        setDeleting(id)
        try {
            await deleteSupplierAction(id)
            setSuppliers(prev => prev.filter(s => s.id !== id))
        } catch (e) { console.error(e) }
        finally { setDeleting(null) }
    }

    return (
        <div className="space-y-4">
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar proveedor..."
                    className="pl-9"
                />
            </div>

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border rounded-lg bg-card gap-3">
                    <Building2 className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-sm">No hay proveedores registrados.</p>
                    <Link href="/suppliers/new">
                        <Button size="sm" variant="secondary">
                            <Plus className="h-4 w-4 mr-1" /> Agregar primer proveedor
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map(supplier => (
                        <div key={supplier.id} className="relative group bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <Building2 className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm truncate">{supplier.name}</p>
                                        {supplier.ruc_or_document && (
                                            <p className="text-xs text-muted-foreground font-mono">RUC: {supplier.ruc_or_document}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <Link href={`/suppliers/${supplier.id}/edit`}>
                                        <Button size="icon" variant="ghost" className="h-7 w-7">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                    </Link>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Vas a eliminar a <strong>{supplier.name}</strong>. Solo se puede eliminar si no tiene compras registradas.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(supplier.id)} disabled={deleting === supplier.id} className="bg-destructive hover:bg-destructive/90">
                                                    Eliminar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>

                            <div className="mt-3 space-y-1">
                                {supplier.phone && (
                                    <a href={`tel:${supplier.phone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                        <Phone className="h-3 w-3" /> {supplier.phone}
                                    </a>
                                )}
                                {supplier.email && (
                                    <a href={`mailto:${supplier.email}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                        <Mail className="h-3 w-3" /> {supplier.email}
                                    </a>
                                )}
                                {supplier.address && (
                                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3" /> {supplier.address}
                                    </p>
                                )}
                                {supplier.notes && (
                                    <p className="text-xs text-muted-foreground/70 italic mt-1 line-clamp-2">{supplier.notes}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
