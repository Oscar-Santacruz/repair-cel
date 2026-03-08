import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Car, TrendingUp, Package, AlertCircle, MapPin } from "lucide-react"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { formatCurrency, getArrearsHexColor } from "@/lib/utils"
import { startOfMonth, endOfMonth, startOfYear, endOfYear, formatISO, startOfDay, endOfDay } from "date-fns"
import { PeriodSelector, ViewMode } from "@/components/dashboard/PeriodSelector"
import { WeeklySalesChart, PortfolioChart } from "@/components/dashboard/DashboardCharts"
import { MonthlySalesChart } from "@/components/dashboard/MonthlySalesChart"
import { AgingPortfolioCard } from "@/components/dashboard/AgingPortfolioCard"
import Link from "next/link"

async function getDashboardData(targetYear: number, targetMonth: number, viewMode: ViewMode) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    // Calculate range based on view mode
    let startDate: Date
    let endDate: Date
    let periodLabel: string

    switch (viewMode) {
        case 'annual':
            // Full year view
            startDate = startOfYear(new Date(targetYear, 0, 1))
            endDate = endOfYear(new Date(targetYear, 0, 1))
            periodLabel = `Año ${targetYear}`
            break
        case 'all_time':
            // All time view
            startDate = new Date(2000, 0, 1)
            endDate = new Date(2100, 11, 31)
            periodLabel = "Todos los tiempos"
            break
        case 'monthly':
        default:
            // Monthly view (default)
            startDate = new Date(targetYear, targetMonth, 1)
            endDate = endOfMonth(startDate)
            periodLabel = `${new Date(targetYear, targetMonth).toLocaleDateString('es-ES', { month: 'long' })} ${targetYear}`
            break
    }

    // Check if dates are valid
    if (isNaN(startDate.getTime())) {
        throw new Error("Invalid date parameters")
    }

    const start = formatISO(startDate)
    const end = formatISO(endDate)

    const now = new Date()
    const todayISO = formatISO(now, { representation: 'date' })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return {
            totalSales: 0, totalSalesCash: 0, totalSalesCredit: 0, countSalesCash: 0, countSalesCredit: 0,
            sortedWeeklySales: [], clientsCount: 0, vehiclesCount: 0, stockValue: 0, totalPortfolio: 0, delinquencyRate: 0,
            projectedCollections: 0, overdueAmount: 0, overdueCount: 0, averageDaysOverdue: 0, sortedWeeklyMaturities: [],
            recentSales: [], topBrands: [], avgDaysInStock: 0, agingData: [], topCities: [], grossProfit: 0, profitMargin: 0,
            avgROI: 0, salesWithCostData: 0, salesTrend: [], periodLabel, salesInArrearsCount: 0, clientsInArrearsCount: 0, totalPenaltyAmount: 0
        }
    }

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organization_id = profile?.organization_id

    if (!organization_id) {
        return {
            totalSales: 0, totalSalesCash: 0, totalSalesCredit: 0, countSalesCash: 0, countSalesCredit: 0,
            sortedWeeklySales: [], clientsCount: 0, vehiclesCount: 0, stockValue: 0, totalPortfolio: 0, delinquencyRate: 0,
            projectedCollections: 0, overdueAmount: 0, overdueCount: 0, averageDaysOverdue: 0, sortedWeeklyMaturities: [],
            recentSales: [], topBrands: [], avgDaysInStock: 0, agingData: [], topCities: [], grossProfit: 0, profitMargin: 0,
            avgROI: 0, salesWithCostData: 0, salesTrend: [], periodLabel, salesInArrearsCount: 0, clientsInArrearsCount: 0, totalPenaltyAmount: 0
        }
    }

    // Parallel fetching for performance
    const [
        salesResponse,
        clientsResponse,
        vehiclesResponse,
        stockValueResponse,
        portfolioResponse,
        overdueResponse,
        projectedCollectionsResponse,
        monthlyMaturitiesResponse,
        recentSalesResponse,
        topBrandsResponse,
        inventoryAgeResponse,
        agingPortfolioResponse,
        geographyResponse,
        profitabilityResponse
    ] = await Promise.all([
        // 1. Total Sales (Selected Period)
        supabase
            .from('sales')
            .select('id, sale_date, total_amount, down_payment, clients:clients!sales_client_id_fkey(name), equipos(brand, model, year)')
            .eq('organization_id', organization_id)
            .gte('sale_date', start)
            .lte('sale_date', end)
            .order('sale_date', { ascending: false }),

        // 2. Active Clients (Total - Global metric)
        supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organization_id),

        // 3. Equipos in Stock (Global)
        supabase
            .from('equipos')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organization_id)
            .eq('status', 'available'),

        // 4. Equipos Stock Value (Global)
        supabase
            .from('equipos')
            .select('list_price')
            .eq('organization_id', organization_id)
            .eq('status', 'available'),

        // 5. Total Portfolio (Global)
        // Installments don't have organization_id, we need to join sales
        supabase
            .from('installments')
            .select('amount, sales!inner(organization_id)')
            .eq('status', 'pending')
            .eq('sales.organization_id', organization_id),

        // 6. Overdue Portfolio (Global) - expanded to include sale_id and client for counting
        supabase
            .from('installments')
            .select('amount, due_date, sale_id, sales!inner(client_id, organization_id)')
            .eq('status', 'pending')
            .eq('sales.organization_id', organization_id)
            .lt('due_date', todayISO),

        // 7. Projected Collections (Selected Period)
        supabase
            .from('installments')
            .select('amount, sales!inner(organization_id)')
            .eq('sales.organization_id', organization_id)
            .gte('due_date', start)
            .lte('due_date', end)
            .eq('status', 'pending'),

        // 8. Maturities (Selected Period)
        supabase
            .from('installments')
            .select('*, sales!inner(organization_id, clients:clients!sales_client_id_fkey(name, ci), equipos(brand, model, year, plate))')
            .eq('status', 'pending')
            .eq('sales.organization_id', organization_id)
            .gte('due_date', formatISO(startDate, { representation: 'date' }))
            .lte('due_date', formatISO(endDate, { representation: 'date' }))
            .order('due_date', { ascending: true }),

        // 9. Recent Sales (Selected Period)
        supabase
            .from('sales')
            .select('*, clients:clients!sales_client_id_fkey(name), equipos(brand, model, year)')
            .eq('organization_id', organization_id)
            .gte('sale_date', start)
            .lte('sale_date', end)
            .order('sale_date', { ascending: false })
            .limit(5),

        // 10. Top Brands Sold (Selected Period)
        supabase
            .from('sales')
            .select('equipos(brand), total_amount')
            .eq('organization_id', organization_id)
            .gte('sale_date', start)
            .lte('sale_date', end),

        // 11. Inventory Age (for rotation calculation)
        supabase
            .from('equipos')
            .select('id, created_at, status')
            .eq('organization_id', organization_id)
            .eq('status', 'available'),

        // 12. Aging Portfolio (overdue installments grouped)
        supabase
            .from('installments')
            .select('amount, due_date, sales!inner(client_id, organization_id)')
            .eq('status', 'pending')
            .eq('sales.organization_id', organization_id)
            .lt('due_date', todayISO),

        // 13. Client Geography Distribution
        supabase
            .from('clients')
            .select('ciudad, barrio')
            .eq('organization_id', organization_id),

        // 14. Profitability Data (Sales with equipo costs)
        supabase
            .from('sales')
            .select(`
id,
    total_amount,
    down_payment,
    equipos(
        purchase_price,
        freight_cost,
        import_cost,
        total_cost,
        list_price
    )
        `)
            .gte('sale_date', start)
            .lte('sale_date', end)
    ])

    // Metrics Calculation
    const monthNamesLong = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    interface MaturityWeeklyMetric {
        weekLabel: string;
        count: number;
        amount: number;
        details: any[];
    }

    // 1. Sales Breakdown (Cash vs Credit) - Grouped by ISO Week
    interface SalesWeeklyMetric {
        cashAmount: number;
        cashCount: number;
        creditAmount: number;
        creditCount: number;
        totalAmount: number;
        label: string; // "Semana X" or Month Name
    }

    const weeklySales: Record<string, SalesWeeklyMetric> = {}
    const weeklyMaturities: Record<string, MaturityWeeklyMetric> = {}

    // Pre-initialize for annual view to show all months even with no data
    if (viewMode === 'annual') {
        monthNamesLong.forEach(month => {
            weeklySales[month] = { cashAmount: 0, cashCount: 0, creditAmount: 0, creditCount: 0, totalAmount: 0, label: month };
            weeklyMaturities[month] = { weekLabel: month, count: 0, amount: 0, details: [] };
        });
    }

    let totalSalesCash = 0
    let totalSalesCredit = 0
    let countSalesCash = 0
    let countSalesCredit = 0

    // Helper to get grouping key based on view mode
    const getGroupingKey = (date: Date) => {
        if (viewMode === 'all_time') {
            return date.getFullYear().toString()
        } else if (viewMode === 'monthly') {
            // Weekly grouping for monthly view
            const monthName = date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')
            const dayOfMonth = date.getDate()
            const weekOfMonth = Math.ceil(dayOfMonth / 7)

            const weekLabels = ['1ra', '2da', '3ra', '4ta', '5ta']
            const weekLabel = weekLabels[weekOfMonth - 1] || `${weekOfMonth} ta`

            return `${weekLabel} Semana ${monthName} `
        } else {
            // Monthly grouping for annual view
            const monthName = date.toLocaleDateString('es-ES', { month: 'long' })
            return monthName.charAt(0).toUpperCase() + monthName.slice(1)
        }
    }

    salesResponse.data?.forEach(sale => {
        const amount = Number(sale.total_amount)
        const isCredit = amount > Number(sale.down_payment)
        const date = new Date(sale.sale_date)
        const groupKey = getGroupingKey(date)

        if (!weeklySales[groupKey]) {
            weeklySales[groupKey] = { cashAmount: 0, cashCount: 0, creditAmount: 0, creditCount: 0, totalAmount: 0, label: groupKey }
        }

        if (isCredit) {
            totalSalesCredit += amount
            countSalesCredit++
            weeklySales[groupKey].creditAmount += amount
            weeklySales[groupKey].creditCount++
        } else {
            totalSalesCash += amount
            countSalesCash++
            weeklySales[groupKey].cashAmount += amount
            weeklySales[groupKey].cashCount++
        }
        weeklySales[groupKey].totalAmount += amount
    })

    const sortedWeeklySales = viewMode === 'annual'
        ? monthNamesLong.map(m => weeklySales[m]).filter(Boolean)
        : Object.entries(weeklySales).sort().map(([key, val]) => val)

    const totalSales = totalSalesCash + totalSalesCredit
    const stockValue = stockValueResponse.data?.reduce((acc, curr) => acc + Number(curr.list_price), 0) || 0
    const totalPortfolio = portfolioResponse.data?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

    // Calculate Overdue Metrics (Global)
    const overdueInstallments = overdueResponse.data || []
    const overdueAmount = overdueInstallments.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0)
    const overdueCount = overdueInstallments.length

    // Unique clients and sales in arrears
    const uniqueSalesInArrears = new Set(overdueInstallments.map((inst: any) => inst.sale_id))
    const uniqueClientsInArrears = new Set(overdueInstallments.map((inst: any) => inst.sales?.client_id).filter(Boolean))
    const salesInArrearsCount = uniqueSalesInArrears.size
    const clientsInArrearsCount = uniqueClientsInArrears.size

    // Fetch penalty settings for total penalty calculation
    const { data: penaltySettings } = await supabase
        .from('organization_settings')
        .select('default_penalty_amount, penalty_grace_days')
        .eq('organization_id', organization_id)
        .limit(1)
        .single()

    const defaultPenalty = Number(penaltySettings?.default_penalty_amount || 0)
    const graceDays = Number(penaltySettings?.penalty_grace_days || 0)

    // Calculate Average Days Overdue and Total Penalty
    let totalDaysOverdue = 0
    let totalPenaltyAmount = 0
    overdueInstallments.forEach((inst: any) => {
        const due = new Date(inst.due_date)
        const diffTime = Math.abs(now.getTime() - due.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        totalDaysOverdue += diffDays

        if (diffDays > graceDays) {
            let monthsOverdue = Math.floor(diffDays / 30)
            if (monthsOverdue === 0) monthsOverdue = 1
            totalPenaltyAmount += defaultPenalty * monthsOverdue
        }
    })
    const averageDaysOverdue = overdueCount > 0 ? Math.round(totalDaysOverdue / overdueCount) : 0

    const projectedCollections = projectedCollectionsResponse.data?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
    const delinquencyRate = totalPortfolio > 0 ? (overdueAmount / totalPortfolio) * 100 : 0

    // Populate maturities
    monthlyMaturitiesResponse.data?.forEach((inst: any) => {
        const date = new Date(inst.due_date)
        const groupKey = getGroupingKey(date)

        if (!weeklyMaturities[groupKey]) {
            weeklyMaturities[groupKey] = { weekLabel: groupKey, count: 0, amount: 0, details: [] }
        }

        weeklyMaturities[groupKey].count++
        weeklyMaturities[groupKey].amount += Number(inst.amount)
        weeklyMaturities[groupKey].details.push(inst)
    })

    const sortedWeeklyMaturities = viewMode === 'annual'
        ? monthNamesLong.map(m => weeklyMaturities[m]).filter(Boolean)
        : Object.entries(weeklyMaturities).sort().map(([key, val]) => val)

    // ===== NEW BUSINESS METRICS =====

    // 1. Top Brands Sold
    interface BrandMetric {
        brand: string
        unitsSold: number
        revenue: number
    }
    const brandStats: Record<string, BrandMetric> = {}

    topBrandsResponse.data?.forEach((sale: any) => {
        const brand = sale.equipos?.brand || 'Sin marca'
        if (!brandStats[brand]) {
            brandStats[brand] = { brand, unitsSold: 0, revenue: 0 }
        }
        brandStats[brand].unitsSold++
        brandStats[brand].revenue += Number(sale.total_amount || 0)
    })

    const topBrands = Object.values(brandStats)
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, 5)

    // 2. Inventory Rotation (Average days in stock for available equipos)
    let totalDaysInStock = 0
    let availableVehicleCount = 0

    inventoryAgeResponse.data?.forEach((equipo: any) => {
        const createdDate = new Date(equipo.created_at)
        const diffTime = Math.abs(now.getTime() - createdDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        totalDaysInStock += diffDays
        availableVehicleCount++
    })

    const avgDaysInStock = availableVehicleCount > 0 ? Math.round(totalDaysInStock / availableVehicleCount) : 0

    // 3. Aging Portfolio (0-30, 31-60, 61-90, +90 days)
    interface AgingBucket {
        label: string
        count: number
        clientCount: number
        clientIds: Set<string>
        amount: number
        color: string
    }

    const agingBuckets: Record<string, AgingBucket> = {
        '0-30': { label: '0-30 días', count: 0, clientCount: 0, clientIds: new Set(), amount: 0, color: getArrearsHexColor(15) },
        '31-60': { label: '31-60 días', count: 0, clientCount: 0, clientIds: new Set(), amount: 0, color: getArrearsHexColor(45) },
        '61-90': { label: '61-90 días', count: 0, clientCount: 0, clientIds: new Set(), amount: 0, color: getArrearsHexColor(75) },
        '90+': { label: '+90 días', count: 0, clientCount: 0, clientIds: new Set(), amount: 0, color: getArrearsHexColor(91) }
    }

    agingPortfolioResponse.data?.forEach((inst: any) => {
        const dueDate = new Date(inst.due_date)
        const diffTime = Math.abs(now.getTime() - dueDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        const amount = Number(inst.amount)
        const clientId = inst.sales?.client_id

        if (diffDays <= 30) {
            agingBuckets['0-30'].count++
            if (clientId) agingBuckets['0-30'].clientIds.add(clientId)
            agingBuckets['0-30'].amount += amount
        } else if (diffDays <= 60) {
            agingBuckets['31-60'].count++
            if (clientId) agingBuckets['31-60'].clientIds.add(clientId)
            agingBuckets['31-60'].amount += amount
        } else if (diffDays <= 90) {
            agingBuckets['61-90'].count++
            if (clientId) agingBuckets['61-90'].clientIds.add(clientId)
            agingBuckets['61-90'].amount += amount
        } else {
            agingBuckets['90+'].count++
            if (clientId) agingBuckets['90+'].clientIds.add(clientId)
            agingBuckets['90+'].amount += amount
        }
    })

    // Set final client counts and remove the Set objects for serialization
    const agingData = Object.values(agingBuckets).map(bucket => {
        const { clientIds, ...rest } = bucket
        return {
            ...rest,
            clientCount: clientIds.size
        }
    })

    // 4. Geographic Distribution
    interface GeographyMetric {
        location: string
        count: number
    }
    const geographyStats: Record<string, number> = {}

    geographyResponse.data?.forEach((client: any) => {
        const ciudad = client.ciudad || 'Sin ciudad'
        geographyStats[ciudad] = (geographyStats[ciudad] || 0) + 1
    })

    const topCities: GeographyMetric[] = Object.entries(geographyStats)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

    // 5. Profitability Metrics
    let totalRevenue = 0
    let totalCost = 0
    let salesWithCostData = 0

    profitabilityResponse.data?.forEach((sale: any) => {
        const revenue = Number(sale.total_amount || 0)
        const cost = Number(sale.equipos?.total_cost || sale.equipos?.purchase_price || 0)

        totalRevenue += revenue
        if (cost > 0) {
            totalCost += cost
            salesWithCostData++
        }
    })

    const grossProfit = totalRevenue - totalCost
    const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100) : 0
    const avgROI = totalCost > 0 ? ((grossProfit / totalCost) * 100) : 0

    // 6. Monthly/Yearly Sales Trend
    interface SalesTrendMetric {
        label: string
        totalSales: number
        unitsSold: number
    }

    const salesTrend: SalesTrendMetric[] = []

    if (viewMode === 'all_time') {
        const yearlySalesMap: Record<string, { total: number, count: number }> = {}
        salesResponse.data?.forEach((sale: any) => {
            const saleDate = new Date(sale.sale_date)
            const yearStr = saleDate.getFullYear().toString()
            if (!yearlySalesMap[yearStr]) yearlySalesMap[yearStr] = { total: 0, count: 0 }
            yearlySalesMap[yearStr].total += Number(sale.total_amount || 0)
            yearlySalesMap[yearStr].count++
        })
        const sortedYears = Object.keys(yearlySalesMap).sort()
        sortedYears.forEach(year => {
            salesTrend.push({
                label: year,
                totalSales: yearlySalesMap[year].total,
                unitsSold: yearlySalesMap[year].count
            })
        })
    } else {
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        // Get sales for the entire year to show trend
        const yearStartDate = formatISO(startOfYear(new Date(targetYear, 0, 1)), { representation: 'date' })
        const yearEndDate = formatISO(endOfYear(new Date(targetYear, 0, 1)), { representation: 'date' })

        const yearSalesResponse = await supabase
            .from('sales')
            .select('sale_date, total_amount')
            .eq('organization_id', organization_id)
            .gte('sale_date', yearStartDate)
            .lte('sale_date', yearEndDate)

        const monthlySalesMap: Record<number, { total: number, count: number }> = {}
        for (let i = 0; i < 12; i++) {
            monthlySalesMap[i] = { total: 0, count: 0 }
        }

        yearSalesResponse.data?.forEach((sale: any) => {
            const saleDate = new Date(sale.sale_date)
            const month = saleDate.getMonth()
            monthlySalesMap[month].total += Number(sale.total_amount || 0)
            monthlySalesMap[month].count++
        })

        for (let i = 0; i < 12; i++) {
            salesTrend.push({
                label: monthNames[i],
                totalSales: monthlySalesMap[i].total,
                unitsSold: monthlySalesMap[i].count
            })
        }
    }

    return {
        totalSales,
        totalSalesCash,
        totalSalesCredit,
        countSalesCash,
        countSalesCredit,
        sortedWeeklySales,
        clientsCount: clientsResponse.count || 0,
        vehiclesCount: vehiclesResponse.count || 0,
        stockValue,
        totalPortfolio,
        delinquencyRate,
        projectedCollections,
        overdueAmount,
        overdueCount,
        averageDaysOverdue,
        sortedWeeklyMaturities,
        recentSales: recentSalesResponse.data || [],
        // New metrics
        topBrands,
        avgDaysInStock,
        agingData,
        topCities,
        grossProfit,
        profitMargin,
        avgROI,
        salesWithCostData,
        salesTrend,
        periodLabel,
        salesInArrearsCount,
        clientsInArrearsCount,
        totalPenaltyAmount
    }
}

interface DashboardPageProps {
    searchParams: Promise<{
        year?: string
        month?: string
        viewMode?: string
    }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
    const params = await searchParams
    const now = new Date()

    // Parse params or use defaults
    const selectedYear = params.year ? parseInt(params.year) : now.getFullYear()
    const selectedMonth = params.month ? parseInt(params.month) : now.getMonth()
    const viewMode = (params.viewMode as ViewMode) || 'monthly'

    const {
        totalSales,
        stockValue,
        totalPortfolio,
        delinquencyRate,
        recentSales,
        vehiclesCount,
        overdueAmount,
        overdueCount,
        averageDaysOverdue,
        totalSalesCash,
        totalSalesCredit,
        countSalesCash,
        countSalesCredit,
        sortedWeeklySales,
        sortedWeeklyMaturities,
        projectedCollections,
        topBrands,
        avgDaysInStock,
        agingData,
        topCities,
        grossProfit,
        profitMargin,
        avgROI,
        salesWithCostData,
        salesTrend,
        periodLabel,
        salesInArrearsCount,
        clientsInArrearsCount,
        totalPenaltyAmount
    } = await getDashboardData(selectedYear, selectedMonth, viewMode)

    return (
        <div className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
                <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard V2</h2>
                    <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full border border-primary/20">BETA</span>
                </div>
                <PeriodSelector
                    currentYear={selectedYear}
                    currentMonth={selectedMonth}
                    viewMode={viewMode}
                    baseUrl="/dashboard-v2"
                />
            </div>

            {/* KPI Principales */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href={`/sales?year=${selectedYear}&month=${selectedMonth}&viewMode=${viewMode}`} className="block">
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors duration-200 h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Ventas Totales ({viewMode === 'monthly' ? 'Mes' : viewMode === 'annual' ? 'Año' : 'Histórico'})
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
                            <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                <div className="flex justify-between">
                                    <span>Contado ({countSalesCash}):</span>
                                    <span className="font-semibold text-green-600">{formatCurrency(totalSalesCash)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Crédito ({countSalesCredit}):</span>
                                    <span className="font-semibold text-blue-600">{formatCurrency(totalSalesCredit)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href={`/reports/due-installments?year=${selectedYear}&month=${selectedMonth}&viewMode=${viewMode}`} className="block">
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors duration-200 h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Proyección Cobros ({viewMode === 'monthly' ? 'Mes' : viewMode === 'annual' ? 'Año' : 'Histórico'})
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(projectedCollections)}</div>
                            <p className="text-xs text-muted-foreground">
                                Ver cuotas del periodo →
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/sales?arrears=true" className="block">
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors duration-200 h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Morosidad Global</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${delinquencyRate > 10 ? 'text-red-500' : 'text-green-600'}`}>
                                {delinquencyRate.toFixed(1)}%
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                <div className="flex justify-between">
                                    <span>Clientes en mora:</span>
                                    <span className="font-semibold text-orange-600">{clientsInArrearsCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Ventas en mora:</span>
                                    <span className="font-semibold text-orange-600">{salesInArrearsCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Monto vencido:</span>
                                    <span className="font-semibold text-red-600">{formatCurrency(overdueAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Multas acum.:</span>
                                    <span className="font-semibold text-red-600">{formatCurrency(totalPenaltyAmount)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/inventory?status=available" className="block">
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors duration-200 h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Stock Valorizado</CardTitle>
                            <Car className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stockValue)}</div>
                            <p className="text-xs text-muted-foreground">
                                {vehiclesCount} unidades disponibles →
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* GRAPHS ROW */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <WeeklySalesChart
                    data={sortedWeeklySales}
                    title={viewMode === 'monthly' ? 'Ventas Semanales (Contado vs Crédito)' : viewMode === 'annual' ? 'Ventas Mensuales (Contado vs Crédito)' : 'Ventas Anuales (Contado vs Crédito)'}
                />
                <Link href="/reports/due-installments" className="col-span-2 lg:col-span-3">
                    <div className="cursor-pointer hover:opacity-80 transition-opacity">
                        <PortfolioChart total={totalPortfolio} overdue={overdueAmount} />
                    </div>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 grid grid-cols-2 gap-4">
                    <Link href="/reports/due-installments" className="block">
                        <Card className="border-l-4 border-l-orange-500 cursor-pointer hover:bg-muted/50 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Cuotas en Mora</CardTitle>
                                <div className="h-4 w-4 font-bold text-orange-500">#</div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">{overdueCount}</div>
                                <p className="text-xs text-muted-foreground">Cuotas pendientes (Global) →</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Card className="border-l-4 border-l-yellow-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Días Promedio de Mora</CardTitle>
                            <TrendingUp className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{averageDaysOverdue} días</div>
                            <p className="text-xs text-muted-foreground">Promedio general</p>
                        </CardContent>
                    </Card>

                    <Card className="col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>
                                Vencimientos del {viewMode === 'monthly' ? 'Mes' : viewMode === 'annual' ? 'Año' : 'Histórico'}
                            </CardTitle>
                            <Link
                                href={`/reports/due-installments?year=${selectedYear}&month=${selectedMonth}&viewMode=${viewMode}`}
                                className="text-xs text-primary hover:underline font-medium"
                            >
                                Ver detalle →
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {sortedWeeklyMaturities.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">No hay vencimientos en este periodo</p>
                                ) : (
                                    sortedWeeklyMaturities.map((group, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex items-center justify-between bg-muted/50 p-2 rounded">
                                                <span className="font-semibold text-sm">{group.weekLabel}</span>
                                                <div className="flex gap-4 text-xs font-medium">
                                                    <span>{group.count} cuotas</span>
                                                    <span>Total: {formatCurrency(group.amount)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Ventas Recientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentSales.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No hay ventas en este periodo</p>
                            ) : (
                                recentSales.map((sale: any) => (
                                    <Link href={`/sales/${sale.id}`} key={sale.id} className="block hover:bg-muted/30 rounded-md p-1 -mx-1 transition-colors">
                                        <div className="flex items-center">
                                            <div className="ml-4 space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {sale.equipos?.brand} {sale.equipos?.model} {sale.equipos?.year}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {sale.clients?.name}
                                                </p>
                                            </div>
                                            <div className="ml-equipo text-right">
                                                <div className="font-medium text-sm">{formatCurrency(sale.total_amount)}</div>
                                                <div className="text-xs text-muted-foreground">Ver detalle →</div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* New Business Metrics Section */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Top Brands */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Top Marcas Vendidas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topBrands.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No hay datos disponibles
                                </p>
                            ) : (
                                topBrands.map((brand, idx) => (
                                    <Link href={`/sales?q=${encodeURIComponent(brand.brand)}`} key={idx} className="block hover:bg-muted/30 rounded p-1 -mx-1 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">{brand.brand}</p>
                                                <p className="text-xs text-muted-foreground">{brand.unitsSold} unidades</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium text-sm">{formatCurrency(brand.revenue)}</div>
                                                <div className="text-xs text-muted-foreground">Ver →</div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Inventory Rotation */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Rotación de Inventario
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold">{avgDaysInStock}</span>
                                <span className="text-xs text-muted-foreground">días promedio en stock</span>
                            </div>
                            <div className="space-y-2  text-xs text-muted-foreground">
                                <div className="flex justify-between">
                                    <span>Velocidad de rotación:</span>
                                    <span className="font-semibold">
                                        {avgDaysInStock > 0 ? `${(365 / avgDaysInStock).toFixed(1)} x / año` : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Equipos en stock:</span>
                                    <span className="font-semibold">{vehiclesCount}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Profitability */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Rentabilidad
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Utilidad Bruta:</span>
                                <span className={`font - bold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'} `}>
                                    {formatCurrency(grossProfit)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Margen:</span>
                                <span className={`font - semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'} `}>
                                    {profitMargin.toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">ROI Promedio:</span>
                                <span className={`font - semibold ${avgROI >= 0 ? 'text-green-600' : 'text-red-600'} `}>
                                    {avgROI.toFixed(1)}%
                                </span>
                            </div>
                            {salesWithCostData < (countSalesCash + countSalesCredit) && (
                                <p className="text-xs text-amber-600 pt-2 border-t">
                                    ⚠️ Faltan datos de costo en algunas ventas
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Aging and Geography Row */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Aging Portfolio */}
                <AgingPortfolioCard agingData={agingData} overdueAmount={overdueAmount} />

                {/* Geographic Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Distribución Geográfica
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topCities.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No hay datos de ubicación
                                </p>
                            ) : (
                                topCities.map((city, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{city.location}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {((city.count / topCities.reduce((sum, c) => sum + c.count, 0)) * 100).toFixed(1)}% del total
                                            </p>
                                        </div>
                                        <div className="font-medium text-sm">{city.count} clientes</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sales Trend Chart */}
            <MonthlySalesChart
                data={salesTrend}
                title={viewMode === 'all_time' ? "Evolución Anual" : "Evolución Mensual (Este Año)"}
            />
        </div>
    )
}
