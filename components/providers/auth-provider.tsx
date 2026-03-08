'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Profile = {
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
    role: string | null
    organization_id: string | null
}


type AuthContextType = {
    user: User | null
    profile: Profile | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async (userId: string) => {
            const { data } = await supabase
                .from('profiles')
                .select('first_name, last_name, avatar_url, role, organization_id')
                .eq('id', userId)
                .single()
            setProfile(data)
        }

        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const currentUser = session?.user ?? null
            setUser(currentUser)
            if (currentUser) {
                await fetchProfile(currentUser.id)
            } else {
                setProfile(null)
            }
            setLoading(false)
        }

        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null
            setUser(currentUser)
            if (currentUser) {
                await fetchProfile(currentUser.id)
            } else {
                setProfile(null)
            }
            setLoading(false)
            if (_event === 'SIGNED_OUT') {
                router.push('/login')
            }
        })

        return () => subscription.unsubscribe()
    }, [router, supabase])

    const signOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
