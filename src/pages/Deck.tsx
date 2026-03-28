import { useParams } from 'react-router-dom'

export default function Deck() {
  const { deckId } = useParams()
  return <h1>Deck: {deckId}</h1>
}
