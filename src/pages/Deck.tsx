import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Link,
  TextField,
  Typography,
} from '@mui/material'
import { decodeTokenPayload } from '../utils/crypto'
import AddResultModal from '../components/AddResultModal'
import manaW from '../assets/mana-W.svg'
import manaU from '../assets/mana-U.svg'
import manaB from '../assets/mana-B.svg'
import manaR from '../assets/mana-R.svg'
import manaG from '../assets/mana-G.svg'
import manaC from '../assets/mana-C.svg'

const MANA_ICONS: Record<string, string> = { W: manaW, U: manaU, B: manaB, R: manaR, G: manaG, C: manaC }

interface Archetype {
  id: number
  name: string
  format: string
  colors: string
}

interface UserDeck {
  id: number
  user: number
  archetype: Archetype
  name: string | null
  decklist: string | null
  decklist_link: string | null
  num_matches: number
  last_played: string
}

function formatLastPlayed(iso: string) {
  const date = new Date(iso)
  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .format(date).toLowerCase()
  const tz = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
    .formatToParts(date).find(p => p.type === 'timeZoneName')?.value ?? ''
  const dateStr = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
  return `${time} ${tz} ${dateStr}`
}

export default function Deck() {
  const { deckId } = useParams()
  const token = sessionStorage.getItem('token')
  const currentUserId = token ? (decodeTokenPayload(token) as { user_id: number }).user_id : null

  const [deck, setDeck] = useState<UserDeck | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDecklist, setEditDecklist] = useState('')
  const [editDecklistLink, setEditDecklistLink] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [resultModalOpen, setResultModalOpen] = useState(false)

  useEffect(() => {
    if (!deckId) return
    setLoading(true)
    fetch(`${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/user-decks/detail/${deckId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Deck not found.')
        return res.json() as Promise<UserDeck>
      })
      .then(setDeck)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [deckId, token])

  function startEditing() {
    if (!deck) return
    setEditName(deck.name ?? '')
    setEditDecklist(deck.decklist ?? '')
    setEditDecklistLink(deck.decklist_link ?? '')
    setSaveError('')
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setSaveError('')
  }

  async function handleSave() {
    setSaveError('')
    setSaving(true)

    const hasDecklist = editDecklist.trim() !== ''
    const hasDecklistLink = editDecklistLink.trim() !== ''
    if (hasDecklist === hasDecklistLink) {
      setSaveError('Enter either a decklist or a decklist link, not both.')
      setSaving(false)
      return
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/user-decks/detail/${deckId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editName.trim() || null,
          decklist: hasDecklist ? editDecklist : null,
          decklist_link: hasDecklistLink ? editDecklistLink : null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setSaveError(data.detail ?? JSON.stringify(data))
        return
      }
      const updated = await res.json() as UserDeck
      setDeck(updated)
      setEditing(false)
    } catch {
      setSaveError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const isOwner = deck !== null && currentUserId !== null && deck.user === currentUserId

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', px: 2, py: 8 }}>
      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}

      {deck && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {deck.archetype.colors.split('').map((c, i) =>
                MANA_ICONS[c] ? <img key={i} src={MANA_ICONS[c]} alt={c} width={28} height={28} /> : null
              )}
              <Box>
                <Typography variant="h4" component="h1">
                  {deck.name ?? deck.archetype.name}
                </Typography>
                {deck.name && (
                  <Typography variant="body2" color="text.secondary">{deck.archetype.name}</Typography>
                )}
              </Box>
            </Box>
            {isOwner && !editing && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={() => setResultModalOpen(true)}>Add Result</Button>
                <Button variant="outlined" onClick={startEditing}>Edit</Button>
              </Box>
            )}
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {deck.archetype.format} · {deck.num_matches} match{deck.num_matches !== 1 ? 'es' : ''} · Last played {formatLastPlayed(deck.last_played)}
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {editing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Name (optional)"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                slotProps={{ htmlInput: { maxLength: 255 } }}
              />
              <TextField
                label="Decklist"
                multiline
                rows={8}
                value={editDecklist}
                onChange={e => setEditDecklist(e.target.value)}
                disabled={editDecklistLink.trim() !== ''}
                helperText={editDecklistLink.trim() ? 'Clear the decklist link to enter a decklist' : ''}
              />
              <TextField
                label="Decklist Link"
                value={editDecklistLink}
                onChange={e => setEditDecklistLink(e.target.value)}
                disabled={editDecklist.trim() !== ''}
                helperText={editDecklist.trim() ? 'Clear the decklist to enter a link instead' : ''}
              />
              {saveError && <Typography color="error" variant="body2">{saveError}</Typography>}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={handleSave} disabled={saving}>
                  {saving ? <CircularProgress size={20} /> : 'Save'}
                </Button>
                <Button onClick={cancelEditing} disabled={saving}>Cancel</Button>
              </Box>
            </Box>
          ) : (
            <>
              {deck.decklist_link && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>Decklist Link</Typography>
                  <Link href={deck.decklist_link} target="_blank" rel="noopener noreferrer">
                    {deck.decklist_link}
                  </Link>
                </Box>
              )}
              {deck.decklist && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Decklist</Typography>
                  <Box
                    component="pre"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: 14,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                      p: 2,
                      m: 0,
                    }}
                  >
                    {deck.decklist}
                  </Box>
                </Box>
              )}
            </>
          )}

          <AddResultModal
            open={resultModalOpen}
            onClose={() => setResultModalOpen(false)}
            onSuccess={() => setDeck(prev => prev ? { ...prev, num_matches: prev.num_matches + 1 } : prev)}
            deck={deck}
            token={token}
            currentUserId={currentUserId}
          />
        </>
      )}
    </Box>
  )
}
