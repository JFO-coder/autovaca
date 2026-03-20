import { useState, useEffect, useCallback } from 'react'
import { Receipt, BarChart3, CreditCard, Share2, List, LogOut, Menu, X } from 'lucide-react'
import Dashboard from './components/Dashboard'
import TransactionForm from './components/TransactionForm'
import TransactionLog from './components/TransactionLog'
import SettlementView from './components/SettlementView'
import ShareView from './components/ShareView'
import TarjetaMamaView from './components/TarjetaMamaView'
import LoginPage from './components/LoginPage'
import { useAuth } from './hooks/useAuth'
import { getTransactions } from './services/firestore'

const TABS = [
  { id: 'entry', label: 'New', icon: Receipt },
  { id: 'log', label: 'Log', icon: List },
  { id: 'settlement', label: 'Settlement', icon: BarChart3 },
  { id: 'mama', label: 'Mamá', icon: CreditCard },
  { id: 'share', label: 'Share', icon: Share2 },
]

export default function App() {
  const { user, loading: authLoading, loginWithGoogle, logout } = useAuth()
  const [activeGroup, setActiveGroup] = useState(null)
  const [activeTab, setActiveTab] = useState('entry')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [lastTransaction, setLastTransaction] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadTransactions = useCallback(async () => {
    if (!activeGroup) return
    setLoading(true)
    try {
      const txns = await getTransactions(activeGroup.id)
      setTransactions(txns)
    } catch (err) {
      console.error('Failed to load transactions:', err)
    } finally {
      setLoading(false)
    }
  }, [activeGroup])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  function handleTransactionAdded(txn) {
    setLastTransaction(txn)
    loadTransactions()
    setActiveTab('share')
  }

  function handleSelectGroup(group) {
    setActiveGroup(group)
    setTransactions([])
    setLastTransaction(null)
    setSidebarOpen(false)
  }

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <img src="/autovaca-mascot.svg" alt="AutoVaca" className="w-16 h-16 animate-pulse" />
      </div>
    )
  }

  // Not logged in → show login page
  if (!user) {
    return <LoginPage onLogin={loginWithGoogle} />
  }

  // Logged in → show app
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-gray-400 hover:text-gray-200 p-1"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <img src="/autovaca-mascot.svg" alt="" className="w-8 h-8" />
            <h1 className="text-xl font-bold text-emerald-400">
              AutoVaca
              {activeGroup && (
                <span className="text-sm font-normal text-gray-500 ml-2 hidden sm:inline">
                  · {activeGroup.name}
                </span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 truncate max-w-[120px]">
              {user.displayName || user.email}
            </span>
            <button
              onClick={logout}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 border-r border-gray-800 transform transition-transform duration-200 ease-in-out md:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 pt-20 overflow-y-auto h-full">
          <Dashboard onSelectGroup={handleSelectGroup} activeGroup={activeGroup} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar — desktop only */}
          <div className="hidden md:block md:col-span-3">
            <Dashboard onSelectGroup={handleSelectGroup} activeGroup={activeGroup} />
          </div>

          {/* Main content */}
          <div className="col-span-12 md:col-span-9">
            {/* Tab bar */}
            <div className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1 overflow-x-auto">
              {TABS.map(tab => {
                const Icon = tab.icon
                return (
                  <button key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center flex-shrink-0 ${
                      activeTab === tab.id
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            {loading && (
              <div className="text-center text-gray-500 py-8">Loading transactions...</div>
            )}

            {!loading && activeGroup && (
              <>
                {activeTab === 'entry' && (
                  <TransactionForm
                    group={activeGroup}
                    onTransactionAdded={handleTransactionAdded}
                  />
                )}
                {activeTab === 'log' && (
                  <TransactionLog
                    transactions={transactions}
                    participants={activeGroup.participants}
                    groupId={activeGroup.id}
                    onTransactionDeleted={() => loadTransactions()}
                  />
                )}
                {activeTab === 'settlement' && (
                  <SettlementView
                    transactions={transactions}
                    participants={activeGroup.participants}
                  />
                )}
                {activeTab === 'mama' && (
                  <TarjetaMamaView
                    transactions={transactions}
                    participants={activeGroup.participants}
                  />
                )}
                {activeTab === 'share' && (
                  <ShareView
                    lastTransaction={lastTransaction}
                    transactions={transactions}
                    participants={activeGroup.participants}
                    group={activeGroup}
                  />
                )}
              </>
            )}

            {!activeGroup && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 text-center text-gray-500 py-12">
                Select or create a group to get started
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
