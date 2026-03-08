'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Building2, PlusCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { useAuth } from '@/components/providers/auth-provider'
import { getUserOrganizationsAction, switchOrganizationAction } from '@/app/organization-actions'
import { useRouter } from 'next/navigation'

export function OrganizationSwitcher() {
    const { profile } = useAuth()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [organizations, setOrganizations] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSwitching, setIsSwitching] = useState(false)

    useEffect(() => {
        async function loadOrgs() {
            try {
                const orgs = await getUserOrganizationsAction()
                setOrganizations(orgs || [])
            } catch (error) {
                console.error("Error loading organizations:", error)
            } finally {
                setIsLoading(false)
            }
        }

        if (profile?.organization_id) {
            loadOrgs()
        } else if (profile !== null) {
            // Profile loaded but has no org_id — stop loading
            setIsLoading(false)
        }
        // If profile is still null, AuthProvider is still loading — keep waiting
    }, [profile?.organization_id, profile])

    const activeOrg = organizations.find(
        (org) => org.organization_id === profile?.organization_id
    )

    const handleSwitch = async (orgId: string) => {
        if (orgId === profile?.organization_id) return

        setIsSwitching(true)
        setOpen(false)
        try {
            await switchOrganizationAction(orgId)
            // Force a full page reload so the AuthProvider and all queries pick up the new org
            window.location.reload()
        } catch (error) {
            console.error("Failed to switch organization:", error)
            setIsSwitching(false)
        }
    }

    if (isLoading) {
        return (
            <Button variant="outline" className="w-[200px] justify-between h-9" disabled>
                <Building2 className="mr-2 h-4 w-4" />
                <span className="truncate flex-1 text-left">Cargando...</span>
            </Button>
        )
    }

    // If no organizations found (e.g. table not ready yet), hide the switcher silently
    if (organizations.length === 0) return null

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] sm:w-[250px] justify-between h-9 shrink-0 relative"
                    disabled={isSwitching}
                >
                    <Building2 className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate flex-1 text-left font-medium">
                        {activeOrg?.organizations?.name || "Seleccionar Organización"}
                    </span>
                    {isSwitching ? (
                        <Loader2 className="ml-2 h-4 w-4 shrink-0 opacity-50 animate-spin" />
                    ) : (
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0 shadow-lg">
                <Command>
                    <CommandInput placeholder="Buscar empresa..." className="h-9" />
                    <CommandList>
                        <CommandEmpty>No se encontraron empresas.</CommandEmpty>
                        <CommandGroup heading="Mis Empresas">
                            {organizations.map((org) => (
                                <CommandItem
                                    key={org.id}
                                    value={org.organizations.name}
                                    onSelect={() => handleSwitch(org.organization_id)}
                                    className="cursor-pointer font-medium"
                                >
                                    <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span className="truncate flex-1">{org.organizations.name}</span>
                                    <Check
                                        className={cn(
                                            "ml-equipo h-4 w-4",
                                            profile?.organization_id === org.organization_id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                            <CommandItem
                                onSelect={() => {
                                    setOpen(false)
                                    router.push('/registry?new=true')
                                }}
                                className="cursor-pointer text-primary"
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Crear nueva empresa
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
