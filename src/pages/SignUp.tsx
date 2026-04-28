import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { hashPassword, decodeTokenPayload } from '../utils/crypto'
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material'

interface FormState {
  name: string
  email: string
  password: string
}

interface FieldErrors {
  name?: string[]
  email?: string[]
  password?: string[]
  non_field_errors?: string[]
}

export default function SignUp() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/users/create-user/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, password: await hashPassword(form.password) }),
      })

      const data = await res.json()

      if (res.status === 201) {
        sessionStorage.setItem('token', data.token)
        const payload = decodeTokenPayload(data.token)
        sessionStorage.setItem('name', payload.name as string)
        navigate('/')
        return
      }

      setErrors(data)
    } catch {
      setErrors({ non_field_errors: ['Network error. Please try again.'] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 400,
        mx: 'auto',
        px: 2,
        py: 4,
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Sign Up
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}
      >
        <TextField
          id="name"
          name="name"
          label="Name"
          value={form.name}
          onChange={handleChange}
          required
          error={!!errors.name}
          helperText={errors.name?.[0]}
          sx={whiteFieldSx}
        />

        <TextField
          id="email"
          name="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          error={!!errors.email}
          helperText={errors.email?.[0]}
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
          error={!!errors.password}
          helperText={errors.password?.[0]}
          sx={whiteFieldSx}
        />

        {errors.non_field_errors?.map(msg => (
          <Typography key={msg} color="error" variant="body2">
            {msg}
          </Typography>
        ))}

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{ mt: 1 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Account'}
        </Button>
      </Box>

      <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
        Already have an account?{' '}
        <Link to="/login">Log in</Link>
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
