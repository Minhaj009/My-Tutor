import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if we have valid configuration
const hasValidConfig = supabaseUrl && supabaseAnonKey && 
  !supabaseUrl.includes('your-project') && 
  !supabaseAnonKey.includes('your-anon-key')

let supabase: any
let isUsingMockClient = false

// Create mock client for when Supabase is not available
const createMockClient = () => {
  console.warn('🔄 Using mock Supabase client - connection unavailable')
  isUsingMockClient = true
  
  const mockError = { 
    message: 'Supabase connection unavailable. Please check your project status.',
    code: 'SUPABASE_UNAVAILABLE'
  }
  
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signUp: () => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: mockError
      }),
      signInWithPassword: () => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: mockError
      }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: (callback: any) => {
        setTimeout(() => callback('SIGNED_OUT', null), 100)
        return { data: { subscription: { unsubscribe: () => {} } } }
      }
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: mockError }),
          limit: () => Promise.resolve({ data: [], error: null }),
          maybeSingle: () => Promise.resolve({ data: null, error: mockError }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null })
          })
        }),
        limit: () => Promise.resolve({ data: [], error: null }),
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null })
        })
      }),
      insert: () => Promise.resolve({ data: null, error: mockError }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: mockError })
          })
        })
      }),
      upsert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: mockError })
        })
      })
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: mockError }),
        remove: () => Promise.resolve({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
  }
}

if (!hasValidConfig) {
  console.warn('❌ Supabase configuration missing or invalid')
  supabase = createMockClient()
} else {
  try {
    // Create Supabase client with enhanced configuration
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      db: {
        schema: 'public',
      },
      global: {
        fetch: (url, options = {}) => {
          // Add timeout to fetch requests
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
          
          return fetch(url, {
            ...options,
            signal: controller.signal
          }).finally(() => {
            clearTimeout(timeoutId)
          }).catch(error => {
            if (error.name === 'AbortError') {
              throw new Error('Request timeout - Supabase may be unavailable')
            }
            throw error
          })
        }
      }
    })

    // Test connection in development with better error handling
    if (import.meta.env.DEV) {
      const testConnection = async () => {
        try {
          console.log('🔍 Testing Supabase connection...')
          
          // Simple connectivity test with timeout
          const { error } = await supabase
            .from('user_profiles')
            .select('count')
            .limit(1)
          
          if (error) {
            if (error.code === 'PGRST116' || error.code === '42P01') {
              console.log('✅ Supabase connected - database setup may be needed')
            } else if (error.message.includes('Database error') || 
                      error.message.includes('unexpected_failure')) {
              console.warn('⚠️ Supabase project may be paused or experiencing issues')
              console.warn('💡 Go to https://supabase.com/dashboard and check if your project needs to be resumed')
            } else {
              console.warn('⚠️ Supabase connection issue:', error.message)
            }
          } else {
            console.log('✅ Supabase connection successful')
          }
        } catch (error) {
          console.warn('⚠️ Supabase connection test failed:', error instanceof Error ? error.message : 'Unknown error')
          console.warn('💡 This may indicate your Supabase project is paused or experiencing issues')
        }
      }

      // Run test with delay to avoid blocking app startup
      setTimeout(testConnection, 1000)
    }

  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
    supabase = createMockClient()
  }
}

export { supabase, isUsingMockClient }

// Types for our database
export interface UserProfile {
  id: string
  first_name: string
  last_name: string
  grade: string
  board?: string
  area?: string
  profile_picture_url?: string
  subject_group?: string
  subjects?: string[]
  created_at: string
  updated_at: string
}

export interface UserProgressStats {
  id: string
  user_id: string
  study_streak_days: number
  total_study_time_minutes: number
  completed_lessons: number
  total_tests_taken: number
  average_test_score: number
  ai_sessions_count: number
  weekly_study_time: number
  monthly_study_time: number
  last_study_date?: string
  created_at: string
  updated_at: string
}

export interface SubjectProgress {
  id: string
  user_id: string
  subject_name: string
  progress_percentage: number
  completed_topics: number
  total_topics: number
  last_accessed: string
  created_at: string
  updated_at: string
}

export interface StudySession {
  id: string
  user_id: string
  session_type: 'lesson' | 'test' | 'ai_tutor' | 'materials'
  subject: string
  duration_minutes: number
  score?: number
  session_date: string
  created_at: string
}

export interface UserDatabase {
  id: string
  user_id: string
  database_name: string
  grade: string
  board?: string
  subject_group?: string
  subjects: string[]
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
      }
      user_progress_stats: {
        Row: UserProgressStats
        Insert: Omit<UserProgressStats, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProgressStats, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
      subject_progress: {
        Row: SubjectProgress
        Insert: Omit<SubjectProgress, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SubjectProgress, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
      study_sessions: {
        Row: StudySession
        Insert: Omit<StudySession, 'id' | 'created_at'>
        Update: Partial<Omit<StudySession, 'id' | 'user_id' | 'created_at'>>
      }
      user_databases: {
        Row: UserDatabase
        Insert: Omit<UserDatabase, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserDatabase, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}