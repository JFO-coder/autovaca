import { useState, useEffect } from 'react'
import { DollarSign, RefreshCw } from 'lucide-react'
import { getFxRates, convertToUSD } from '../services/fxRates'
import { addTransaction } from '../services/firestore'

const CURRENCIES = [
  { code: 'USD', label: 'USD', symbol: '$' },
  { code: 'ARS', label: 'AR$', symbol: '$' },
  { code: 'CLP', label: 'CLP', symbol: '$' }
]

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'tarjeta_mama', label: 'Tarjeta Mamá' },
  { value: 'viaje', label: 'Viaje' },
  { value: 'goodwinds', label: 'Goodwinds' }
]

export default function TransactionForm({ group, onTransactionAdded }) {
  const [concept, setConcept] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [paidBy, setPaidBy] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [category, setCategory] = useState('general')
  const [notes, setNotes] = useState('')
  const [splitType, setSplitType] = useState('equal')
  const [selectedParticipants, setSelectedParticipants] = useState([])
  const [customSplits, setCustomSplits] = useState({})
  const [fxRates, setFxRates] = useState(null)
  const [loadingRates, setLoadingRates] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [convertedUSD, setConvertedUSD] = useState(null)
  useEffect(() => { if (group?.participants) { setSelectedParticipants(group.participants.map(p => p.id)); if (!paidBy && group.participants.length > 0) setPaidBy(group.participants[0].id) } }, [group])
  useEffect(() => { if (currency !== 'USD') refreshRates(); else setConvertedUSD(amount ? parseFloat(amount) : null) }, [currency])
  useEffect(() => { if (!amount || !fxRates) { setConvertedUSD(null); return } try { const { amountUSD } = convertToUSD(parseFloat(amount), currency, fxRates); setConvertedUSD(amountUSD) } catch { setConvertedUSD(null) } }, [amount, currency, fxRates])
  async function refreshRates() { setLoadingRates(true); try { setFxRates(await getFxRates(true)) } catch (e) { console.error(e) } finally { setLoadingRates(false) } }
  function toggleParticipant(id) { setSelectedParticipants(p => p.includes(id) ? p.filter(x => x!==id) : [...p,id]) }
  function handleCustomSplitChange(id, v) { setCustomSplits(p => ({...p, [id]: parseFloat(v)||0})) }
  async function handleSubmit(e) { e.preventDefault(); if (!concept||!amount||!paidBy||!group) return; setSubmitting(true); try { const n=parseFloat(amount); const{amountUSD,fxRate,fxSource}=convertToUSD(n,currency,fxRates||{}); let s=[]; if(splitType==='equal'){const pp=Math.round((amountUSD/selectedParticipants.length)*100)/100; s=selectedParticipants.map((id,i)=>({participantId:id,amountUSD:i===selectedParticipants.length-1?Math.round((amountUSD-pp*(selectedParticipants.length-1))*100)/100:pp}))}else{s=Object.entries(customSplits).filter(([,v])=>v>0).map(([id,v])=>({participantId:id,amountUSD:v}))} const t={date:new Date(date),concept,paidBy,totalAmount:n,originalCurrency:currency,fxRate,fxSource,amountUSD,splitType,splits:s,category,notes}; await addTransaction(group.id,t); setConcept('');setAmount('');setNotes('');setSplitType('equal');setCustomSplits({}); if(onTransactionAdded) onTransactionAdded(t) } catch(err){console.error(err);alert('Error: '+err.message)}finally{setSubmitting(false)} }
  if(!group) return null
  return(<form onSubmit={handleSubmit} className='card space-y-4'><h2 className='text-lg font-semibold text-primary-400'>New Transaction</h2><div className='grid grid-cols-3 gap-3'><div className='col-span-2'><label className='label'>Concept</label><input type='text' className='input-field' value={concept} onChange={e=>setConcept(e.target.value)} placeholder='TC resumen pagado en Mar26' required/></div><div><label className='label'>Date</label><input type='date' className='input-field' value={date} onChange={e=>setDate(e.target.value)}/></div></div><div><label className='label'>Who paid</label><select className='input-field' value={paidBy} onChange={e=>setPaidBy(e.target.value)}>{group.participants.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select></div><div className='grid grid-cols-3 gap-3'><div className='col-span-2'><label className='label'>Amount</label><div className='relative'><DollarSign className='absolute left-3 top-2.5 h-4 w-4 text-gray-500'/><input type='number' step='0.01' className='input-field pl-9' value={amount} onChange={e=>setAmount(e.target.value)} placeholder='0.00' required/></div></div><div><label className='label'>Currency</label><select className='input-field' value={currency} onChange={e=>setCurrency(e.target.value)}>{CURRENCIES.map(c=>(<option key={c.code} value={c.code}>{c.label}</option>))}</select></div></div>{currency!=='USD'&&(<div className='flex items-center gap-2 text-sm text-gray-400 bg-gray-800/50 rounded-lg p-3'><button type='button' onClick={refreshRates} disabled={loadingRates} className='text-primary-400 hover:text-primary-300'><RefreshCw className={`h-4 w-4 ${loadingRates?'animate-spin':''}`}/></button>{fxRates&&currency==='ARS'&&<span>Blue: {fxRates.arsBlueVenta} ARS/USD</span>}{fxRates&&currency==='CLP'&&<span>Rate: {fxRates.clpPerUSD} CLP/USD</span>}{convertedUSD!==null&&<span className='ml-auto font-medium text-green-400'>= USD {convertedUSD.toFixed(2)}</span>}</div>)}<div><label className='label'>Category</label><select className='input-field' value={category} onChange={e=>setCategory(e.target.value)}>{CATEGORIES.map(c=>(<option key={c.value} value={c.value}>{c.label}</option>))}</select></div><div><label className='label'>Split</label><div className='flex gap-2 mb-3'><button type='button' className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${splitType==='equal'?'bg-primary-600 text-white':'bg-gray-800 text-gray-400 hover:bg-gray-700'}`} onClick={()=>setSplitType('equal')}>Equal</button><button type='button' className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${splitType==='custom'?'bg-primary-600 text-white':'bg-gray-800 text-gray-400 hover:bg-gray-700'}`} onClick={()=>setSplitType('custom')}>Custom</button></div>{splitType==='equal'?(<div className='flex flex-wrap gap-2'>{group.participants.map(p=>(<button key={p.id} type='button' className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedParticipants.includes(p.id)?'bg-primary-700 text-white':'bg-gray-800 text-gray-500'}`} onClick={()=>toggleParticipant(p.id)}>{p.name}</button>))}{convertedUSD&&selectedParticipants.length>0&&<span className='text-xs text-gray-500 self-center ml-2'>({(convertedUSD/selectedParticipants.length).toFixed(2)} USD each)</span>}</div>):(<div className='space-y-2'>{group.participants.map(p=>(<div key={p.id} className='flex items-center gap-3'><span className='text-sm text-gray-400 w-24'>{p.name}</span><input type='number' step='0.01' className='input-field w-32' placeholder='0.00 USD' value={customSplits[p.id]||''} onChange={e=>handleCustomSplitChange(p.id,e.target.value)}/></div>))}</div>)}</div><div><label className='label'>Notes (optional)</label><input type='text' className='input-field' value={notes} onChange={e=>setNotes(e.target.value)} placeholder='Additional context...'/></div><button type='submit' className='btn-primary w-full' disabled={submitting}>{submitting?'Saving...':'Add Transaction'}</button></form>)
}
