import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Admin from './pages/Admin'
import Home from './pages/Home'
import ManageProfile from './pages/ManageProfile'
import Profile from './pages/Profile'
import DeckArchetype from './pages/DeckArchetype'
import Deck from './pages/Deck'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Header from './components/Header'

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/manage-profile" element={<ManageProfile />} />
        <Route path="/profile/:profileId" element={<Profile />} />
        <Route path="/deck-archetype" element={<DeckArchetype />} />
        <Route path="/deck/:deckId" element={<Deck />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
