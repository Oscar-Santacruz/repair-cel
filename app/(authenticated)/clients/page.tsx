import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"
import { ClientList } from "@/components/clients/ClientList"
import Link from "next/link"
import { ClientFilters } from "@/components/clients/ClientFilters"
import { Pagination } from "@/components/ui/pagination"
import { ArrearsLegend } from "@/components/common/ArrearsLegend"
import { PageSizeSelector } from "@/components/common/PageSizeSelector"
import { getClients } from "./actions"
import { getCurrentOrgPlan } from "@/lib/permissions"

export default async function ClientsPage(props: {
    searchParams?: Promise<{
        query?: string
        page?: string
        limit?: string
    }>
}) {
    const searchParams = await props.searchParams
    const query = searchParams?.query || ''
    const page = parseInt(searchParams?.page || '1')
    const limit = parseInt(searchParams?.limit || '20')
    const { clients, count } = await getClients(query, page, limit)
    const plan = await getCurrentOrgPlan()
    const isFree = plan === 'free'

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <ClientFilters />
                    {isFree ? (
                        <Button variant="outline" disabled title="Función solo disponible en el plan PRO">
                            <Upload className="mr-2 h-4 w-4" /> Carga Masiva (PRO)
                        </Button>
                    ) : (
                        <Link href="/clients/bulk-import">
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" /> Carga Masiva
                            </Button>
                        </Link>
                    )}
                    <Link href="/clients/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
                        </Button>
                    </Link>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <ArrearsLegend />
                <PageSizeSelector currentSize={limit} />
            </div>
            <ClientList initialClients={clients} limit={limit} query={query} totalCount={count} />
            <Pagination
                totalCount={count}
                pageSize={limit}
                currentPage={page}
            />
        </div>
    )
}

