export default async function handler(req, res) {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY

  if (!apiKey) {
    res.status(500).json({ error: 'Server misconfigured: missing API key' })
    return
  }

  try {
    const response = await fetch(
      'https://api.football-data.org/v4/competitions/PL/matches',
      { headers: { 'X-Auth-Token': apiKey } },
    )

    if (!response.ok) {
      res
        .status(response.status)
        .json({ error: `football-data.org returned ${response.status}` })
      return
    }

    const data = await response.json()
    res.setHeader('Cache-Control', 's-maxage=55, stale-while-revalidate=30')
    res.status(200).json(data)
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach football-data.org' })
  }
}
