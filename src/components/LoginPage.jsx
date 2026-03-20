import { useState } from 'react'

export default function LoginPage({ onLogin }) {
  const [loggingIn, setLoggingIn] = useState(false)
  const [error, setError] = useState(null)

  async function handleLogin() {
    setLoggingIn(true)
    setError(null)
    try {
      await onLogin()
    } catch (err) {
      setError('No se pudo iniciar sesión. Intentá de nuevo.')
      setLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Hero section with photo background */}
      <div className="relative flex-1 flex flex-col justify-center overflow-hidden">
        {/* Background photo — brighter, more visible */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/brothers-hero.jpg)',
            filter: 'brightness(0.65) sepia(0.2)',
          }}
        />
        {/* Subtle gradient for text readability */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(3,7,18,0.15) 0%, rgba(3,7,18,0.5) 45%, rgba(3,7,18,0.85) 75%, rgba(3,7,18,1) 100%)'
        }} />

        {/* Mascot - bottom right, standing on the shore between last brother and mountain */}
        <img
          src="/autovaca-mascot.svg"
          alt="AutoVaca"
          className="absolute w-40 h-40 drop-shadow-2xl hidden md:block z-10"
          style={{
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
            right: '18%',
            bottom: '4%',
            transform: 'rotate(-3deg)',
          }}
        />

        {/* Content — positioned center-left, over the lower body area */}
        <div className="relative z-10 flex flex-col items-center px-4 text-center" style={{ marginTop: '25vh' }}>
          {/* Mascot for mobile - inline, smaller */}
          <img
            src="/autovaca-mascot.svg"
            alt="AutoVaca"
            className="w-20 h-20 mb-3 drop-shadow-2xl md:hidden"
            style={{ filter: 'drop-shadow(0 0 12px rgba(74, 222, 128, 0.3))' }}
          />

          {/* Title */}
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.7)' }}>
            Auto<span className="text-emerald-400">Vaca</span>
          </h1>

          {/* Sign in button */}
          <button
            onClick={handleLogin}
            disabled={loggingIn}
            className="flex items-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium
              px-6 py-3 rounded-xl shadow-lg shadow-black/30 transition-all duration-200
              hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loggingIn ? 'Conectando...' : 'Entrar con Google'}
          </button>

          {error && (
            <p className="mt-4 text-red-400 text-sm">{error}</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center py-4 text-gray-600 text-xs flex items-center justify-center gap-1.5">
        With love, LPR
        <img src="/autovaca-mascot.svg" alt="" className="w-4 h-4 inline-block" />
      </footer>
    </div>
  )
}
