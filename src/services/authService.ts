import { supabase } from '../lib/supabase'
import type { UserProfile } from '../lib/supabase'

export interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
  grade: string
  board?: string
  area?: string
}

export interface SignInData {
  email: string
  password: string
}

export class AuthService {
  // Upload profile picture to Supabase storage
  static async uploadProfilePicture(userId: string, file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}` // Store in user-specific folder

      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.error('Storage upload error:', error)
        throw new Error('Failed to upload profile picture')
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Profile picture upload error:', error)
      throw error
    }
  }

  // Delete old profile picture from storage
  static async deleteProfilePicture(url: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = url.split('/profile-pictures/')
      if (urlParts.length < 2) return

      const filePath = urlParts[1]

      const { error } = await supabase.storage
        .from('profile-pictures')
        .remove([filePath])

      if (error) {
        console.error('Storage delete error:', error)
        // Don't throw error for delete failures - it's not critical
      }
    } catch (error) {
      console.error('Profile picture delete error:', error)
      // Don't throw error for delete failures
    }
  }

  // Sign up new user with enhanced error handling
  static async signUp(data: SignUpData) {
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            grade: data.grade,
            board: data.board || '',
            area: data.area || '',
          }
        }
      })

      if (authError) {
        console.error('Supabase auth error:', authError)
        
        // Handle specific database error from Supabase backend
        if (authError.message.includes('Database error saving new user') || 
            authError.message.includes('unexpected_failure')) {
          throw new Error('🚨 Supabase Project Issue Detected\n\nYour Supabase project appears to be paused or experiencing database issues.\n\nTo fix this:\n1. Go to https://supabase.com/dashboard\n2. Find your project and click "Resume" if it shows as paused\n3. Wait for the project to fully restart (2-3 minutes)\n4. Try signing up again\n\nIf the project is already active, there may be a temporary Supabase service issue. Please try again in a few minutes.')
        }
        
        // Check for Supabase connection issues
        if (authError.message.includes('SUPABASE CONNECTION FAILED') || 
            authError.message.includes('Failed to fetch') ||
            authError.message.includes('NetworkError')) {
          throw new Error('🚨 Cannot connect to authentication service.\n\nYour Supabase project may be paused or deleted.\nPlease check https://supabase.com for your project status.\n\nSee SUPABASE_CONNECTION_FIX.md for help.')
        }
        
        // Provide more user-friendly error messages
        if (authError.message.includes('already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.')
        }
        if (authError.message.includes('Password should be at least')) {
          throw new Error('Password must be at least 6 characters long.')
        }
        if (authError.message.includes('Invalid email')) {
          throw new Error('Please enter a valid email address.')
        }
        if (authError.message.includes('not configured')) {
          throw new Error('Authentication service is not configured. Please set up your Supabase credentials.')
        }
        
        // Handle rate limiting
        if (authError.message.includes('rate limit') || authError.message.includes('too many requests')) {
          throw new Error('Too many signup attempts. Please wait a few minutes before trying again.')
        }
        
        // Handle email confirmation issues
        if (authError.message.includes('email confirmation')) {
          throw new Error('Email confirmation is required but not properly configured. Please contact support.')
        }
        
        // Generic error with helpful context
        throw new Error(`Signup failed: ${authError.message}\n\nIf this persists, your Supabase project may need attention. Check https://supabase.com/dashboard`)
      }

      if (authData.user) {
        // Create user profile - this will be handled by database trigger if set up
        try {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: authData.user.id,
              first_name: data.firstName,
              last_name: data.lastName,
              grade: data.grade,
              board: data.board || '',
              area: data.area || '',
            })

          if (profileError && !profileError.message.includes('duplicate key') && !profileError.message.includes('not configured')) {
            console.error('Profile creation error:', profileError)
            // Don't throw error for profile creation - user can update later
          }
        } catch (profileError) {
          console.error('Profile creation failed:', profileError)
          // Continue without throwing - profile can be created later
        }
      }

      return { user: authData.user, session: authData.session }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  // Optimized sign in with faster response
  static async signIn(data: SignInData) {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        // Check for Supabase connection issues first
        if (error.message.includes('SUPABASE CONNECTION FAILED') || 
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError')) {
          throw new Error('🚨 Cannot connect to authentication service.\n\nYour Supabase project may be paused or deleted.\nPlease check https://supabase.com for your project status.\n\nSee SUPABASE_CONNECTION_FIX.md for help.')
        }
        
        // Provide more user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.')
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please check your email and click the confirmation link before signing in.')
        }
        if (error.message.includes('Too many requests')) {
          throw new Error('Too many login attempts. Please wait a few minutes before trying again.')
        }
        if (error.message.includes('not configured')) {
          throw new Error('Authentication service is not configured. Please set up your Supabase credentials.')
        }
        
        throw new Error(error.message)
      }

      return { user: authData.user, session: authData.session }
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  // Sign out user
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error && !error.message.includes('not configured')) {
        throw error
      }
    } catch (error) {
      console.error('Sign out error:', error)
      if (error instanceof Error && !error.message.includes('not configured')) {
        throw error
      }
    }
  }

  // Get current user with timeout
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        // Handle the specific "Auth session missing!" error gracefully
        if (error.message === 'Auth session missing!' || error.message.includes('not configured')) {
          return null
        }
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('Connection timeout') ||
            error.message.includes('SUPABASE CONNECTION FAILED')) {
          console.warn('Unable to verify user session due to Supabase connection issues')
          return null
        }
        throw error
      }
      return user
    } catch (error) {
      console.error('Get current user error:', error)
      return null // Return null instead of throwing to prevent blocking
    }
  }

  // Get user profile with enhanced error handling
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log('Attempting to fetch user profile for:', userId)
      
      // First check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError && !sessionError.message.includes('not configured')) {
        console.error('Session error:', sessionError)
        if (sessionError.message.includes('Failed to fetch') || 
            sessionError.message.includes('Connection timeout') ||
            sessionError.message.includes('SUPABASE CONNECTION FAILED')) {
          throw new Error('🚨 Cannot connect to Supabase.\n\nYour project may be paused or deleted.\nCheck https://supabase.com for your project status.\n\nSee SUPABASE_CONNECTION_FIX.md for help.')
        }
        throw new Error('Authentication session error. Please sign in again.')
      }

      if (!session && !sessionError?.message.includes('not configured')) {
        console.error('No active session found')
        throw new Error('No active session. Please sign in.')
      }

      console.log('Making database request...')

      // Make the profile request with timeout and better error handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // Reduced to 3 second timeout

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .limit(1)
          .abortSignal(controller.signal)

        clearTimeout(timeoutId)

        if (error) {
          console.log('Database query error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          })
          
          // Check for Supabase connection issues
          if (error.message.includes('SUPABASE CONNECTION FAILED') ||
              error.message.includes('Failed to fetch') || 
              error.message.includes('NetworkError') || 
              error.message.includes('Connection timeout')) {
            throw new Error('🚨 Cannot connect to Supabase database.\n\nYour project may be paused or deleted.\nCheck https://supabase.com for your project status.\n\nSee SUPABASE_CONNECTION_FIX.md for help.')
          }
          
          if (error.message.includes('relation "user_profiles" does not exist')) {
            throw new Error('Database table not found. Please run the database migration to create the user_profiles table.')
          }
          
          if (error.message.includes('JWT')) {
            throw new Error('Authentication token expired. Please sign in again.')
          }

          if (error.message.includes('not configured')) {
            console.log('Database not configured, returning null profile')
            return null
          }
          
          throw new Error(`Database error: ${error.message}`)
        }
        
        // Check if data array is empty (no profile found)
        if (!data || data.length === 0) {
          console.log('No profile found for user, returning null')
          return null
        }
        
        console.log('Profile fetched successfully')
        return data[0] // Return the first (and only) result
      } catch (fetchError) {
        clearTimeout(timeoutId)
        
        if (fetchError instanceof Error) {
          if (fetchError.name === 'AbortError') {
            throw new Error('🚨 Database request timed out.\n\nYour Supabase project may be paused.\nCheck https://supabase.com for your project status.')
          }
          
          if (fetchError.message.includes('not configured')) {
            return null
          }
          
          if (fetchError.message.includes('Failed to fetch')) {
            throw new Error('🚨 Cannot connect to Supabase database.\n\nYour project may be paused or deleted.\nCheck https://supabase.com for your project status.')
          }
        }
        
        throw fetchError
      }
    } catch (error) {
      console.error('Get user profile error:', error)
      
      // Check if we're offline
      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection and try again.')
      }
      
      // Handle configuration errors gracefully
      if (error instanceof Error && error.message.includes('not configured')) {
        return null
      }
      
      // Re-throw the error with more context if it's a network error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('🚨 Cannot connect to Supabase database.\n\nYour project may be paused or deleted.\nCheck https://supabase.com for your project status.')
      }
      
      throw error
    }
  }

  // Update user profile with profile picture support
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>, profilePicture?: File) {
    try {
      let profilePictureUrl = updates.profile_picture_url

      // Handle profile picture upload
      if (profilePicture) {
        // Delete old profile picture if exists
        if (updates.profile_picture_url) {
          await this.deleteProfilePicture(updates.profile_picture_url)
        }

        // Upload new profile picture
        profilePictureUrl = await this.uploadProfilePicture(userId, profilePicture)
      }

      // Update profile with new data
      const profileData = {
        ...updates,
        ...(profilePictureUrl && { profile_picture_url: profilePictureUrl })
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({ id: userId, ...profileData }, { onConflict: 'id' })
        .select()
        .single()

      if (error) {
        if (error.message.includes('SUPABASE CONNECTION FAILED') ||
            error.message.includes('Failed to fetch') || 
            error.message.includes('Connection timeout')) {
          throw new Error('🚨 Cannot connect to database.\n\nYour Supabase project may be paused.\nCheck https://supabase.com for your project status.')
        }
        if (error.message.includes('not configured')) {
          throw new Error('Database not configured. Please set up your Supabase credentials.')
        }
        throw error
      }
      return data
    } catch (error) {
      console.error('Update user profile error:', error)
      throw error
    }
  }

  // Reset password
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        if (error.message.includes('SUPABASE CONNECTION FAILED') ||
            error.message.includes('Failed to fetch') || 
            error.message.includes('Connection timeout')) {
          throw new Error('🚨 Cannot connect to authentication service.\n\nYour Supabase project may be paused.\nCheck https://supabase.com for your project status.')
        }
        if (error.message.includes('Invalid email')) {
          throw new Error('Please enter a valid email address.')
        }
        if (error.message.includes('not configured')) {
          throw new Error('Password reset is not available. Please contact support.')
        }
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}