const ZOHO_AUTH_BASE_URL = 'https://accounts.zoho.com/oauth/v2/auth';
const ZOHO_TOKEN_URL = 'https://accounts.zoho.com/oauth/v2/token';

const CLIENT_ID = process.env.REACT_APP_ZOHO_CLIENT_ID;
const REDIRECT_URI = process.env.REACT_APP_ZOHO_REDIRECT_URI;
const ORG_ID = process.env.REACT_APP_ZOHO_ORG_ID;

// Scopes required for Zoho Billing API access - adjust as needed
const SCOPES = [
  'ZohoSubscriptions.customers.READ',
//   'ZohoBilling.invoices.READ',
  // add other scopes your app needs
].join(' ');

/**
 * Generates the Zoho OAuth 2.0 authorization URL where the user can grant access.
 * @param {string} state Optional state parameter to maintain state between request and callback.
 * @returns {string} Authorization URL
 */
export function getAuthorizationUrl(state = '') {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    access_type: 'offline', // to get refresh token
    prompt: 'consent', // force consent screen to get refresh token
    state,
  });

  return `${ZOHO_AUTH_BASE_URL}?${params.toString()}`;
}

/**
 * Exchanges the authorization code for access and refresh tokens.
 * @param {string} code Authorization code received from Zoho after user consent.
 * @returns {Promise<object>} Token response containing access_token, refresh_token, expires_in, etc.
 */
export async function exchangeCodeForTokens(code) {
  try {
    const params = new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: process.env.REACT_APP_ZOHO_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const response = await fetch(`${ZOHO_TOKEN_URL}?${params.toString()}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token exchange failed: ${errorData.error} - ${errorData.error_description}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error exchanging authorization code for tokens:', error);
    throw error;
  }
}

/**
 * Refreshes the access token using the refresh token.
 * @param {string} refreshToken The refresh token obtained during initial token exchange.
 * @returns {Promise<object>} Token response containing new access_token, expires_in, etc.
 */
export async function refreshAccessToken(refreshToken) {
  try {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: process.env.REACT_APP_ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token',
      redirect_uri: REDIRECT_URI,
    });

    const response = await fetch(`${ZOHO_TOKEN_URL}?${params.toString()}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token refresh failed: ${errorData.error} - ${errorData.error_description}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

/**
 * Returns headers object with Authorization and Zoho-Organization-Id headers set.
 * @param {string} accessToken The OAuth 2.0 access token.
 * @returns {object} Headers object for API requests.
 */
export function getAuthHeaders(accessToken) {
  return {
    Authorization: `Zoho-oauthtoken ${accessToken}`,
    'X-com-zoho-billing-organizationid': ORG_ID,
    'Content-Type': 'application/json',
  };
}
