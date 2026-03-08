export function ArrearsLegend() {
    const items = [
        { color: '#22c55e', bg: '#22c55e18', border: '#22c55e40', label: 'Al día', range: '0 días' },
        { color: '#facc15', bg: '#facc1518', border: '#facc1540', label: '1-30 días', range: 'mora leve' },
        { color: '#f59e0b', bg: '#f59e0b18', border: '#f59e0b40', label: '31-60 días', range: 'mora media' },
        { color: '#f97316', bg: '#f9731618', border: '#f9731640', label: '61-90 días', range: 'mora alta' },
        { color: '#ef4444', bg: '#ef444418', border: '#ef444440', label: '+90 días', range: 'mora crítica' },
    ]

    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium">Días de mora:</span>
            {items.map((item) => (
                <span
                    key={item.label}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-medium ring-1 ring-inset"
                    style={{ color: item.color, backgroundColor: item.bg, borderColor: item.border }}
                >
                    <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                    <span className="opacity-70">· {item.range}</span>
                </span>
            ))}
        </div>
    )
}
