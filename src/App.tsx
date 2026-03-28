import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ManageProfile from './pages/ManageProfile'
import Profile from './pages/Profile'
import DeckArchetype from './pages/DeckArchetype'
import Deck from './pages/Deck'
import Login from './pages/Login'
import SignUp from './pages/SignUp'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/manage-profile" element={<ManageProfile />} />
        <Route path="/profile/:profileId" element={<Profile />} />
        <Route path="/deck-archetype" element={<DeckArchetype />} />
        <Route path="/deck/:deckId" element={<Deck />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
