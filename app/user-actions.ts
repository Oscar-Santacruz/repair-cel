'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { requireAdmin } from '@/lib/permissions'
import { getOrganizationId as getUnifiedOrgId } from '@/lib/auth'

async function getSupabase() {
    const cookieStore = await cookies()
    return createServerClient(
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
}

function getSupabaseAdmin() {
    // Service role client needed for admin auth operations (deleteUser)
    // This bypasses RLS, so use carefully and ONLY after checking permissions (requireAdmin)
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

async function getOrganizationId(supabase: any) {
    return getUnifiedOrgId(supabase)
}

export async function getUsersAction() {
    const supabase = await getSupabase()
    await requireAdmin()

    const organization_id = await getOrganizationId(supabase)

    // If service role key is available, use admin client to bypass RLS entirely
    // Otherwise use the regular client (RLS policy allows org-wide reads via SECURITY DEFINER function)
    const client = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : supabase

    const { data: profiles, error } = await client
        .from('profiles')
        .select(`
            id,
            role,
            email,
            created_at,
            first_name,
            last_name,
            document_number,
            avatar_url
        `)
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching users — code:', error.code, '| message:', error.message, '| details:', error.details)
        throw new Error(error.message || 'Error al cargar usuarios')
    }

    return profiles
}

export async function updateUserRoleAction(userId: string, newRole: 'admin' | 'user' | 'viewer') {
    await requireAdmin()

    // Using regular client since we added RLS policy for Admins to UPDATE profiles
    const supabase = await getSupabase()

    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

    if (error) {
        console.error('Error updating user role:', error)
        throw error
    }

    revalidatePath('/users')
}

export async function deleteUserAction(userId: string) {
    await requireAdmin()

    // Must use Admin client to delete from auth.users
    const supabaseAdmin = getSupabaseAdmin()

    // Delete from auth.users (this will cascade to profiles via trigger)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
        console.error('Error deleting user:', error)
        throw error
    }

    revalidatePath('/users')
}

// Admin: Send password reset email to user
export async function adminResetUserPasswordAction(userId: string, userEmail: string) {
    await requireAdmin()

    const supabaseAdmin = getSupabaseAdmin()

    // Send password reset email
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
    })

    if (error) {
        console.error('Error sending password reset:', error)
        throw new Error('Error al enviar el correo de recuperación')
    }

    return { success: true }
}

// Admin: Set temporary password and force change
export async function setTemporaryPasswordAction(userId: string, tempPassword: string) {
    await requireAdmin()

    const supabaseAdmin = getSupabaseAdmin()
    const supabase = await getSupabase()

    // Update user password
    const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: tempPassword }
    )

    if (passwordError) {
        console.error('Error setting temporary password:', passwordError)
        throw new Error('Error al establecer contraseña temporal')
    }

    // Set force_password_change flag
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ force_password_change: true })
        .eq('id', userId)

    if (updateError) {
        console.error('Error setting force_password_change:', updateError)
        throw new Error('Error al configurar cambio forzado')
    }

    revalidatePath('/users')
    return { success: true }
}

// Admin: Create new user with profile info
export async function createUserAction(formData: FormData) {
    await requireAdmin()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const role = formData.get('role') as 'admin' | 'user' | 'viewer'
    const firstName = formData.get('first_name') as string
    const lastName = formData.get('last_name') as string
    const documentNumber = formData.get('document_number') as string

    if (!email || !password || !firstName || !lastName || !documentNumber) {
        throw new Error('Todos los campos son obligatorios')
    }

    const supabaseAdmin = getSupabaseAdmin()
    const supabase = await getSupabase()
    const organization_id = await getOrganizationId(supabase)

    // 1. Create the user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Equipo-confirm for admin creations
        user_metadata: {
            organization_id // Optional: useful for triggers if any exist
        }
    })

    if (authError || !authData.user) {
        console.error('Error creating user:', authError)
        throw new Error(authError?.message || 'Error al crear el usuario')
    }

    // 2. The profile should have been created by the auth trigger. 
    // We update it with the new fields.
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
            first_name: firstName,
            last_name: lastName,
            document_number: documentNumber,
            role: role || 'viewer',
            force_password_change: true // Force password change for security
        })
        .eq('id', authData.user.id)

    if (profileError) {
        console.error('Error updating profile:', profileError)
        // Optionally logic to rollback could be here, but standard update should work.
        throw new Error('Error al actualizar el perfil del usuario')
    }

    revalidatePath('/users')
    return { success: true }
}

// Update current user's profile
export async function updateUserProfileAction(formData: FormData) {
    const firstName = formData.get('first_name') as string
    const lastName = formData.get('last_name') as string
    const documentNumber = formData.get('document_number') as string
    const avatarUrl = formData.get('avatar_url') as string

    if (!firstName || !lastName || !documentNumber) {
        throw new Error('Nombre, Apellido y Documento son obligatorios')
    }

    const supabase = await getSupabase()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error("No autenticado")

    const updateData: any = {
        first_name: firstName,
        last_name: lastName,
        document_number: documentNumber,
        updated_at: new Date().toISOString(),
        updated_by: user.id
    }

    if (avatarUrl) {
        updateData.avatar_url = avatarUrl
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

    if (profileError) {
        console.error('Error updating profile:', profileError)
        throw new Error('Error al actualizar el perfil')
    }

    revalidatePath('/profile')
    return { success: true }
}

// Upload avatar server-side using admin client to avoid client-side auth lock conflicts
export async function uploadAvatarAction(formData: FormData): Promise<string> {
    const supabase = await getSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('No autenticado')

    const file = formData.get('file') as File
    if (!file) throw new Error('No file provided')

    const adminClient = getSupabaseAdmin()
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const bytes = await file.arrayBuffer()

    const { error } = await adminClient.storage
        .from('avatars')
        .upload(fileName, bytes, { contentType: file.type, upsert: true })

    if (error) throw error

    const { data } = adminClient.storage.from('avatars').getPublicUrl(fileName)
    return data.publicUrl
}
