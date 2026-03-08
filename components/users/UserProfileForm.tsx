'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Loader2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateUserProfileAction, uploadAvatarAction } from '@/app/user-actions'

interface UserProfileFormProps {
    profile: {
        id: string
        email: string
        first_name: string | null
        last_name: string | null
        document_number: string | null
        avatar_url: string | null
        role: string
    }
}

export function UserProfileForm({ profile }: UserProfileFormProps) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const initials = `${profile.first_name?.charAt(0) || ''}${profile.last_name?.charAt(0) || ''}`.toUpperCase() || profile.email.charAt(0).toUpperCase()

    const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            // Upload via server action to avoid client-side Supabase auth lock
            const formData = new FormData()
            formData.append('file', file)
            const publicUrl = await uploadAvatarAction(formData)
            setAvatarUrl(publicUrl)
            toast.success('Foto subida correctamente. No olvides guardar los cambios.')
        } catch (error: any) {
            console.error('Error uploading avatar:', error)
            toast.error('Error al subir la foto')
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const formData = new FormData(e.currentTarget)
            if (avatarUrl) {
                formData.append('avatar_url', avatarUrl)
            }

            await updateUserProfileAction(formData)
            toast.success('Perfil actualizado correctamente')
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar el perfil')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Card className="max-w-2xl mx-equipo">
            <CardHeader>
                <CardTitle>Perfil de Usuario</CardTitle>
                <CardDescription>
                    Actualiza tu información personal y foto de perfil. Tu nombre aparecerá en los recibos de cobro que generes.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start pb-6 border-b">
                        <div className="relative group">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={avatarUrl} alt={`${profile.first_name} ${profile.last_name}`} />
                                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                            </Avatar>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full disabled:opacity-50"
                            >
                                {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleUploadAvatar}
                            />
                        </div>
                        <div className="space-y-1 text-center sm:text-left">
                            <h3 className="font-medium text-lg">{profile.first_name || 'Sin Nombre'} {profile.last_name || ''}</h3>
                            <p className="text-sm text-muted-foreground">{profile.email}</p>
                            <p className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold max-w-fit mt-2 capitalize">
                                Rol: {profile.role}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">Nombre *</Label>
                            <Input
                                id="first_name"
                                name="first_name"
                                defaultValue={profile.first_name || ''}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Apellido *</Label>
                            <Input
                                id="last_name"
                                name="last_name"
                                defaultValue={profile.last_name || ''}
                                required
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="document_number">Número de Documento (CI) *</Label>
                            <Input
                                id="document_number"
                                name="document_number"
                                defaultValue={profile.document_number || ''}
                                required
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="email">Correo Electrónico (No modificable)</Label>
                            <Input
                                id="email"
                                value={profile.email}
                                disabled
                                className="bg-muted/50"
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-6 border-muted">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : <><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
