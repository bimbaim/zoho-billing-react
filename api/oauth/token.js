export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code } = req.body;

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
    console.log('Zoho response text:', text);

    let data = {};
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error('Error parsing Zoho response:', err);
      // If the response is not valid JSON, log the error and return a 500 status
      // with a generic error message.
      // This is important to avoid exposing sensitive information in the logs.
      // You can also log the raw response text for debugging purposes.
      console.error('Raw response:', text);
      console.error('Failed to parse Zoho response as JSON:', text);
      return res.status(500).json({ error: 'Server returned invalid JSON.' });
    }

    if (!result.ok) {
      return res.status(result.status).json({ error: data.error || 'Zoho error' });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('OAuth error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
