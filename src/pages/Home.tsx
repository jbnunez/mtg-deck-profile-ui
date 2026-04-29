import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Box, Button, CircularProgress, Pagination, Typography } from '@mui/material'
import { decodeTokenPayload } from '../utils/crypto'
import AddDeckModal from '../components/AddDeckModal'
import DeckCard, { type DeckCardDeck } from '../components/DeckCard'

export default function Home() {
  const token = sessionStorage.getItem('token')
  const name = sessionStorage.getItem('name')

  const [decks, setDecks] = useState<DeckCardDeck[]>([])
  const [decksLoading, setDecksLoading] = useState(false)
  const [decksError, setDecksError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 10

  const [modalOpen, setModalOpen] = useState(false)

  const userId = token ? (decodeTokenPayload(token) as { user_id: number }).user_id : 0

  function fetchDecks(p = page) {
    if (!token) return
    setDecksLoading(true)
    fetch(`${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/user-decks/${userId}/?limit=${LIMIT}&page=${p}`, {
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

  if (token) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, py: 8 }}>
        <Typography variant="h3" component="h1" sx={{ mb: 4 }}>
          Welcome, {name}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" component="h2">My Decks</Typography>
          <Button variant="contained" onClick={() => setModalOpen(true)}>Add Deck</Button>
        </Box>

        {decksLoading && <CircularProgress />}

        {decksError && <Typography color="error">{decksError}</Typography>}

        {!decksLoading && !decksError && decks.length === 0 && (
          <Typography color="text.secondary">No decks yet.</Typography>
        )}

        {decks.map(deck => (
          <DeckCard key={deck.id} deck={deck} />
        ))}

        {total > LIMIT && (
          <Pagination
            count={Math.ceil(total / LIMIT)}
            page={page}
            onChange={(_, p) => { setPage(p); fetchDecks(p) }}
            sx={{ mt: 3 }}
          />
        )}

        <AddDeckModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => { setPage(1); fetchDecks(1) }}
          token={token}
          userId={userId}
        />
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
