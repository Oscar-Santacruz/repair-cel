"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

interface PaginationProps {
    totalCount: number
    pageSize: number
    currentPage: number
}

export function Pagination({ totalCount, pageSize, currentPage }: PaginationProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const totalPages = Math.ceil(totalCount / pageSize)

    if (totalPages <= 1) return null

    const createQueryString = (page: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', page.toString())
        return params.toString()
    }

    const goToPage = (page: number) => {
        router.push(`${pathname}?${createQueryString(page)}`)
    }

    return (
        <div className="flex items-center justify-between px-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
                Mostrando {Math.min((currentPage - 1) * pageSize + 1, totalCount)} a {Math.min(currentPage * pageSize, totalCount)} de {totalCount} registros
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => goToPage(1)}
                    disabled={currentPage <= 1}
                >
                    <span className="sr-only">Ir a la primera página</span>
                    <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    <span className="sr-only">Ir a la página anterior</span>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Página {currentPage} de {totalPages}
                </div>
                <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    <span className="sr-only">Ir a la siguiente página</span>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage >= totalPages}
                >
                    <span className="sr-only">Ir a la última página</span>
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
