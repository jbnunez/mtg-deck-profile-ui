import { useEffect, useState } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'

interface FormatForm {
  name: string
  description: string
}

const EMPTY_FORM: FormatForm = { name: '', description: '' }

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  token: string | null
}

export default function AddFormatModal({ open, onClose, onSuccess, token }: Props) {
  const [form, setForm] = useState<FormatForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(EMPTY_FORM)
    setError('')
  }, [open])

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/formats/add-format/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add Format</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <TextField
          label="Name"
          value={form.name}
          onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
          slotProps={{ htmlInput: { maxLength: 50 } }}
        />
        <TextField
          label="Description"
          value={form.description}
          onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
          slotProps={{ htmlInput: { maxLength: 255 } }}
          multiline
          rows={3}
        />
        {error && <Typography color="error" variant="body2">{error}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !form.name.trim()}>
          {saving ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
