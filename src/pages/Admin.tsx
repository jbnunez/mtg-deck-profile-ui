import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { decodeTokenPayload } from '../utils/crypto'
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

interface FormatForm {
  name: string
  description: string
}

const EMPTY_ARCHETYPE: ArchetypeForm = { name: '', format: '', colors: [] }
const EMPTY_FORMAT: FormatForm = { name: '', description: '' }

export default function Admin() {
  const navigate = useNavigate()
  const token = sessionStorage.getItem('token')

  const [formats, setFormats] = useState<FormatOption[]>([])
  const [formatsLoading, setFormatsLoading] = useState(false)

  const [archetypeModalOpen, setArchetypeModalOpen] = useState(false)
  const [archetypeForm, setArchetypeForm] = useState<ArchetypeForm>(EMPTY_ARCHETYPE)
  const [archetypeSaving, setArchetypeSaving] = useState(false)
  const [archetypeError, setArchetypeError] = useState('')

  const [formatModalOpen, setFormatModalOpen] = useState(false)
  const [formatForm, setFormatForm] = useState<FormatForm>(EMPTY_FORMAT)
  const [formatSaving, setFormatSaving] = useState(false)
  const [formatError, setFormatError] = useState('')

  useEffect(() => {
    if (!token) { navigate('/'); return }
    const payload = decodeTokenPayload(token) as { is_admin: boolean }
    if (!payload.is_admin) navigate('/')
  }, [token, navigate])

  if (!token) return null
  const payload = decodeTokenPayload(token) as { is_admin: boolean }
  if (!payload.is_admin) return null

  async function openArchetypeModal() {
    setArchetypeForm(EMPTY_ARCHETYPE)
    setArchetypeError('')
    setArchetypeModalOpen(true)
    setFormatsLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/formats/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setFormats(data)
    } catch {
      setArchetypeError('Failed to load formats.')
    } finally {
      setFormatsLoading(false)
    }
  }

  async function handleArchetypeSave() {
    setArchetypeError('')
    setArchetypeSaving(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/archetypes/add-deck-archetype/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...archetypeForm, colors: archetypeForm.colors.join('') }),
      })
      if (res.status === 201) { setArchetypeModalOpen(false); return }
      const data = await res.json()
      setArchetypeError(data.detail ?? JSON.stringify(data))
    } catch {
      setArchetypeError('Network error. Please try again.')
    } finally {
      setArchetypeSaving(false)
    }
  }

  function openFormatModal() {
    setFormatForm(EMPTY_FORMAT)
    setFormatError('')
    setFormatModalOpen(true)
  }

  async function handleFormatSave() {
    setFormatError('')
    setFormatSaving(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/formats/add-format/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formatForm),
      })
      if (res.status === 201) { setFormatModalOpen(false); return }
      const data = await res.json()
      setFormatError(data.detail ?? JSON.stringify(data))
    } catch {
      setFormatError('Network error. Please try again.')
    } finally {
      setFormatSaving(false)
    }
  }

  const archetypeFormComplete = archetypeForm.name.trim() !== '' && archetypeForm.format !== '' && archetypeForm.colors.length > 0

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: 2, py: 8 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        Admin
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={openArchetypeModal}>
          Add Archetype
        </Button>
        <Button variant="contained" onClick={openFormatModal}>
          Add Format
        </Button>
      </Box>

      {/* Add Archetype modal */}
      <Dialog open={archetypeModalOpen} onClose={() => setArchetypeModalOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add Deck Archetype</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Name"
            name="name"
            value={archetypeForm.name}
            onChange={e => setArchetypeForm(prev => ({ ...prev, name: e.target.value }))}
            inputProps={{ maxLength: 255 }}
          />
          <TextField
            select
            label="Format"
            value={archetypeForm.format}
            onChange={e => setArchetypeForm(prev => ({ ...prev, format: e.target.value }))}
            disabled={formatsLoading}
          >
            {formatsLoading ? (
              <MenuItem disabled><CircularProgress size={16} /></MenuItem>
            ) : (
              formats.map(f => (
                <MenuItem key={f.id} value={f.name}>{f.name}</MenuItem>
              ))
            )}
          </TextField>
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>Colors</Typography>
            <ToggleButtonGroup
              value={archetypeForm.colors}
              onChange={(_, newColors) => setArchetypeForm(prev => ({ ...prev, colors: newColors }))}
            >
              {COLOR_OPTIONS.map(({ value, icon }) => (
                <ToggleButton key={value} value={value} sx={{ p: 0.5, '&.Mui-selected': { backgroundColor: 'rgba(0,0,0,0.2)' } }}>
                  <img src={icon} alt={value} width={32} height={32} />
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          {archetypeError && <Typography color="error" variant="body2">{archetypeError}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchetypeModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleArchetypeSave} disabled={archetypeSaving || !archetypeFormComplete}>
            {archetypeSaving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Format modal */}
      <Dialog open={formatModalOpen} onClose={() => setFormatModalOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add Format</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Name"
            value={formatForm.name}
            onChange={e => setFormatForm(prev => ({ ...prev, name: e.target.value }))}
            inputProps={{ maxLength: 50 }}
          />
          <TextField
            label="Description"
            value={formatForm.description}
            onChange={e => setFormatForm(prev => ({ ...prev, description: e.target.value }))}
            inputProps={{ maxLength: 255 }}
            multiline
            rows={3}
          />
          {formatError && <Typography color="error" variant="body2">{formatError}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormatModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleFormatSave} disabled={formatSaving || !formatForm.name.trim()}>
            {formatSaving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
