"use client"

import { useRouter } from "next/navigation"
import { TableRow } from "@/components/ui/table"
import { forwardRef } from "react"

interface ClickableTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    href: string
}

export const ClickableTableRow = forwardRef<HTMLTableRowElement, ClickableTableRowProps>(
    ({ href, children, className, ...props }, ref) => {
        const router = useRouter()

        return (
            <TableRow
                ref={ref}
                className={`cursor-pointer hover:bg-muted/50 ${className || ''}`}
                onClick={(e) => {
                    if ((e.target as HTMLElement).closest('a, button')) {
                        return;
                    }
                    router.push(href);
                }}
                {...props}
            >
                {children}
            </TableRow>
        )
    }
)

ClickableTableRow.displayName = "ClickableTableRow"
