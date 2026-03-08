'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus } from "lucide-react"
import { toast } from "sonner"

interface ParametricItem {
    id: string
    name: string
}

interface ParametricSettingsProps {
    title: string
    description: string
    items: ParametricItem[]
    onCreate: (name: string) => Promise<any>
    onDelete: (id: string) => Promise<any>
}

export function ParametricSettings({ title, description, items, onCreate, onDelete }: ParametricSettingsProps) {
    const [newItemName, setNewItemName] = useState("")
    const [isCreating, setIsCreating] = useState(false)

    const handleCreate = async () => {
        if (!newItemName.trim()) return
        setIsCreating(true)
        try {
            await onCreate(newItemName)
            setNewItemName("")
            toast.success("Item agregado correctamente")
        } catch (error: any) {
            toast.error("Error al agregar item: " + error.message)
        } finally {
            setIsCreating(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Está seguro de eliminar este item?")) return
        try {
            await onDelete(id)
            toast.success("Item eliminado")
        } catch (error: any) {
            toast.error("Error al eliminar item: " + error.message)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Nombre / Valor..."
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    />
                    <Button onClick={handleCreate} disabled={isCreating || !newItemName.trim()}>
                        <Plus className="h-4 w-4 mr-2" /> Agregar
                    </Button>
                </div>

                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                                        Sin datos cargados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(item.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
