import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import { decodeTokenPayload } from '../utils/crypto'

interface ProfileField {
  field_name: string
  field_value: string
}

interface UserProfile {
  id: number
  name: string
  profile_fields: ProfileField[]
}

const FIELD_OPTIONS = [
  { value: 'arena', label: 'Arena Username' },
  { value: 'discord', label: 'Discord' },
  { value: 'moxfield', label: 'Moxfield' },
  { value: 'mtgeloproject', label: 'MTG Elo Project' },
  { value: 'mtgo', label: 'MTGO Username' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'x', label: 'X' },
]

export default function ManageProfile() {
  const token = sessionStorage.getItem('token')

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [fieldName, setFieldName] = useState(FIELD_OPTIONS[0].value)
  const [fieldValue, setFieldValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  function fetchProfile() {
    if (!token) return

    const { user_id } = decodeTokenPayload(token) as { user_id: number }

    setLoading(true)
    fetch(`${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/users/${user_id}/profile/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load profile.')
        return res.json()
      })
      .then(setProfile)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(fetchProfile, [token])

  function existingValue(name: string) {
    return profile?.profile_fields.find(f => f.field_name === name)?.field_value ?? ''
  }

  function openModal() {
    const defaultField = FIELD_OPTIONS[0].value
    setFieldName(defaultField)
    setFieldValue(existingValue(defaultField))
    setSaveError('')
    setModalOpen(true)
  }

  function handleFieldChange(name: string) {
    setFieldName(name)
    setFieldValue(existingValue(name))
  }

  async function handleSave() {
    setSaveError('')
    setSaving(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/users/update-profile/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ field_name: fieldName, field_value: fieldValue }),
      })

      if (!res.ok) {
        const data = await res.json()
        setSaveError(data.detail ?? 'Failed to update profile.')
        return
      }

      setModalOpen(false)
      fetchProfile()
    } catch {
      setSaveError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, py: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Manage Profile
        </Typography>
        <Button variant="contained" onClick={openModal}>
          Update Profile
        </Button>
      </Box>

      {loading && <CircularProgress sx={{ mt: 2 }} />}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {profile && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            {profile.name}
          </Typography>
          <Divider sx={{ mb: 3 }} />
          {profile.profile_fields.length === 0 ? (
            <Typography color="text.secondary">No profile fields yet.</Typography>
          ) : (
            profile.profile_fields.map(field => (
              <Box key={field.field_name} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography fontWeight={500}>
                  {FIELD_OPTIONS.find(o => o.value === field.field_name)?.label ?? field.field_name}
                </Typography>
                <Typography color="text.secondary">{field.field_value}</Typography>
              </Box>
            ))
          )}
        </Box>
      )}

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Update Profile Field</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            select
            label="Field"
            value={fieldName}
            onChange={e => handleFieldChange(e.target.value)}
          >
            {FIELD_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Value"
            value={fieldValue}
            onChange={e => setFieldValue(e.target.value)}
          />
          {saveError && (
            <Typography color="error" variant="body2">
              {saveError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !fieldValue}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
