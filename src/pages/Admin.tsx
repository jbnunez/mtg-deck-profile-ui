import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Typography } from '@mui/material'
import { decodeTokenPayload } from '../utils/crypto'
import AddArchetypeModal from '../components/AddArchetypeModal'
import AddFormatModal from '../components/AddFormatModal'

export default function Admin() {
  const navigate = useNavigate()
  const token = sessionStorage.getItem('token')

  const [archetypeModalOpen, setArchetypeModalOpen] = useState(false)
  const [formatModalOpen, setFormatModalOpen] = useState(false)

  useEffect(() => {
    if (!token) { navigate('/'); return }
    const payload = decodeTokenPayload(token) as { is_admin: boolean }
    if (!payload.is_admin) navigate('/')
  }, [token, navigate])

  if (!token) return null
  const payload = decodeTokenPayload(token) as { is_admin: boolean }
  if (!payload.is_admin) return null

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: 2, py: 8 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        Admin
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={() => setArchetypeModalOpen(true)}>
          Add Archetype
        </Button>
        <Button variant="contained" onClick={() => setFormatModalOpen(true)}>
          Add Format
        </Button>
      </Box>

      <AddArchetypeModal
        open={archetypeModalOpen}
        onClose={() => setArchetypeModalOpen(false)}
        onSuccess={() => {}}
        token={token}
      />

      <AddFormatModal
        open={formatModalOpen}
        onClose={() => setFormatModalOpen(false)}
        onSuccess={() => {}}
        token={token}
      />
    </Box>
  )
}
