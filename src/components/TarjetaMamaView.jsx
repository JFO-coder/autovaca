import { useMemo } from 'react'
import { CreditCard } from 'lucide-react'

/**
 * Tarjeta Mamá module — yearly summaries and monthly breakdown
 * of the brothers' shared mother's credit card payments.
 */
export default function TarjetaMamaView({ transactions, participants }) {
  const participantMap = useMemo(() => {
    const map = {}
    ;(participants || []).forEach(p => { map[p.id] = p.name })
    return map
  }, [participants])

  const mamaTransactions = useMemo(() =>
    (transactions || []).filter(t => t.category === 'tarjeta_mama'),
    [transactions]
  )

  const yearlyData = useMemo(() => {
    const years = {}
    mamaTransactions.forEach(txn => {
      const date = txn.date instanceof Date ? txn.date : new Date(txn.date)
      const year = date.getFullYear()
      if (!years[year]) years[year] = { total: 0, months: 0, byPayer: {}, transactions: [] }
      years[year].total += txn.amountUSD
      years[year].months++
      years[year].transactions.push(txn)
      const payer = txn.paidBy
      years[year].byPayer[payer] = (years[year].byPayer[payer] || 0) + txn.amountUSD
    })
    return Object.entries(years)
      .sort(([a], [b]) => b - a)
      .map(([year, data]) => ({
        year: parseInt(year), total: data.total, months: data.months,
        monthlyAvg: data.total / (data.months || 1),
        perBrother: data.total / (participants?.length || 4),
        byPayer: data.byPayer,
        transactions: data.transactions.sort((a, b) => {
          const da = a.date instanceof Date ? a.date : new Date(a.date)
          const db = b.date instanceof Date ? b.date : new Date(b.date)
          return db - da
        })
      }))
  }, [mamaTransactions, participants])

  function formatDate(d) {
    if (!d) return '—'
    const date = d instanceof Date ? d : new Date(d)
    return date.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-primary-400" />
          <h2 className="text-lg font-semibold text-primary-400">Tarjeta Mamá</h2>
        </div>
        <div className="space-y-4">
          {yearlyData.map(yd => (
            <div key={yd.year} className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                <div className="min-w-0">
                  <span className="text-xl font-bold text-yellow-400">{yd.year}</span>
                  <span className="text-sm text-gray-500 ml-2">({yd.months} months)</span>
                </div>
                <div className="text-right min-w-0">
                  <div className="font-mono font-bold text-lg">${yd.total.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 truncate">${yd.perBrother.toFixed(2)} per brother · ${yd.monthlyAvg.toFixed(2)}/mo</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mb-3">
                {Object.entries(yd.byPayer).map(([payerId, amount]) => (
                  <div key={payerId} className="text-sm">
                    <span className="text-gray-400">{participantMap[payerId] || payerId}:</span>
                    <span className="font-mono ml-1">${amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <details className="text-sm">
                <summary className="text-gray-500 cursor-pointer hover:text-gray-400">Monthly detail</summary>
                <div className="mt-2 space-y-1">
                  {yd.transactions.map(txn => (
                    <div key={txn.id} className="flex justify-between gap-2 text-gray-400">
                      <span className="min-w-0 truncate">{formatDate(txn.date)} · {participantMap[txn.paidBy]}</span>
                      <span className="font-mono flex-shrink-0">${txn.amountUSD?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ))}
        </div>
        {yearlyData.length === 0 && (
          <div className="text-center text-gray-500 py-8">No Tarjeta Mamá transactions yet</div>
        )}
      </div>
    </div>
  )
}
