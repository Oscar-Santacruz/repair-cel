// Types and constants for the inventory module
// Kept separate from 'use server' actions.ts

export type StockType = 'REPUESTO' | 'INSUMO' | 'PRODUCTO'

export const STOCK_TYPE_LABELS: Record<StockType, string> = {
    REPUESTO: 'Repuesto',
    INSUMO: 'Insumo',
    PRODUCTO: 'Producto para Venta',
}

export const STOCK_TYPE_COLORS: Record<StockType, string> = {
    REPUESTO: 'bg-blue-500/10 text-blue-700 border-blue-400/30',
    INSUMO: 'bg-amber-500/10 text-amber-700 border-amber-400/30',
    PRODUCTO: 'bg-green-500/10 text-green-700 border-green-400/30',
}

export const CATEGORIES_BY_TYPE: Record<StockType, { value: string; label: string }[]> = {
    REPUESTO: [
        { value: 'PANTALLA', label: 'Pantalla / Display' },
        { value: 'BATERIA', label: 'Batería' },
        { value: 'CONECTOR', label: 'Conector de Carga' },
        { value: 'PLACA', label: 'Placa / IC / Chip' },
        { value: 'CAMARA', label: 'Cámara' },
        { value: 'ALTAVOZ', label: 'Altavoz / Bocina' },
        { value: 'CARCASA', label: 'Carcasa / Marco' },
        { value: 'BOTON', label: 'Botones / Flex' },
        { value: 'OTRO', label: 'Otro repuesto' },
    ],
    INSUMO: [
        { value: 'SOLDADURA', label: 'Soldadura / Estaño' },
        { value: 'FLUX', label: 'Flux / Pasta desoxidante' },
        { value: 'QUIMICO', label: 'Químico / Isopropanol' },
        { value: 'ADHESIVO', label: 'Adhesivo / Cinta doble faz' },
        { value: 'PASTA_TERMICA', label: 'Pasta térmica' },
        { value: 'OTRO', label: 'Otro insumo' },
    ],
    PRODUCTO: [
        { value: 'CELULAR', label: 'Celular / Móvil' },
        { value: 'ACCESORIO', label: 'Accesorio (cargador, cable)' },
        { value: 'FUNDA', label: 'Funda / Protector' },
        { value: 'LAMINA', label: 'Lámina / Vidrio templado' },
        { value: 'AURICULAR', label: 'Auricular / Manos libres' },
        { value: 'OTRO', label: 'Otro producto' },
    ],
}
