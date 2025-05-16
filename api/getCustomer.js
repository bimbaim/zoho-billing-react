export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.query;
  const authHeader = req.headers.authorization;

  if (!email) {
    return res.status(400).json({ error: 'Missing email query parameter.' });
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
  }

  const accessToken = authHeader.split(' ')[1];

  try {
    const zohoResponse = await fetch(`https://www.zohoapis.com/billing/v1/customers?email=${encodeURIComponent(email)}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!zohoResponse.ok) {
      const errorData = await zohoResponse.json().catch(() => ({}));
      return res.status(zohoResponse.status).json({
        error: errorData.message || 'Failed to fetch customer data from Zoho.',
      });
    }

    const data = await zohoResponse.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching from Zoho:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
