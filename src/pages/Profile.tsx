import { useParams } from 'react-router-dom'

export default function Profile() {
  const { profileId } = useParams()
  return <h1>Profile: {profileId}</h1>
}
