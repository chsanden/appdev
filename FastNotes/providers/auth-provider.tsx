import { AuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/libs/supabase'
import { PropsWithChildren, useEffect, useState } from 'react'

export default function AuthProvider({ children }: PropsWithChildren) {
  const [claims, setClaims] = useState<Record<string, any> | undefined | null>()
  const [profile, setProfile] = useState<any>()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const syncAuthState = async () => {
      setIsLoading(true)

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        console.error('Error fetching user:', error)
      }

      setClaims(
        user
          ? {
              sub: user.id,
              email: user.email,
            }
          : null
      )
      setIsLoading(false)
    }

    void syncAuthState()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', { event: _event })

      setClaims(
        session?.user
          ? {
              sub: session.user.id,
              email: session.user.email,
            }
          : null
      )
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
