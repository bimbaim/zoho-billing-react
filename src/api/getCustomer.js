import { getAuthHeaders, refreshAccessToken } from '../utils/zoho-oauth.js';

export default async function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email query parameter is required' });
  }

  try {
    let accessToken = process.env.ZOHO_ACCESS_TOKEN;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

    if (!accessToken || !refreshToken) {
      return res.status(500).json({ error: 'Access token or refresh token is not configured in environment variables.' });
    }

    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);
    console.log('Email:', email);

    // Function to call Zoho Billing API with current access token
    async function fetchCustomerData(token) {
      const response = await fetch(
        `https://www.zohoapis.com/billing/v1/customers?email=${encodeURIComponent(email)}`,
        {
          headers: getAuthHeaders(token),
        }
      );
      return response;
    }

    let response = await fetchCustomerData(accessToken);

    // If unauthorized, try refreshing the token once
    if (response.status === 401) {
      try {
        const tokenData = await refreshAccessToken(refreshToken);
        accessToken = tokenData.access_token;

        if (!accessToken) {
          return res.status(500).json({ error: 'Failed to refresh access token.' });
        }

        // TODO: Persist the new access token securely (e.g., update environment variable or database)

        response = await fetchCustomerData(accessToken);
      } catch (refreshError) {
        return res.status(500).json({ error: 'Error refreshing access token.', details: refreshError.message });
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errorData.message || 'Failed to fetch customer data from Zoho Billing API',
      });
    }

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
