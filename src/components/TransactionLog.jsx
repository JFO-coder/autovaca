import { useState, useMemo } from 'react'
import { Search, Trash2, Undo2, Download, FileText, X, AlertTriangle } from 'lucide-react'

export default function TransactionLog({ transactions, participants, groupId, onTransactionDeleted }) {
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [deleteConfirm, setDeleteConfirm] = useState(null) // txn to confirm delete
  const [deletedStack, setDeletedStack] = useState([]) // undo stack for current session
  const [undoToast, setUndoToast] = useState(null)

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

  async function handleDelete(txn) {
    try {
      const { deleteTransaction } = await import('../services/firestore')
      await deleteTransaction(groupId, txn.id, {
        concept: txn.concept,
        amountUSD: txn.amountUSD,
        paidBy: txn.paidBy
      })
      // Push to undo stack
      setDeletedStack(prev => [...prev, txn])
      setDeleteConfirm(null)
      // Show undo toast
      setUndoToast(txn)
      setTimeout(() => setUndoToast(null), 8000)
      // Notify parent to refresh
      if (onTransactionDeleted) onTransactionDeleted(txn)
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Error al eliminar: ' + err.message)
    }
  }

  async function handleUndo() {
    if (deletedStack.length === 0) return
    const lastDeleted = deletedStack[deletedStack.length - 1]
    try {
      const { addTransaction } = await import('../services/firestore')
      // Re-add the transaction (without the id, Firestore will generate a new one)
      const { id, ...txnData } = lastDeleted
      await addTransaction(groupId, txnData)
      setDeletedStack(prev => prev.slice(0, -1))
      setUndoToast(null)
      if (onTransactionDeleted) onTransactionDeleted(null) // refresh
    } catch (err) {
      console.error('Undo failed:', err)
      alert('Error al deshacer: ' + err.message)
    }
  }

  async function handleExportAuditLog() {
    try {
      const { getAuditLog } = await import('../services/firestore')
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs')
      const logs = await getAuditLog(groupId)

      if (logs.length === 0) {
        alert('No hay entradas en el audit log.')
        return
      }

      const rows = logs.map(entry => ({
        Timestamp: entry.timestamp instanceof Date
          ? entry.timestamp.toISOString()
          : String(entry.timestamp || ''),
        Action: entry.action || '',
        'Performed By': entry.performedBy || '',
        'Transaction ID': entry.details?.transactionId || '',
        Concept: entry.details?.concept || '',
        'Amount USD': entry.details?.amountUSD != null ? Number(entry.details.amountUSD).toFixed(2) : '',
        'Paid By': entry.details?.paidBy || ''
      }))

      // XLSX
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Audit Log')
      const colWidths = Object.keys(rows[0]).map(key => ({
        wch: Math.max(key.length, ...rows.map(r => String(r[key] || '').length)) + 2
      }))
      ws['!cols'] = colWidths
      XLSX.writeFile(wb, `audit_log_${new Date().toISOString().slice(0, 10)}.xlsx`)

      // CSV
      const csvHeader = Object.keys(rows[0]).join(',')
      const csvRows = rows.map(r =>
        Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      )
      const csvContent = [csvHeader, ...csvRows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (err) {
      console.error('Audit log export failed:', err)
      alert('Error exportando audit log: ' + err.message)
    }
  }

  async function handleExportExcel() {
    // Dynamic import SheetJS
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs')

    const rows = (transactions || []).map(txn => ({
      Fecha: formatDate(txn.date),
      Concepto: txn.concept,
      'Pagó': participantMap[txn.paidBy] || txn.paidBy,
      'Monto USD': txn.amountUSD?.toFixed(2),
      'Moneda Original': txn.originalCurrency,
      'Monto Original': txn.totalAmount?.toFixed(2),
      'Tipo FX': txn.fxSource,
      'Tipo Split': txn.splitType,
      Categoría: txn.category,
      Participantes: (txn.splits || []).map(s =>
        `${participantMap[s.participantId] || s.participantId}: $${s.amountUSD?.toFixed(2)}`
      ).join(', '),
      Notas: txn.notes || '',
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Transacciones')

    // Auto-size columns
    const colWidths = Object.keys(rows[0] || {}).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String(r[key] || '').length)) + 2
    }))
    ws['!cols'] = colWidths

    XLSX.writeFile(wb, `autovaca_transacciones_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-lg font-semibold text-emerald-400">Transactions</h2>
        <div className="flex items-center gap-3">
          {deletedStack.length > 0 && (
            <button
              onClick={handleUndo}
              className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
              title="Deshacer última eliminación"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Undo ({deletedStack.length})
            </button>
          )}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
            title="Exportar a Excel"
          >
            <Download className="h-3.5 w-3.5" />
            Excel
          </button>
          <button
            onClick={handleExportAuditLog}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
            title="Exportar Audit Log (xlsx + csv)"
          >
            <FileText className="h-3.5 w-3.5" />
            Audit Log
          </button>
          <span className="text-sm text-gray-500">{filtered.length} entries</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 w-full sm:w-40 focus:outline-none focus:border-emerald-500"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          {categories.map(c => (
            <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
          ))}
        </select>
      </div>

      {/* Undo toast */}
      {undoToast && (
        <div className="flex items-center justify-between bg-yellow-900/30 border border-yellow-700/50 rounded-lg px-4 py-2 mb-4">
          <span className="text-sm text-yellow-300">
            Eliminado: "{undoToast.concept}"
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              className="text-sm font-medium text-yellow-400 hover:text-yellow-200 underline"
            >
              Deshacer
            </button>
            <button onClick={() => setUndoToast(null)} className="text-yellow-600 hover:text-yellow-400">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filtered.map(txn => (
          <div key={txn.id}
            className="group flex items-center justify-between bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{txn.concept}</span>
                {txn.category && txn.category !== 'general' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                    {txn.category}
                  </span>
                )}
                {txn.migrated && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-500">
                    migrated
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
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="font-mono font-semibold text-sm">
                  ${txn.amountUSD?.toFixed(2)}
                </span>
                <div className="text-xs text-gray-500">
                  {txn.splitType === 'equal' ? `÷${txn.splits?.length}` : 'custom'}
                </div>
              </div>
              {/* Delete button - visible on hover */}
              <button
                onClick={() => setDeleteConfirm(txn)}
                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1"
                title="Eliminar transacción"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No transactions found
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-900/30 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">¿Eliminar transacción?</h3>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
              <p className="font-medium text-sm text-gray-200">{deleteConfirm.concept}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(deleteConfirm.date)} · {participantMap[deleteConfirm.paidBy]} · ${deleteConfirm.amountUSD?.toFixed(2)}
              </p>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Esta acción se puede deshacer durante esta sesión con el botón "Undo".
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
