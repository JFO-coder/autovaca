import { useState, useEffect, useCallback } from 'react'
import { Receipt, BarChart3, CreditCard, Share2, List } from 'lucide-react'
import Dashboard from './components/Dashboard'
import TransactionForm from './components/TransactionForm'
import TransactionLog from './components/TransactionLog'
import SettlementView from './components/SettlementView'
import ShareView from './components/ShareView'
import TarjetaMamaView from './components/TarjetaMamaView'
import { getTransactions } from './services/firestore'

const TABS = [
  { id: 'entry', label: 'New', icon: Receipt },
  { id: 'log', label: 'Log', icon: List },
  { id: 'settlement', label: 'Settlement', icon: BarChart3 },
  { id: 'mama', label: 'Mamá', icon: CreditCard },
  { id: 'share', label: 'Share', icon: Share2 },
]

export default function App() {
  const [activeGroup, setActiveGroup] = useState(null)
  const [activeTab, setActiveTab] = useState('entry')
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
    setActiveTab('share') // Auto-switch to share view after adding
  }

  function handleSelectGroup(group) {
    setActiveGroup(group)
    setTransactions([])
    setLastTransaction(null)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-400">
            Autovaca
            {activeGroup && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                · {activeGroup.name}
              </span>
            )}
          </h1>
          <div className="text-xs text-gray-600">
            {transactions.length} transactions
          </diw>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-3">
            <Dashboard onSelectGroup={handleSelectGroup} activeGroup={activeGroup} />
          </div>

          {/* Main content */}
          <div className="col-span-9">
            {/* Tab bar */}
            <div className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1">
              {TABS.map(tab => {
                const Icon = tab.icon
                return (
                  <button key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
                      activeTab === tab.id
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
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
              <div className="card text-center text-gray-500 py-12">
                Select or create a group to get started
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  
  RCETRN RC
