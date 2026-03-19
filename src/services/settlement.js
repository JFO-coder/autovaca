/**
 * Settlement Algorithm
 *
 * Computes net balances for each participant across all transactions,
 * then calculates the minimum number of transfers to zero everyone out.
 *
 * Net balance = totalPaid - totalOwed
 *   Positive = others owe you
 *   Negative = you owe others
 *   Sum of all balances must equal 0 (invariant)
 */

/**
 * Compute net balance per participant from a list of transactions.
 * @param {Array} transactions - array of transaction objects from Firestore
 * @param {Array} participants - array of participant objects { id, name }
 * @returns {Array} [{ participantId, name, netUSD }] sorted by netUSD desc
 */
export function computeBalances(transactions, participants) {
  const balances = {}

  // Initialize all participants to 0
  participants.forEach(p => {
    balances[p.id] = { participantId: p.id, name: p.name, paid: 0, owed: 0, netUSD: 0 }
  })

  transactions.forEach(txn => {
    // What payer paid (in USD)
    if (balances[txn.paidBy]) {
      balances[txn.paidBy].paid += txn.amountUSD
    }

    // What each beneficiary owes
    txn.splits.forEach(split => {
      if (balances[split.participantId]) {
        balances[split.participantId].owed += split.amountUSD
      }
    })
  })

  // Compute net
  Object.values(balances).forEach(b => {
    b.netUSD = round2(b.paid - b.owed)
    b.paid = round2(b.paid)
    b.owed = round2(b.owed)
  })

  // Invariant check: sum should be ~0
  const sum = Object.values(balances).reduce((s, b) => s + b.netUSD, 0)
  if (Math.abs(sum) > 0.01) {
    console.warn(`Settlement invariant violated: sum of balances = ${sum} (should be 0)`)
  }

  return Object.values(balances).sort((a, b) => b.netUSD - a.netUSD)
}

/**
 * Compute minimum transfers to settle all debts.
 * Uses greedy algorithm: match largest creditor with largest debtor.
 *
 * @param {Array} balances - output of computeBalances()
 * @returns {Array} [{ from: { id, name }, to: { id, name }, amountUSD }]
 */
export function computeMinimumTransfers(balances) {
  const transfers = []

  // Split into creditors (positive) and debtors (negative)
  let creditors = balances
    .filter(b => b.netUSD > 0.005)
    .map(b => ({ ...b, remaining: b.netUSD }))
    .sort((a, b) => b.remaining - a.remaining)

  let debtors = balances
    .filter(b => b.netUSD < -0.005)
    .map(b => ({ ...b, remaining: Math.abs(b.netUSD) }))
    .sort((a, b) => b.remaining - a.remaining)

  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0]
    const debtor = debtors[0]
    const amount = round2(Math.min(creditor.remaining, debtor.remaining))

    if (amount > 0.005) {
      transfers.push({
        from: { id: debtor.participantId, name: debtor.name },
        to: { id: creditor.participantId, name: creditor.name },
        amountUSD: amount
      })
    }

    creditor.remaining = round2(creditor.remaining - amount)
    debtor.remaining = round2(debtor.remaining - amount)

    if (creditor.remaining < 0.005) creditors.shift()
    if (debtor.remaining < 0.005) debtors.shift()
  }

  return transfers
}

/**
 * Compute pairwise matrix: how much did each person effectively give/receive to/from each other.
 * Useful for the legacy "Saldo de cuentas" view.
 *
 * @param {Array} transactions
 * @param {Array} participants
 * @returns {Object} { matrix: { [payerId]: { [beneficiaryId]: amountUSD } } }
 */
export function computePairwiseMatrix(transactions, participants) {
  const matrix = {}

  participants.forEach(p => {
    matrix[p.id] = {}
    participants.forEach(q => {
      if (p.id !== q.id) matrix[p.id][q.id] = 0
    })
  })

  transactions.forEach(txn => {
    txn.splits.forEach(split => {
      if (split.participantId !== txn.paidBy && matrix[txn.paidBy]) {
        matrix[txn.paidBy][split.participantId] = round2(
          (matrix[txn.paidBy][split.participantId] || 0) + split.amountUSD
        )
      }
    })
  })

  return matrix
}

function round2(n) {
  return Math.round(n * 100) / 100
}
