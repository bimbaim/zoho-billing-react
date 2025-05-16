// pages/api/getCustomer.js
let cachedAccessToken = null;
let accessTokenExpiry = 0;

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_API_BASE = 'https://subscriptions.zoho.com/api/v1';

async function getAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && now < accessTokenExpiry) {
    return cachedAccessToken;
  }

  const tokenRes = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: ZOHO_REFRESH_TOKEN,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error || 'Failed to refresh token.');
  }

  cachedAccessToken = tokenData.access_token;
  accessTokenExpiry = now + (tokenData.expires_in || 3600) * 1000;

  return cachedAccessToken;
}

export default async function handler(req, res) {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Missing email parameter.' });
  }

  try {
    const token = await getAccessToken();
    const response = await fetch(`${ZOHO_API_BASE}/customers?email=${encodeURIComponent(email)}`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok || !data.customers) {
      return res.status(500).json({ error: data.message || 'Error fetching customer data' });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
