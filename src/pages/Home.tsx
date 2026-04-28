import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  Pagination,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import { decodeTokenPayload } from '../utils/crypto'
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
  archetype: Archetype
  decklist: string | null
  decklist_link: string | null
  num_matches: number
  last_played: string
}

interface FormatOption {
  id: number
  name: string
}

interface AddDeckForm {
  format: string
  archetype: string
  decklist: string
  decklist_link: string
}

const EMPTY_FORM: AddDeckForm = { format: '', archetype: '', decklist: '', decklist_link: '' }

function formatLastPlayed(iso: string) {
  const date = new Date(iso)
  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .format(date).toLowerCase()
  const tz = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
    .formatToParts(date).find(p => p.type === 'timeZoneName')?.value ?? ''
  const dateStr = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
  return `${time} ${tz} ${dateStr}`
}

function ColorIcons({ colors }: { colors: string }) {
  if (!colors) return null
  return (
    <Box component="span" sx={{ display: 'inline-flex', gap: 0.25, verticalAlign: 'middle', mr: 0.5 }}>
      {colors.split('').map((c, i) =>
        MANA_ICONS[c] ? <img key={i} src={MANA_ICONS[c]} alt={c} width={16} height={16} /> : null
      )}
    </Box>
  )
}

export default function Home() {
  const token = sessionStorage.getItem('token')
  const name = sessionStorage.getItem('name')

  const [decks, setDecks] = useState<UserDeck[]>([])
  const [decksLoading, setDecksLoading] = useState(false)
  const [decksError, setDecksError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 10

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<AddDeckForm>(EMPTY_FORM)
  const [formats, setFormats] = useState<FormatOption[]>([])
  const [formatsLoading, setFormatsLoading] = useState(false)
  const [archetypes, setArchetypes] = useState<Archetype[]>([])
  const [archetypesLoading, setArchetypesLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  function fetchDecks(p = page) {
    if (!token) return
    const { user_id } = decodeTokenPayload(token) as { user_id: number }
    setDecksLoading(true)
    fetch(`${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/user-decks/${user_id}/?limit=${LIMIT}&page=${p}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load decks.')
        return res.json()
      })
      .then(data => { setDecks(data.results); setTotal(data.total) })
      .catch(err => setDecksError(err.message))
      .finally(() => setDecksLoading(false))
  }

  useEffect(() => fetchDecks(1), [token])

  async function openModal() {
    setForm(EMPTY_FORM)
    setArchetypes([])
    setSaveError('')
    setModalOpen(true)
    setFormatsLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/formats/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setFormats(await res.json())
    } finally {
      setFormatsLoading(false)
    }
  }

  async function handleFormatChange(formatName: string) {
    setForm(prev => ({ ...prev, format: formatName, archetype: '' }))
    setArchetypes([])
    if (!formatName) return
    setArchetypesLoading(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/archetypes/?format-name=${encodeURIComponent(formatName)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setArchetypes(await res.json())
    } finally {
      setArchetypesLoading(false)
    }
  }

  async function handleSave() {
    setSaveError('')
    setSaving(true)
    const { user_id } = decodeTokenPayload(token!) as { user_id: number }
    try {
      const res = await fetch(`${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/user-decks/create-user-deck/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user: user_id,
          archetype: Number(form.archetype),
          decklist: form.decklist || null,
          decklist_link: form.decklist_link || null,
        }),
      })
      if (res.status === 201) {
        setModalOpen(false)
        setPage(1)
        fetchDecks(1)
        return
      }
      const data = await res.json()
      setSaveError(data.detail ?? JSON.stringify(data))
    } catch {
      setSaveError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const hasDecklist = form.decklist.trim() !== ''
  const hasDecklistLink = form.decklist_link.trim() !== ''
  const decklistValid = hasDecklist !== hasDecklistLink // exactly one must be filled
  const formComplete = form.format !== '' && form.archetype !== '' && decklistValid

  if (token) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, py: 8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h3" component="h1">
            Welcome {name}
          </Typography>
          <Button variant="contained" onClick={openModal}>
            Add Deck
          </Button>
        </Box>

        {decksLoading && <CircularProgress />}

        {decksError && <Typography color="error">{decksError}</Typography>}

        {!decksLoading && !decksError && decks.length === 0 && (
          <Typography color="text.secondary">No decks yet.</Typography>
        )}

        {decks.map(deck => (
          <Box
            key={deck.id}
            sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
          >
            <Typography sx={{ fontWeight: 600 }}>
              <ColorIcons colors={deck.archetype.colors} />
              {deck.archetype.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {deck.archetype.format} · {deck.num_matches} match{deck.num_matches !== 1 ? 'es' : ''} · Last played {formatLastPlayed(deck.last_played)}
            </Typography>
          </Box>
        ))}

        {total > LIMIT && (
          <Pagination
            count={Math.ceil(total / LIMIT)}
            page={page}
            onChange={(_, p) => { setPage(p); fetchDecks(p) }}
            sx={{ mt: 3 }}
          />
        )}

        <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Add Deck</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            <TextField
              select
              label="Format"
              value={form.format}
              onChange={e => handleFormatChange(e.target.value)}
              disabled={formatsLoading}
            >
              {formatsLoading ? (
                <MenuItem disabled><CircularProgress size={16} /></MenuItem>
              ) : (
                formats.map(f => <MenuItem key={f.id} value={f.name}>{f.name}</MenuItem>)
              )}
            </TextField>

            <TextField
              select
              label="Archetype"
              value={form.archetype}
              onChange={e => setForm(prev => ({ ...prev, archetype: e.target.value }))}
              disabled={!form.format || archetypesLoading}
            >
              {archetypesLoading ? (
                <MenuItem disabled><CircularProgress size={16} /></MenuItem>
              ) : archetypes.length === 0 ? (
                <MenuItem disabled>No archetypes for this format</MenuItem>
              ) : (
                archetypes.map(a => (
                  <MenuItem key={a.id} value={String(a.id)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ColorIcons colors={a.colors} />
                      {a.name}
                    </Box>
                  </MenuItem>
                ))
              )}
            </TextField>

            <TextField
              label="Decklist"
              multiline
              rows={5}
              value={form.decklist}
              onChange={e => setForm(prev => ({ ...prev, decklist: e.target.value }))}
              disabled={hasDecklistLink}
              helperText={hasDecklistLink ? 'Clear the decklist link to enter a decklist' : ''}
            />

            <TextField
              label="Decklist Link"
              value={form.decklist_link}
              onChange={e => setForm(prev => ({ ...prev, decklist_link: e.target.value }))}
              disabled={hasDecklist}
              helperText={hasDecklist ? 'Clear the decklist to enter a link instead' : ''}
            />

            {saveError && <Typography color="error" variant="body2">{saveError}</Typography>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving || !formComplete}>
              {saving ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    )
  }

  return (
    <Box sx={{ textAlign: 'center', px: 2, py: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        MTG Deck Profile
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Build and share your Magic: The Gathering deck profiles.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button variant="contained" component={Link} to="/sign-up">Get Started</Button>
        <Button variant="outlined" component={Link} to="/login">Log In</Button>
      </Box>
    </Box>
  )
}
