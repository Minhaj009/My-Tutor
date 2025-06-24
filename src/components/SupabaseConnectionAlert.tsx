import React from 'react'
import { useAuth } from '../contexts/AuthContext'

export const SupabaseConnectionAlert: React.FC = () => {
  const { connectionStatus, error, retryConnection, dismissError } = useAuth()

  if (connectionStatus === 'connected' || !error) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-4 shadow-lg">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
              <h3 className="font-semibold">Supabase Connection Issue</h3>
            </div>
            <div className="text-sm whitespace-pre-line leading-relaxed">
              {error}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={retryConnection}
              disabled={connectionStatus === 'checking'}
              className="px-3 py-1 bg-red-700 hover:bg-red-800 disabled:bg-red-800 disabled:opacity-50 rounded text-sm font-medium transition-colors"
            >
              {connectionStatus === 'checking' ? 'Checking...' : 'Retry'}
            </button>
            <button
              onClick={dismissError}
              className="px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-sm font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}