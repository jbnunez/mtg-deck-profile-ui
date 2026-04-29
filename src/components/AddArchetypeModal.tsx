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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import manaW from '../assets/mana-W.svg'
import manaU from '../assets/mana-U.svg'
import manaB from '../assets/mana-B.svg'
import manaR from '../assets/mana-R.svg'
import manaG from '../assets/mana-G.svg'
import manaC from '../assets/mana-C.svg'

const COLOR_OPTIONS = [
  { value: 'W', icon: manaW },
  { value: 'U', icon: manaU },
  { value: 'B', icon: manaB },
  { value: 'R', icon: manaR },
  { value: 'G', icon: manaG },
  { value: 'C', icon: manaC },
]

interface ArchetypeForm {
  name: string
  format: string
  colors: string[]
}

interface FormatOption {
  id: number
  name: string
}

const EMPTY_FORM: ArchetypeForm = { name: '', format: '', colors: [] }

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  token: string | null
}

export default function AddArchetypeModal({ open, onClose, onSuccess, token }: Props) {
  const [form, setForm] = useState<ArchetypeForm>(EMPTY_FORM)
  const [formats, setFormats] = useState<FormatOption[]>([])
  const [formatsLoading, setFormatsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(EMPTY_FORM)
    setError('')
    setFormatsLoading(true)
    fetch(`${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/formats/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setFormats)
      .catch(() => setError('Failed to load formats.'))
      .finally(() => setFormatsLoading(false))
  }, [open])

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/archetypes/add-deck-archetype/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, colors: form.colors.join('') }),
      })
      if (res.status === 201) { onSuccess(); onClose(); return }
      const data = await res.json()
      setError(data.detail ?? JSON.stringify(data))
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const formComplete = form.name.trim() !== '' && form.format !== '' && form.colors.length > 0

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add Deck Archetype</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <TextField
          label="Name"
          value={form.name}
          onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
          slotProps={{ htmlInput: { maxLength: 255 } }}
        />
        <TextField
          select
          label="Format"
          value={form.format}
          onChange={e => setForm(prev => ({ ...prev, format: e.target.value }))}
          disabled={formatsLoading}
        >
          {formatsLoading ? (
            <MenuItem disabled><CircularProgress size={16} /></MenuItem>
          ) : (
            formats.map(f => <MenuItem key={f.id} value={f.name}>{f.name}</MenuItem>)
          )}
        </TextField>
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>Colors</Typography>
          <ToggleButtonGroup
            value={form.colors}
            onChange={(_, newColors) => setForm(prev => ({ ...prev, colors: newColors }))}
          >
            {COLOR_OPTIONS.map(({ value, icon }) => (
              <ToggleButton key={value} value={value} sx={{ p: 0.5, '&.Mui-selected': { backgroundColor: 'rgba(0,0,0,0.2)' } }}>
                <img src={icon} alt={value} width={32} height={32} />
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
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
