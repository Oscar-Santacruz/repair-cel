"use client"

import * as React from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"

interface SortableTableHeadProps {
    label: string
    sortKey: string
    className?: string
    align?: "left" | "center" | "right"
}

export function SortableTableHead({ label, sortKey, className, align = "left" }: SortableTableHeadProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const currentSort = searchParams.get("sort")
    const currentOrder = searchParams.get("order")

    const isActive = currentSort === sortKey

    const toggleSort = () => {
        const params = new URLSearchParams(searchParams.toString())

        if (isActive) {
            if (currentOrder === "asc") {
                params.set("sort", sortKey)
                params.set("order", "desc")
            } else {
                // If it was desc, clear sorting
                params.delete("sort")
                params.delete("order")
            }
        } else {
            // New sort key, default to asc
            params.set("sort", sortKey)
            params.set("order", "asc")
        }

        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <TableHead className={cn(
            align === "right" && "text-right",
            align === "center" && "text-center",
            className
        )}>
            <Button
                variant="ghost"
                onClick={toggleSort}
                className={cn(
                    "-ml-4 h-8 data-[state=open]:bg-accent",
                    align === "right" && "ml-equipo flex w-full justify-end pr-0 hover:bg-transparent",
                    align === "center" && "mx-equipo flex w-full justify-center"
                )}
            >
                <span>{label}</span>
                {isActive ? (
                    currentOrder === "asc" ? (
                        <ArrowUp className="ml-2 h-4 w-4 shrink-0" />
                    ) : (
                        <ArrowDown className="ml-2 h-4 w-4 shrink-0" />
                    )
                ) : (
                    <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </Button>
        </TableHead>
    )
}
