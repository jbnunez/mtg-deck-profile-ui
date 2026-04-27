import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { hashPassword } from '../utils/crypto'
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material'

interface FormState {
  email: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/users/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, password: await hashPassword(form.password) }),
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('token', data.token)
        navigate('/')
        return
      }

      setError(data.error ?? 'Login failed. Please try again.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto', px: 2, py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Log In
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}
      >
        <TextField
          id="email"
          name="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          sx={whiteFieldSx}
        />

        <TextField
          id="password"
          name="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
          sx={whiteFieldSx}
        />

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        <Button type="submit" variant="contained" disabled={loading} sx={{ mt: 1 }}>
          {loading ? <CircularProgress size={24} /> : 'Log In'}
        </Button>
      </Box>

      <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
        Don't have an account?{' '}
        <Link to="/sign-up">Sign up</Link>
      </Typography>
    </Box>
  )
}

const whiteFieldSx = {
  '& .MuiInputBase-input': { color: 'white' },
  '& .MuiInputLabel-root': { color: 'white' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
}
