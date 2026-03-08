'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Only initialize if the key is available
        if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
            posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
                api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
                person_profiles: 'identified_only',
                capture_pageview: false, // Disabling automatic pageview capture for Next.js App Router
                loaded: (posthog) => {
                    if (process.env.NODE_ENV === 'development') posthog.debug()
                }
            })
        }
    }, [])

    return (
        <PHProvider client={posthog}>
            {children}
        </PHProvider>
    )
}
