import { AuthContext } from '@/hooks/use-auth-context'
import { hasSecureRefreshToken, supabase } from '@/libs/supabase'
import { PropsWithChildren, useEffect, useState } from 'react'

const buildClaims = (user?: { id: string; email?: string | null } | null) =>
  user
    ? {
        sub: user.id,
        email: user.email,
      }
    : null

export default function AuthProvider({ children }: PropsWithChildren) {
  const [claims, setClaims] = useState<Record<string, any> | undefined | null>()
  const [profile, setProfile] = useState<any>()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const hydrateSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error('Error hydrating session:', error)
      }

      if (!session && await hasSecureRefreshToken()) {
        console.warn('Found an encrypted Supabase refresh token backup, but fallback session recovery is not implemented.')
      }

      setClaims(buildClaims(session?.user))
      setIsLoading(false)
    }

    void hydrateSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setClaims(buildClaims(session?.user))
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)

      if (claims) {
        const fallbackProfile = {
          id: claims.sub,
          email: claims.email ?? null,
          username: null,
          full_name: null,
        }

        const { error: upsertError } = await supabase.from('profiles').upsert({
          id: claims.sub,
          email: claims.email ?? null,
        })

        if (upsertError) {
          console.error('Error creating profile:', upsertError)
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', claims.sub)
          .maybeSingle()

        if (error) {
          console.error('Error fetching profile:', error)
        }

        setProfile(
          data ?? fallbackProfile
        )
      } else {
        setProfile(null)
      }

      setIsLoading(false)
    }

    void fetchProfile()
  }, [claims])

  return (
    <AuthContext.Provider
      value={{
        claims,
        isLoading,
        profile,
        isLoggedIn: claims != null,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
