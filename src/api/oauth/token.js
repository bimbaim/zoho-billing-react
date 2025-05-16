try {
  const result = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      redirect_uri: process.env.ZOHO_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  const text = await result.text();
  console.log('Zoho response:', text); // ✅ log this

  const data = JSON.parse(text);

  if (!result.ok) {
    return res.status(result.status).json({ error: data.error || 'Zoho error' });
  }

  return res.status(200).json(data);
} catch (err) {
  console.error('OAuth error:', err);
  return res.status(500).json({ error: 'Internal server error' });
}
