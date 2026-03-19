import { useState, useEffect } from 'react'
import { Users, Plus, Archive } from 'lucide-react'
import { getGroups, createGroup } from '../services/firestore'

export default function Dashboard({ onSelectGroup, activeGroup }) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupType, setNewGroupType] = useState('trip')
  const [newParticipants, setNewParticipants] = useState('')

  useEffect(() => {
    loadGroups()
  }, [])

  async function loadGroups() {
    setLoading(true)
    try {
      const data = await getGroups()
      setGroups(data)
      if (!activeGroup && data.length > 0) {
        onSelectGroup(data[0])
      }
    } catch (err) {
      console.error('Failed to load groups:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateGroup(e) {
    e.preventDefault()
    if (!newGroupName || !newParticipants) return
    const participants = newParticipants.split(',').map((name, i) => ({
      id: `p${Date.now()}_${i}`,
      name: name.trim(),
      nickname: '',
      email: ''
    }))
    try {
      await createGroup({ name: newGroupName, type: newGroupType, participants, baseCurrency: 'USD' })
      setShowNewGroup(false)
      setNewGroupName('')
      setNewParticipants('')
      loadGroups()
    } catch (err) {
      console.error('Failed to create group:', err)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary-400">Groups</h2>
        <button onClick={() => setShowNewGroup(!showNewGroup)} className="text-primary-400 hover:text-primary-300 p-1">
          <Plus className="h-5 w-5" />
        </button>
      </div>
      {showNewGroup && (
        <form onSubmit={handleCreateGroup} className="mb-4 space-y-3 p-3 bg-gray-800/50 rounded-lg">
          <input type="text" className="input-field" placeholder="Group name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} required />
          <select className="input-field" value={newGroupType} onChange={e => setNewGroupType(e.target.value)}>
            <option value="ongoing">Ongoing</option>
            <option value="trip">Trip</option>
          </select>
          <input type="text" className="input-field" placeholder="Participants (comma-separated)" value={newParticipants} onChange={e => setNewParticipants(e.target.value)} required />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm">Create</button>
            <button type="button" className="btn-secondary text-sm" onClick={() => setShowNewGroup(false)}>Cancel</button>
          </div>
        </form>
      )}
      {loading ? (
        <div className="text-center text-gray-500 py-4">Loading...</div>
      ) : (
        <div className="space-y-2">
          {groups.map(g => (
            <button key={g.id} onClick={() => onSelectGroup(g)}
              className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${activeGroup?.id === g.id ? 'bg-primary-900/50 border border-primary-700' : 'bg-gray-800/50 hover:bg-gray-800 border border-transparent'}`}>
              {g.archived ? <Archive className="h-4 w-4 text-gray-500" /> : <Users className="h-4 w-4 text-primary-400" />}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{g.name}</div>
                <div className="text-xs text-gray-500">{g.participants?.length} participants · {g.type}</div>
              </div>
            </button>
          ))}
          {groups.length === 0 && (
            <div className="text-center text-gray-500 py-4">No groups yet. Create one to get started.</div>
          )}
        </div>
      )}
    </div>
  )
}
