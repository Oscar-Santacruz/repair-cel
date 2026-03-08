'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, Upload, Building2 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { createNewOrganizationAction } from '@/app/organization-actions'
import { notifyAdminNewCompanyAction } from '@/app/admin/actions'

export default function RegistryPage() {
    const [companyName, setCompanyName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [logo, setLogo] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)

    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')

    const { user } = useAuth()
    const router = useRouter()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setError('El logo debe pesar menos de 2MB')
                return
            }
            if (!file.type.startsWith('image/')) {
                setError('El archivo debe ser una imagen')
                return
            }
            setLogo(file)
            setLogoPreview(URL.createObjectURL(file))
            setError('')
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            let newOrgId: string | undefined;

            if (user) {
                const result = await createNewOrganizationAction(companyName)
                newOrgId = result.organizationId
                // Notify admin via WhatsApp
                notifyAdminNewCompanyAction(companyName, user.email ?? '').catch(() => { })
            } else {
                // 1. Sign Up the User (This will trigger handle_new_user and create organization & settings)
                const { data: authData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            company_name: companyName
                        }
                    }
                })

                if (signUpError) throw signUpError

                if (!authData.user) {
                    throw new Error("No se pudo crear el usuario.")
                }

                // Supabase returns an empty identities array if the user already exists (to prevent email enumeration)
                if (authData.user.identities && authData.user.identities.length === 0) {
                    throw new Error("Este correo electrónico ya está registrado con otra empresa o cuenta.")
                }

                // Notify admin via WhatsApp (fire and forget)
                notifyAdminNewCompanyAction(companyName, email).catch(() => { })

                // 2. Wait a moment for the DB trigger to create the profile and organization
                await new Promise(resolve => setTimeout(resolve, 1500))

                // 3. Fetch the new profile to get the organization_id
                const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', authData.user.id).single()
                newOrgId = profile?.organization_id
            }

            if (newOrgId && logo) {
                // 4. Upload the Logo
                const fileExt = logo.name.split('.').pop()
                const fileName = `${newOrgId}/logo-${Date.now()}.${fileExt}`

                const { error: uploadError, data: uploadData } = await supabase.storage
                    .from('logos')
                    .upload(fileName, logo, { upsert: true })

                if (uploadError) {
                    console.error("Error subiendo logo:", uploadError)
                } else if (uploadData) {
                    // 5. Update organization_settings with the public logo URL
                    const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(fileName)

                    await supabase.from('organization_settings')
                        .update({ logo_url: publicUrlData.publicUrl })
                        .eq('organization_id', newOrgId)
                }
            }

            // Redirect to dashboard
            if (user) {
                window.location.href = '/' // Force fresh load with new active org
            } else {
                router.push('/dashboard-v2')
            }

        } catch (error: any) {
            setError(error.message || 'Error al registrar la empresa')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted/20 via-background to-muted/30 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight">
                        Registra tu Empresa
                    </CardTitle>
                    <CardDescription>
                        Crea tu espacio de trabajo y comienza a gestionar tus ventas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2 flex flex-col items-center">
                            <Label className="w-full text-left">Logotipo de la Empresa</Label>
                            <div
                                className="h-24 w-24 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/10 cursor-pointer hover:bg-muted/30 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center text-muted-foreground">
                                        <Building2 className="h-8 w-8 mb-1 opacity-50" />
                                        <span className="text-[10px]">Subir Logo</span>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleLogoChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyName">Nombre de la Empresa / Playa de Equipos</Label>
                            <Input
                                id="companyName"
                                type="text"
                                placeholder="Ej: Automotores del Sur"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>

                        {!user && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Correo Electrónico Administrador</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="usuario@ejemplo.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Contraseña</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            autoComplete="new-password"
                                            className="h-11 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {error && (
                            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full h-11 text-base mt-2" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creando entorno...
                                </>
                            ) : (
                                'Crear mi Empresa'
                            )}
                        </Button>

                        {!user && (
                            <div className="mt-4 text-center text-sm">
                                ¿Ya tienes una cuenta?{' '}
                                <Link href="/login" className="text-primary hover:underline font-medium">
                                    Iniciar sesión
                                </Link>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
