// pages/api/getCustomer.js

let cachedAccessToken = null;
let accessTokenExpiry = 0;

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;

async function getAccessToken() {
  const now = Date.now();

  // If token is valid, use it
  if (cachedAccessToken && now < accessTokenExpiry) {
    return cachedAccessToken;
  }

  // Else: Refresh it
  const tokenResponse = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: ZOHO_REFRESH_TOKEN,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(tokenData.error || 'Failed to refresh access token.');
  }

  // Cache new token
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
    const accessToken = await getAccessToken();

    const customerRes = await fetch(
      `https://subscriptions.zoho.com/api/v1/customers?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await customerRes.json();

    if (!customerRes.ok) {
      return res.status(customerRes.status).json({ error: data.message || 'Failed to fetch customer data.' });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
