import { requireAdmin } from "@/lib/permissions"

export default async function ActivitiesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Only admins should be able to view the global activity log
    await requireAdmin()

    return <>{children}</>
}
