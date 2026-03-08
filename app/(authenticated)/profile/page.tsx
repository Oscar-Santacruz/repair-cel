import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { UserProfileForm } from '@/components/users/UserProfileForm'

export default async function ProfilePage() {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select(`
            id,
            email,
            first_name,
            last_name,
            document_number,
            avatar_url,
            role
        `)
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/login')
    }

    return (
        <div className="p-8">
            <UserProfileForm profile={profile} />
        </div>
    )
}
