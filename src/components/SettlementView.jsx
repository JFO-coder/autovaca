import { useMemo } from 'react'
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'
import { computeBalances, computeMinimumTransfers } from '../services/settlement'

export default function SettlementView({ transactions, participants }) {
  const balances = useMemo(
    () => computeBalances(transactions || [], participants || []),
    [transactions, participants]
  )

  const transfers = useMemo(
    () => computeMinimumTransfers(balances),
    [balances]
  )

  if (!participants?.length) return null

  return (
    <div className="space-y-6">
      {/* Net Balances */}
      <div className="card">
        <h2 className="text-lg font-semibold text-primary-400 mb-4">Balances</h2>
        <div className="space-y-3">
          {balances.map(b => (
            <div key={b.participantId} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {b.netUSD >= 0
                  ? <TrendingUp className="h-4 w-4 text-green-400" />
                  : <TrendingDown className="h-4 w-4 text-red-400" />
                }
                <span className="font-medium">{b.name}</span>
              </div>
              <div className="text-right">
                <span className={`font-mono font-semibold ${
                  b.netUSD >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {b.netUSD >= 0 ? '+' : ''}{b.netUSD.toFixed(2)} USD
                </span>
                <div className="text-xs text-gray-500">
                  paid {b.paid.toFixed(2)} · owed {b.owed.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Minimum Transfers to Settle */}
      {transfers.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-primary-400 mb-4">To Settle</h2>
          <div className="space-y-3">
            {transfers.map((t, i) => (
              <div key={i}
                className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
                <span className="text-red-400 font-medium">{t.from.name}</span>
                <ArrowRight className="h-4 w-4 text-gray-500" />
                <span className="text-green-400 font-medium">{t.to.name}</span>
                <span className="ml-auto font-mono font-semibold text-yellow-400">
                  ${t.amountUSD.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {transfers.length === 0 && transactions?.length > 0 && (
        <div className="card text-center text-gray-500 py-8">
          All settled up!
        </div>
      )}
    </div>
  )
}
