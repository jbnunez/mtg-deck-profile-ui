import { Link } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import manaW from '../assets/mana-W.svg'
import manaU from '../assets/mana-U.svg'
import manaB from '../assets/mana-B.svg'
import manaR from '../assets/mana-R.svg'
import manaG from '../assets/mana-G.svg'
import manaC from '../assets/mana-C.svg'

const MANA_ICONS: Record<string, string> = { W: manaW, U: manaU, B: manaB, R: manaR, G: manaG, C: manaC }

interface Archetype {
  name: string
  format: string
  colors: string
}

export interface DeckCardDeck {
  id: number
  archetype: Archetype
  num_matches: number
  last_played: string
}

function formatLastPlayed(iso: string) {
  const date = new Date(iso)
  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .format(date).toLowerCase()
  const tz = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
    .formatToParts(date).find(p => p.type === 'timeZoneName')?.value ?? ''
  const dateStr = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
  return `${time} ${tz} ${dateStr}`
}

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

export default function DeckCard({ deck }: { deck: DeckCardDeck }) {
  return (
    <Box
      component={Link}
      to={`/deck/${deck.id}`}
      sx={{
        mt: 2,
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        '&:hover': { borderColor: 'primary.main', cursor: 'pointer' },
      }}
    >
      <Typography sx={{ fontWeight: 600 }}>
        <ColorIcons colors={deck.archetype.colors} />
        {deck.archetype.name}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {deck.archetype.format} · {deck.num_matches} match{deck.num_matches !== 1 ? 'es' : ''} · Last played {formatLastPlayed(deck.last_played)}
      </Typography>
    </Box>
  )
}
