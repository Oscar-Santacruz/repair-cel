import { getParametricData } from "@/app/settings-actions"
import SettingsTabs from "@/components/settings/SettingsTabs"
import { resolveUserNames } from "@/lib/resolve-user-names"

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const data = await getParametricData()
    const userNames = await resolveUserNames([
        data.orgSettings?.created_by,
        data.orgSettings?.updated_by
    ])

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
                    <p className="text-muted-foreground">
                        Administra los parámetros y catálogos del sistema.
                    </p>
                </div>
            </div>

            <SettingsTabs data={data} userNames={userNames} />
        </div>
    )
}
