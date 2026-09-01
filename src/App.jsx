import { useEffect, useRef, useState } from 'react'
import './App.css'

const POLL_INTERVAL_MS = 60_000

const LIVE_STATUSES = new Set(['IN_PLAY', 'PAUSED', 'LIVE'])

function statusLabel(status) {
  if (LIVE_STATUSES.has(status)) return 'LIVE'
  if (status === 'FINISHED') return 'FT'
  if (status === 'SCHEDULED' || status === 'TIMED') return 'UPCOMING'
  return status
}

function statusClass(status) {
  if (LIVE_STATUSES.has(status)) return 'status live'
  if (status === 'FINISHED') return 'status finished'
  return 'status upcoming'
}

function kickoffCountdown(utcDate) {
  const diffMs = new Date(utcDate).getTime() - Date.now()
  if (diffMs <= 0) return null
  const hours = Math.floor(diffMs / 3_600_000)
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000)
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `in ${days}d`
  }
  return `in ${hours}h ${minutes}m`
}

function MatchCard({ match }) {
  const { homeTeam, awayTeam, score, status, utcDate } = match
  const countdown =
    status === 'SCHEDULED' || status === 'TIMED'
      ? kickoffCountdown(utcDate)
      : null

  return (
    <li className="match-card">
      <span className={statusClass(status)}>{statusLabel(status)}</span>
      <div className="teams">
        <span className="team">{homeTeam.name}</span>
        <span className="score">
          {score.fullTime.home ?? '-'} : {score.fullTime.away ?? '-'}
        </span>
        <span className="team">{awayTeam.name}</span>
      </div>
      {countdown && <span className="countdown">{countdown}</span>}
    </li>
  )
}

function App() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stale, setStale] = useState(false)
  const hasDataRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function loadFixtures() {
      try {
        const res = await fetch('/api/fixtures')
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        const data = await res.json()
        if (cancelled) return
        setMatches(data.matches ?? [])
        setError(null)
        setStale(false)
        hasDataRef.current = true
      } catch (err) {
        if (cancelled) return
        setError(err.message)
        setStale(hasDataRef.current)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadFixtures()
    const id = setInterval(loadFixtures, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <main className="tracker">
      <h1>EPL Live Tracker</h1>

      {stale && (
        <p className="banner stale">
          Couldn't refresh — showing the last data we have.
        </p>
      )}
      {error && !hasDataRef.current && (
        <p className="banner error">Couldn't load fixtures: {error}</p>
      )}

      {loading && matches.length === 0 ? (
        <p className="banner">Loading fixtures…</p>
      ) : (
        <ul className="match-list">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </ul>
      )}
    </main>
  )
}

export default App
