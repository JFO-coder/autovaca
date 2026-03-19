import { useState, useMemo } from 'react'
import { Search, Filter } from 'lucide-react'

export default function TransactionLog({ transactions, participants }) {
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

  const participantMap = useMemo(() => {
    const map = {}
    ;(participants || []).forEach(p => { map[p.id] = p.name })
    return map
  }, [participants])

  const filtered = useMemo(() => {
    let list = transactions || []
    if (filterCategory !== 'all') {
      list = list.filter(t => t.category === filterCategory)
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.concept?.toLowerCase().includes(q) ||
        participantMap[t.paidBy]?.toLowerCase().includes(q)
      )
    }
    return list
  }, [transactions, search, filterCategory, participantMap])

  const categories = useMemo(() => {
    const cats = new Set((transactions || []).map(t => t.category).filter(Boolean))
    return ['all', ...cats]
  }, [transactions])

  function formatDate(d) {
    if (!d) return '—'
    const date = d instanceof Date ? d : new Date(d)
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary-400">Transactions</h2>
        <span className="text-sm text-gray-500">{filtered.length} entries</span>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            className="input-field pl-9"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field w-40"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          {categories.map(c => (
            <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
          ))}
        </select>
      </div>

      {/* Transaction list */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filtered.map(txn => (
          <div key={txn.id}
            className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{txn.concept}</span>
                {txn.category && txn.category !== 'general' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                    {txn.category}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {formatDate(txn.date)} · paid by {participantMap[txn.paidBy] || txn.paidBy}
                {txn.originalCurrency !== 'USD' && (
                  <span className="ml-1">
                    ({txn.totalAmount?.toFixed(2)} {txn.originalCurrency})
                  </span>
                )}
              </div>
            </div>
            <div className="text-right ml-3">
              <span className="font-mono font-semibold text-sm">
                ${txn.amountUSD?.toFixed(2)}
              </span>
              <div className="text-xs text-gray-500">
                {txn.splitType === 'equal' ? `÷${txn.splits?.length}` : 'custom'}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No transactions found
          </div>
        )}
      </div>
    </div>
  )
}
