import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
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
  colors: string
}

interface FormatOption {
  id: number
  name: string
}

interface AddDeckForm {
  name: string
  format: string
  archetype: string
  decklist: string
  decklist_link: string
}

const EMPTY_FORM: AddDeckForm = { name: '', format: '', archetype: '', decklist: '', decklist_link: '' }

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

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  token: string | null
  userId: number
}

export default function AddDeckModal({ open, onClose, onSuccess, token, userId }: Props) {
  const [form, setForm] = useState<AddDeckForm>(EMPTY_FORM)
  const [formats, setFormats] = useState<FormatOption[]>([])
  const [formatsLoading, setFormatsLoading] = useState(false)
  const [archetypes, setArchetypes] = useState<Archetype[]>([])
  const [archetypesLoading, setArchetypesLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(EMPTY_FORM)
    setArchetypes([])
    setError('')
    setFormatsLoading(true)
    fetch(`${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/formats/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setFormats)
      .finally(() => setFormatsLoading(false))
  }, [open])

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
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/user-decks/create-user-deck/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user: userId,
          archetype: Number(form.archetype),
          name: form.name || null,
          decklist: form.decklist || null,
          decklist_link: form.decklist_link || null,
        }),
      })
      if (res.status === 201) {
        onSuccess()
        onClose()
        return
      }
      const data = await res.json()
      setError(data.detail ?? JSON.stringify(data))
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const hasDecklist = form.decklist.trim() !== ''
  const hasDecklistLink = form.decklist_link.trim() !== ''
  const formComplete = form.format !== '' && form.archetype !== '' && (hasDecklist !== hasDecklistLink)

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Deck</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <TextField
          label="Name (optional)"
          value={form.name}
          onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
          slotProps={{ htmlInput: { maxLength: 255 } }}
        />
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

        {error && <Typography color="error" variant="body2">{error}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !formComplete}>
          {saving ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
