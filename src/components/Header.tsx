import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppBar, Box, IconButton, Menu, MenuItem, Toolbar, Typography } from '@mui/material'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { decodeTokenPayload } from '../utils/crypto'

export default function Header() {
  const navigate = useNavigate()
  const token = sessionStorage.getItem('token')

  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  if (!token) return null

  function handleLogout() {
    sessionStorage.clear()
    setAnchor(null)
    navigate('/')
  }

  return (
    <AppBar position="sticky">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" component={Link} to="/" sx={{ color: 'inherit', textDecoration: 'none' }}>
          MTG Deck Profile
        </Typography>
        <Box>
          <IconButton color="inherit" onClick={e => setAnchor(e.currentTarget)}>
            <AccountCircleIcon fontSize="large" />
          </IconButton>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            <MenuItem component={Link} to="/manage-profile" onClick={() => setAnchor(null)}>
              Manage Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>Log Out</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
