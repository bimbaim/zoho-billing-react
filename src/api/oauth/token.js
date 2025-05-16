// File: /api/oauth/token.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const params = new URLSearchParams();
  params.append('client_id', process.env.ZOHO_CLIENT_ID);
  params.append('client_secret', process.env.ZOHO_CLIENT_SECRET);
  params.append('grant_type', 'authorization_code');
  params.append('redirect_uri', process.env.ZOHO_REDIRECT_URI);
  params.append('code', code);

  try {
    const zohoResponse = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await zohoResponse.json();

    if (!zohoResponse.ok) {
      return res.status(zohoResponse.status).json({ error: data.error || 'Token exchange failed' });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Token fetch error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
