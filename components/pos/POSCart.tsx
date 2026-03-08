'use client'

import { useState, useTransition } from 'react'
import { Search, Plus, Minus, ShoppingBag, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubmitButton } from '@/components/ui/submit-button'
import { createSaleAction, SaleCartItem } from '@/app/(authenticated)/pos/actions'

type Product = {
    id: string; name: string; selling_price: number | null; price: number | null
    quantity: number; category: string | null; brand: string | null; sku: string | null
}

type ClientOption = { id: string; full_name: string; phone: string | null }

function formatGs(v: number) { return `Gs. ${v.toLocaleString('es-PY')}` }

interface POSCartProps {
    products: Product[]
    clients: ClientOption[]
}

export function POSCart({ products, clients }: POSCartProps) {
    const [cart, setCart] = useState<SaleCartItem[]>([])
    const [search, setSearch] = useState('')
    const [discount, setDiscount] = useState(0)
    const [paymentMethod, setPaymentMethod] = useState('CASH')
    const [clientId, setClientId] = useState('')
    const [notes, setNotes] = useState('')
    const [isPending, startTransition] = useTransition()

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(search.toLowerCase())
    )

    function addToCart(product: Product) {
        const price = product.selling_price ?? product.price ?? 0
        setCart(prev => {
            const existing = prev.find(i => i.stock_id === product.id)
            if (existing) {
                return prev.map(i => i.stock_id === product.id
                    ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unit_price }
                    : i)
            }
            return [...prev, { stock_id: product.id, description: product.name, quantity: 1, unit_price: price, total: price }]
        })
    }

    function changeQty(stockId: string, delta: number) {
        setCart(prev => prev
            .map(i => i.stock_id === stockId
                ? { ...i, quantity: Math.max(1, i.quantity + delta), total: Math.max(1, i.quantity + delta) * i.unit_price }
                : i)
            .filter(i => i.quantity > 0))
    }

    function removeFromCart(stockId: string) {
        setCart(prev => prev.filter(i => i.stock_id !== stockId))
    }

    const subtotal = cart.reduce((s, i) => s + i.total, 0)
    const total = Math.max(0, subtotal - discount)

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-4">
            {/* Product grid */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto..." className="pl-9" />
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
                            <ShoppingBag className="h-8 w-8 opacity-30" />
                            <p className="text-sm">{search ? 'Sin resultados' : 'No hay productos para venta. Agrega productos tipo "PRODUCTO" en el inventario.'}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                            {filtered.map(p => {
                                const price = p.selling_price ?? p.price ?? 0
                                const inCart = cart.find(c => c.stock_id === p.id)
                                return (
                                    <button key={p.id} type="button" onClick={() => addToCart(p)}
                                        className={`relative text-left p-3 rounded-xl border bg-card hover:bg-accent/50 active:scale-95 transition-all ${inCart ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}>
                                        {inCart && (
                                            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                                                {inCart.quantity}
                                            </span>
                                        )}
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary text-xs font-bold">
                                            {(p.brand || p.name).charAt(0).toUpperCase()}
                                        </div>
                                        <p className="text-xs font-semibold leading-tight line-clamp-2">{p.name}</p>
                                        {p.sku && <p className="text-[10px] font-mono text-muted-foreground">{p.sku}</p>}
                                        <p className="text-sm font-bold mt-1 text-primary">{formatGs(price)}</p>
                                        <p className="text-[10px] text-muted-foreground">Stock: {p.quantity}</p>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Cart panel */}
            <div className="w-80 shrink-0 flex flex-col border rounded-xl bg-card">
                <div className="p-4 border-b">
                    <h3 className="font-semibold flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-primary" /> Carrito
                        {cart.length > 0 && <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{cart.length}</span>}
                    </h3>
                </div>

                {cart.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                        Tocá un producto para agregarlo
                    </div>
                ) : (
                    <form
                        className="flex-1 flex flex-col overflow-hidden"
                        action={formData => startTransition(() => createSaleAction(formData))}
                    >
                        <input type="hidden" name="items_json" value={JSON.stringify(cart)} />
                        <input type="hidden" name="client_id" value={clientId} />
                        <input type="hidden" name="payment_method" value={paymentMethod} />
                        <input type="hidden" name="discount" value={discount} />
                        <input type="hidden" name="sale_notes" value={notes} />

                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {cart.map(item => (
                                <div key={item.stock_id} className="flex items-center gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">{item.description}</p>
                                        <p className="text-xs text-muted-foreground">{formatGs(item.unit_price)} c/u</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button type="button" onClick={() => changeQty(item.stock_id, -1)} className="h-5 w-5 rounded bg-muted flex items-center justify-center">
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                        <button type="button" onClick={() => changeQty(item.stock_id, 1)} className="h-5 w-5 rounded bg-muted flex items-center justify-center">
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                    <p className="text-xs font-mono w-20 text-right">{formatGs(item.total)}</p>
                                    <button type="button" onClick={() => removeFromCart(item.stock_id)} className="text-destructive hover:opacity-70">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="p-3 border-t space-y-3">
                            <div className="space-y-2">
                                <Label className="text-xs">Cliente</Label>
                                <select value={clientId} onChange={e => setClientId(e.target.value)}
                                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                                    <option value="">Sin cliente</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Forma de Pago</Label>
                                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                                    <option value="CASH">Efectivo</option>
                                    <option value="TRANSFER">Transferencia</option>
                                    <option value="CARD">Tarjeta</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Descuento (Gs.)</Label>
                                <Input type="number" min="0" value={discount || ''} onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                                    placeholder="0" className="h-8 text-xs" />
                            </div>

                            <div className="py-2 border-t space-y-1">
                                {discount > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Subtotal</span><span className="font-mono">{formatGs(subtotal)}</span></div>}
                                {discount > 0 && <div className="flex justify-between text-xs text-green-600"><span>Descuento</span><span className="font-mono">-{formatGs(discount)}</span></div>}
                                <div className="flex justify-between font-bold"><span>Total</span><span className="font-mono text-primary">{formatGs(total)}</span></div>
                            </div>

                            <SubmitButton className="w-full h-10 font-semibold" disabled={cart.length === 0 || isPending}>
                                Confirmar Venta
                            </SubmitButton>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
