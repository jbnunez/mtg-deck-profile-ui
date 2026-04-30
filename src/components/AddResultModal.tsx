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

const MANA_ICONS: Record<string, string> = { W: manaW, U: manaU, B: manaB, R: manaR, G: manaG, C: manaC }

interface Archetype {
  id: number
  name: string
  format: string
  colors: string
}

interface DeckInfo {
  id: number
  archetype: Archetype
}

interface ResultForm {
  opp_archetype: string
  play: boolean
  g1: 'W' | 'L' | ''
  g2: 'W' | 'L' | ''
  g3: 'W' | 'L' | ''
}

const EMPTY_RESULT: ResultForm = { opp_archetype: '', play: true, g1: '', g2: '', g3: '' }

function deriveMatchResult(g1: string, g2: string, g3: string): string {
  let result = ''
  if (g1.length > 0) {
    result += g1
  }
  if (g2.length > 0) {
    result += g2
  }
  if (g3.length > 0) {
    result += g3
  }
  if (result.length === 0) {
    return 'D'
  }
  return result
}

function GameToggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: 'W' | 'L' | ''
  onChange: (v: 'W' | 'L' | '') => void
}) {
  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 0.5 }}>{label}</Typography>
      <ToggleButtonGroup
        exclusive
        value={value}
        onChange={(_, v) => { if (v !== null) onChange(v) }}
      >
        <ToggleButton value="W" sx={{ px: 3, '&.Mui-selected': { backgroundColor: 'rgba(0,0,0,0.35)' } }}>W</ToggleButton>
        <ToggleButton value="L" sx={{ px: 3, '&.Mui-selected': { backgroundColor: 'rgba(0,0,0,0.35)' } }}>L</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  deck: DeckInfo
  token: string | null
  currentUserId: number | null
}

export default function AddResultModal({ open, onClose, onSuccess, deck, token, currentUserId }: Props) {
  const [form, setForm] = useState<ResultForm>(EMPTY_RESULT)
  const [oppArchetypes, setOppArchetypes] = useState<Archetype[]>([])
  const [oppArchetypesLoading, setOppArchetypesLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(EMPTY_RESULT)
    setError('')
    setOppArchetypesLoading(true)
    fetch(
      `${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/archetypes/?format-name=${encodeURIComponent(deck.archetype.format)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(res => res.json())
      .then(setOppArchetypes)
      .finally(() => setOppArchetypesLoading(false))
  }, [open])

  async function handleSave() {
    const { g1, g2, g3, opp_archetype, play } = form
    const match_result = deriveMatchResult(g1, g2, g3)
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_MTG_DECK_PROFILE_API}/v1/matches/add-match-result/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          player: currentUserId,
          opponent: null,
          archetype: deck.archetype.id,
          opp_archetype: Number(opp_archetype),
          deck: deck.id,
          play,
          match_result,
          g1_result: g1,
          g2_result: g2 || null,
          g3_result: g3,
        }),
      })
      if (res.status === 201) {
        onSuccess()
        onClose()
        return
      }
      const data = await res.json()
      setError(data.detail ?? JSON.stringify(data))
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const g2Valid = form.g2 === '' || form.g1 !== ''
  const g3Valid = form.g3 === '' || (form.g1 !== '' && form.g2 !== '')
  const formComplete = form.opp_archetype !== '' && g2Valid && g3Valid

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add Match Result</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: '16px !important' }}>
        <TextField
          select
          label="Opponent Archetype"
          value={form.opp_archetype}
          onChange={e => setForm(prev => ({ ...prev, opp_archetype: e.target.value }))}
          disabled={oppArchetypesLoading}
        >
          {oppArchetypesLoading ? (
            <MenuItem disabled><CircularProgress size={16} /></MenuItem>
          ) : (
            oppArchetypes.map(a => (
              <MenuItem key={a.id} value={String(a.id)}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {a.colors.split('').map((c, i) =>
                    MANA_ICONS[c] ? <img key={i} src={MANA_ICONS[c]} alt={c} width={16} height={16} /> : null
                  )}
                  {a.name}
                </Box>
              </MenuItem>
            ))
          )}
        </TextField>

        <Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}>On the Play</Typography>
          <ToggleButtonGroup
            exclusive
            value={form.play}
            onChange={(_, v) => { if (v !== null) setForm(prev => ({ ...prev, play: v })) }}
          >
            <ToggleButton value={true} sx={{ px: 3, '&.Mui-selected': { backgroundColor: 'rgba(0,0,0,0.35)' } }}>Play</ToggleButton>
            <ToggleButton value={false} sx={{ px: 3, '&.Mui-selected': { backgroundColor: 'rgba(0,0,0,0.35)' } }}>Draw</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ display: 'flex', gap: 3 }}>
          <GameToggle
            label="Game 1"
            value={form.g1}
            onChange={v => setForm(prev => ({ ...prev, g1: v, g2: '', g3: '' }))}
          />
          <GameToggle
            label="Game 2"
            value={form.g2}
            onChange={v => setForm(prev => ({ ...prev, g2: v, g3: '' }))}
          />
          <GameToggle
            label="Game 3"
            value={form.g3}
            onChange={v => setForm(prev => ({ ...prev, g3: v }))}
          />
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
