import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email query parameter is required' });
  }

  const accessToken = process.env.ZOHO_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({ error: 'Zoho access token is not configured' });
  }

  try {
    const response = await fetch(`https://www.zohoapis.com/billing/v3/customers?email=${encodeURIComponent(email)}`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.message || 'Failed to fetch customer data' });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
