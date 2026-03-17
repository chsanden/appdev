import { AuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/libs/supabase'
import { PropsWithChildren, useEffect, useState } from 'react'

const buildClaims = (user?: { id: string; email?: string | null } | null) =>
  user
    ? {
        sub: user.id,
        email: user.email,
      }
    : null

const isInvalidRefreshTokenError = (error: { message?: string; status?: number } | null) => {
  if (!error) {
    return false
  }

  const message = error.message?.toLowerCase() ?? ''

  return error.status === 401 && (
    message.includes('invalid refresh token') ||
    message.includes('refresh token not found')
  )
}

export default function AuthProvider({ children }: PropsWithChildren) {
  const [claims, setClaims] = useState<Record<string, any> | undefined | null>()
  const [profile, setProfile] = useState<any>()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const clearInvalidSession = async () => {
      const { error } = await supabase.auth.signOut({ scope: 'local' })

      if (error) {
        console.error('Error clearing invalid local session:', error)
      }

      setClaims(null)
      setProfile(null)
      setIsLoading(false)
    }

    const hydrateSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        if (isInvalidRefreshTokenError(error)) {
          console.warn('Clearing expired auth session:', error.message)
          await clearInvalidSession()
          return
        }

        console.error('Error hydrating session:', error)
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
