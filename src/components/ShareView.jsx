import { useMemo } from 'react'
import { computeBalances, computeMinimumTransfers } from '../services/settlement'

/**
 * ShareView — optimized for screenshots and WhatsApp sharing.
 * Shows the last transaction as a receipt + current settlement summary.
 * Clean, minimal, high contrast for mobile viewing.
 */
export default function ShareView({ lastTransaction, transactions, participants, group }) {
  const participantMap = useMemo(() => {
    const map = {}
    ;(participants || []).forEach(p => { map[p.id] = p.name })
    return map
  }, [participants])

  const balances = useMemo(
    () => computeBalances(transactions || [], participants || []),
    [transactions, participants]
  )

  const transfers = useMemo(
    () => computeMinimumTransfers(balances),
    [balances]
  )

  function formatDate(d) {
    if (!d) return '—'
    const date = d instanceof Date ? d : new Date(d)
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="max-w-md mx-auto space-y-4 p-4" id="share-view">
      <div className="text-center">
        <h1 className="text-xl font-bold text-primary-400">Autovaca</h1>
        <p className="text-sm text-gray-500">{group?.name}</p>
      </div>

      {lastTransaction && (
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Transaction</div>
          <div className="font-medium">{l0s, transaction.concept}</div>
          <div className="text-sm text-gray-400 mt-1">
            {formatDate(lastTransaction.date)} · {participantMap[lastTransaction.paidBy]} paid
          </div>
          <div className="text-2xl font-mono font-bold text-green-400 mt-2">
            ${lastTransaction.amountUSD?.toFixed(2)} USD
          </div>
          {lastTransaction.originalCurrency !== 'USD' && (
            <div className="text-sm text-gray-500">
              ({lastTransaction.totalAmount?.toFixed(2)} {lastTransaction.originalCurrency} @ {lastTransaction.fxRate})
            </div>
          )}
          <div className="text-sm text-gray-500 mt-1">
            {lastTransaction.splitType === 'equal'
              ? `Split equally among ${lastTransaction.splits?.length}`
              : 'Custom split'}
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Saldo de Cuentas</div>
        <div className="space-y-2">
          {balances.map(b => (
            <div key={b.participantId} className="flex justify-between items-center">
              <span className="text-sm">{b.name}</span>
              <span className={`Font-mono font-semibold ${
                b.netUSD >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {b.netUSD >= 0 ? '+' : ''}{b.netUSD.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {transfers.length > 0 && (
          <>
            <div className="border-t border-gray-700 mt-3 pt-3">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Para saldar</div>
              {transfers.map((t, i) => (
                <div key={i} className="text-sm py-1">
                  <span className="text-red-400">{t.from.name}</span>
                  {' → '}
                  <span className="text-green-400">{t.to.name}</span>
                  {': '}
                  <span className="font-mono font-semibold text-yellow-400">
                    ${t.amountUSD.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="text-center text-xs text-gray-600">
        autovaca · {new Date().toLocaleDateString('es-CL')}
      </div>
    </div>
  )
}
