import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { AuthService } from '../services/authService'
import { ProgressService } from '../services/progressService'
import { SubjectGroupService } from '../services/subjectGroupService'
import type { UserProfile, UserProgressStats, SubjectProgress } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  progressStats: UserProgressStats | null
  subjectProgress: SubjectProgress[]
  session: Session | null
  loading: boolean
  error: string | null
  isNewUser: boolean
  hasSubjectGroup: boolean
  connectionStatus: 'connected' | 'disconnected' | 'checking'
  signUp: (data: any) => Promise<void>
  signIn: (data: any) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>, profilePicture?: File) => Promise<void>
  retryProfileLoad: () => Promise<void>
  markProfileCompleted: () => void
  recordStudySession: (sessionType: 'lesson' | 'test' | 'ai_tutor' | 'materials', subject: string, durationMinutes: number, score?: number) => Promise<void>
  refreshProgress: () => Promise<void>
  retryConnection: () => Promise<void>
  dismissError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [progressStats, setProgressStats] = useState<UserProgressStats | null>(null)
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)
  const [hasSubjectGroup, setHasSubjectGroup] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')

  const dismissError = () => {
    setError(null)
  }

  const handleSupabaseError = (error: any, context: string) => {
    console.error(`${context} error:`, error)
    
    if (error?.name === 'SupabaseConnectionError' || error?.name === 'SupabaseTimeoutError') {
      setConnectionStatus('disconnected')
      setError(error.message)
      return
    }
    
    if (error?.message?.includes('Failed to fetch') || 
        error?.message?.includes('NetworkError') ||
        error?.message?.includes('Connection timeout') ||
        error?.message?.includes('fetch is not defined')) {
      setConnectionStatus('disconnected')
      setError('🚨 Cannot Connect to Supabase\n\nYour Supabase project appears to be unavailable.\n\nTo fix this:\n1. Go to https://supabase.com/dashboard\n2. Check if your project is paused and resume it\n3. Wait 2-3 minutes for full restart\n4. Refresh this page')
      return
    }
    
    if (error?.message?.includes('Database error saving new user') ||
        error?.message?.includes('unexpected_failure')) {
      setConnectionStatus('disconnected')
      setError('🚨 Supabase Project Issue\n\nYour Supabase project appears to be paused or experiencing database issues.\n\nTo fix this:\n1. Go to https://supabase.com/dashboard\n2. Find your project and click "Resume" if paused\n3. Wait 2-3 minutes for full restart\n4. Try again')
      return
    }
    
    // For other errors, don't change connection status
    const errorMessage = error instanceof Error ? error.message : `${context} failed`
    setError(errorMessage)
  }

  const retryConnection = async () => {
    try {
      setConnectionStatus('checking')
      setError(null)
      
      // Test connection by trying to get current user
      const currentUser = await AuthService.getCurrentUser()
      
      setConnectionStatus('connected')
      setUser(currentUser)
      
      if (currentUser) {
        // Reload profile and progress data
        await loadUserProfile(currentUser.id)
        await loadUserProgress(currentUser.id)
        await checkSubjectGroupSelection(currentUser.id)
      }
      
      console.log('✅ Connection restored successfully')
    } catch (error) {
      handleSupabaseError(error, 'Connection retry')
    }
  }

  const loadUserProfile = async (userId: string) => {
    try {
      setError(null)
      console.log('Loading profile for user:', userId)
      const userProfile = await AuthService.getUserProfile(userId)
      setProfile(userProfile)
      setConnectionStatus('connected')
      console.log('Profile loaded successfully:', userProfile)
    } catch (error) {
      handleSupabaseError(error, 'Load user profile')
      setProfile(null)
    }
  }

  const loadUserProgress = async (userId: string) => {
    try {
      console.log('Loading progress for user:', userId)
      
      // Load progress stats
      const stats = await ProgressService.getUserProgress(userId)
      setProgressStats(stats)
      
      // Load subject progress
      const subjects = await ProgressService.getSubjectProgress(userId)
      setSubjectProgress(subjects)
      
      console.log('Progress loaded successfully')
    } catch (error) {
      console.error('Error loading user progress:', error)
      // Don't set error for progress loading failures - it's not critical
    }
  }

  const checkSubjectGroupSelection = async (userId: string) => {
    try {
      console.log('Checking subject group selection for user:', userId)
      const subjectGroup = await SubjectGroupService.getUserSubjectGroup(userId)
      const hasGroup = !!(subjectGroup && subjectGroup.subjects.length > 0)
      setHasSubjectGroup(hasGroup)
      console.log('Subject group check result:', hasGroup)
    } catch (error) {
      console.error('Error checking subject group:', error)
      setHasSubjectGroup(false)
    }
  }

  const refreshProgress = async () => {
    if (user) {
      await loadUserProgress(user.id)
    }
  }

  const recordStudySession = async (
    sessionType: 'lesson' | 'test' | 'ai_tutor' | 'materials',
    subject: string,
    durationMinutes: number,
    score?: number
  ) => {
    if (!user) throw new Error('No user logged in')
    
    try {
      await ProgressService.recordStudySession(user.id, sessionType, subject, durationMinutes, score)
      // Refresh progress after recording session
      await refreshProgress()
    } catch (error) {
      handleSupabaseError(error, 'Record study session')
      throw error
    }
  }

  const retryProfileLoad = async () => {
    if (user) {
      await loadUserProfile(user.id)
      await loadUserProgress(user.id)
      await checkSubjectGroupSelection(user.id)
    }
  }

  const markProfileCompleted = () => {
    setIsNewUser(false)
    // Clear the flag from localStorage
    localStorage.removeItem('isNewUser')
  }

  useEffect(() => {
    let mounted = true
    let subscription: any = null

    // Get initial session with enhanced error handling
    const getInitialSession = async () => {
      try {
        setError(null)
        setConnectionStatus('checking')
        console.log('Getting initial session...')
        
        // Reduced timeout for faster failure detection
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          controller.abort()
        }, 8000) // 8 seconds timeout
        
        try {
          const currentUser = await AuthService.getCurrentUser()
          clearTimeout(timeoutId)
          
          if (!mounted) return
          
          console.log('Initial session result:', currentUser ? 'User found' : 'No user')
          setUser(currentUser)
          setConnectionStatus('connected')
          
          if (currentUser) {
            // Check if this is a new user
            const isNewUserFlag = localStorage.getItem('isNewUser') === 'true'
            setIsNewUser(isNewUserFlag)
            
            // Load profile, progress, and subject group in background
            loadUserProfile(currentUser.id).catch(console.error)
            loadUserProgress(currentUser.id).catch(console.error)
            checkSubjectGroupSelection(currentUser.id).catch(console.error)
          }
        } catch (authError) {
          clearTimeout(timeoutId)
          
          if (authError instanceof Error && authError.name === 'AbortError') {
            console.warn('Session check timeout - continuing without authentication')
            setConnectionStatus('disconnected')
            setError('🚨 Connection Timeout\n\nUnable to connect to Supabase. Your project may be paused.\n\nPlease check https://supabase.com/dashboard')
          } else {
            throw authError
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        
        if (mounted) {
          setUser(null)
          setProfile(null)
          setProgressStats(null)
          setSubjectProgress([])
          setHasSubjectGroup(false)
          
          handleSupabaseError(error, 'Initial session')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes with enhanced error handling
    try {
      const authListener = AuthService.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return
          
          console.log('Auth state change:', event, session ? 'Session exists' : 'No session')
          setError(null) // Clear errors on auth state change
          setSession(session)
          setUser(session?.user ?? null)
          
          if (session?.user) {
            setConnectionStatus('connected')
            
            // Check if this is a new user (from sign up)
            const isNewUserFlag = localStorage.getItem('isNewUser') === 'true'
            setIsNewUser(isNewUserFlag)
            
            // Load profile, progress, and subject group asynchronously
            loadUserProfile(session.user.id).catch(console.error)
            loadUserProgress(session.user.id).catch(console.error)
            checkSubjectGroupSelection(session.user.id).catch(console.error)
          } else {
            setProfile(null)
            setProgressStats(null)
            setSubjectProgress([])
            setIsNewUser(false)
            setHasSubjectGroup(false)
          }
          
          // Set loading to false immediately for auth state changes
          setLoading(false)
        }
      )

      // Safely extract subscription with null checks
      if (authListener && authListener.data && authListener.data.subscription) {
        subscription = authListener.data.subscription
      } else {
        console.warn('Auth listener did not return expected subscription object')
      }
    } catch (error) {
      console.error('Error setting up auth state listener:', error)
      // Set a user-friendly error message
      if (mounted) {
        handleSupabaseError(error, 'Auth state listener setup')
        setLoading(false)
      }
    }

    return () => {
      mounted = false
      // Safely unsubscribe only if subscription exists and has unsubscribe method
      if (subscription && typeof subscription.unsubscribe === 'function') {
        try {
          subscription.unsubscribe()
        } catch (error) {
          console.error('Error unsubscribing from auth changes:', error)
        }
      }
    }
  }, [])

  const signUp = async (data: any) => {
    try {
      setLoading(true)
      setError(null)
      setConnectionStatus('checking')
      
      // Mark as new user before sign up
      localStorage.setItem('isNewUser', 'true')
      setIsNewUser(true)
      
      await AuthService.signUp(data)
      setConnectionStatus('connected')
      // Don't set loading to false here - let auth state change handle it
    } catch (error) {
      setLoading(false)
      // Clear new user flag on error
      localStorage.removeItem('isNewUser')
      setIsNewUser(false)
      handleSupabaseError(error, 'Sign up')
      throw error
    }
  }

  const signIn = async (data: any) => {
    try {
      setLoading(true)
      setError(null)
      setConnectionStatus('checking')
      
      // Clear any existing new user flag for sign in
      localStorage.removeItem('isNewUser')
      setIsNewUser(false)
      
      await AuthService.signIn(data)
      setConnectionStatus('connected')
      // Don't set loading to false here - let auth state change handle it
    } catch (error) {
      setLoading(false)
      handleSupabaseError(error, 'Sign in')
      throw error
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Clear new user flag on sign out
      localStorage.removeItem('isNewUser')
      setIsNewUser(false)
      
      await AuthService.signOut()
      setUser(null)
      setProfile(null)
      setProgressStats(null)
      setSubjectProgress([])
      setSession(null)
      setHasSubjectGroup(false)
      setConnectionStatus('connected')
    } catch (error) {
      handleSupabaseError(error, 'Sign out')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>, profilePicture?: File) => {
    if (!user) throw new Error('No user logged in')
    
    try {
      setError(null)
      
      // Merge updates with existing profile data to preserve required fields
      const profileData = {
        ...profile,
        ...updates,
        // Ensure required fields are always present
        first_name: updates.first_name || profile?.first_name || '',
        last_name: updates.last_name || profile?.last_name || '',
        grade: updates.grade || profile?.grade || ''
      }
      
      const updatedProfile = await AuthService.updateUserProfile(user.id, profileData, profilePicture)
      setProfile(updatedProfile)
      setConnectionStatus('connected')
      
      // If this was a new user completing their profile, initialize progress
      if (isNewUser) {
        // Initialize progress tracking for new user
        await ProgressService.initializeUserProgress(user.id)
        await ProgressService.initializeSubjects(user.id)
        await loadUserProgress(user.id)
      }
      
      // Check subject group status after profile update
      await checkSubjectGroupSelection(user.id)
    } catch (error) {
      handleSupabaseError(error, 'Profile update')
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    progressStats,
    subjectProgress,
    session,
    loading,
    error,
    isNewUser,
    hasSubjectGroup,
    connectionStatus,
    signUp,
    signIn,
    signOut,
    updateProfile,
    retryProfileLoad,
    markProfileCompleted,
    recordStudySession,
    refreshProgress,
    retryConnection,
    dismissError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}