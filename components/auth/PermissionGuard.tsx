import { getCurrentUserRole, UserRole, Permission, hasPermission } from '@/lib/permissions'

interface PermissionGuardProps {
    children: React.ReactNode
    requiredRole?: UserRole
    permission?: Permission
    fallback?: React.ReactNode
}

export async function PermissionGuard({
    children,
    requiredRole = 'user',
    permission,
    fallback
}: PermissionGuardProps) {
    // Check specific permission if provided
    if (permission) {
        const hasAccess = await hasPermission(permission)
        if (!hasAccess) {
            if (fallback) return <>{fallback}</>
            return null
        }
    }

    // Role-based check
    const role = await getCurrentUserRole()

    const roleHierarchy: Record<UserRole, number> = {
        owner: 3,
        admin: 3,
        user: 2,
        technician: 2,
        receptionist: 2,
        viewer: 1
    }

    const userLevel = roleHierarchy[role as UserRole] || 0
    const requiredLevel = roleHierarchy[requiredRole]

    if (userLevel < requiredLevel) {
        if (fallback) return <>{fallback}</>

        return (
            <div className="p-8 text-center border border-destructive rounded-lg bg-destructive/10">
                <h2 className="text-xl font-bold text-destructive">Acceso Denegado</h2>
                <p className="text-muted-foreground mt-2">
                    No tienes permisos para acceder a esta función.
                </p>
            </div>
        )
    }

    return <>{children}</>
}
