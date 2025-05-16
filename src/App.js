import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [authenticating, setAuthenticating] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [accessToken, setAccessToken] = useState(null);

  // Helper to get query params from URL
  const getQueryParam = (param) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
  };

  // Exchange authorization code for tokens via backend API
  const exchangeCodeForTokens = async (code) => {
    setAuthenticating(true);
    setError(null);
    try {
      // Call your backend API to exchange code for tokens
      // Assuming you have an endpoint /api/oauth/token that handles this
      const response = await axios.post('/api/oauth/token', { code });
      const { access_token, refresh_token } = response.data;

      if (!access_token) {
        throw new Error('No access token received from server.');
      }

      setAccessToken(access_token);
      setAuthenticated(true);

      // Optionally store tokens in localStorage/sessionStorage if needed
      // localStorage.setItem('access_token', access_token);
      // localStorage.setItem('refresh_token', refresh_token);

      // After authentication, fetch customer data
      fetchCustomerData(access_token);
    } catch (err) {
      setError('Failed to exchange authorization code for tokens. ' + (err.response?.data?.error || err.message));
      setAuthenticated(false);
    } finally {
      setAuthenticating(false);
    }
  };

  // Fetch customer data from backend API
  const fetchCustomerData = async (token) => {
    setError(null);
    setCustomerData(null);
    setEmail(getQueryParam('email') || '');

    if (!email) {
      setError('No email provided in query parameters.');
      return;
    }

    try {
      const response = await axios.get(`/api/getCustomer?email=${encodeURIComponent(email)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCustomerData(response.data);
    } catch (err) {
      setError('Failed to fetch customer data. ' + (err.response?.data?.error || err.message));
    }
  };

  useEffect(() => {
    const code = getQueryParam('code');
    const emailParam = getQueryParam('email');

    if (!emailParam) {
      setError('No email provided in query parameters.');
      return;
    }
    setEmail(emailParam);

    if (code) {
      // If authorization code is present, exchange it for tokens
      exchangeCodeForTokens(code);
    } else {
      // No code, user not authenticated yet
      setAuthenticated(false);
    }
  }, []);

  // Generate Zoho OAuth authorization URL for user to login and authorize
  const getAuthorizationUrl = () => {
    const clientId = process.env.REACT_APP_ZOHO_CLIENT_ID;
    const redirectUri = process.env.REACT_APP_ZOHO_REDIRECT_URI;
    const scopes = encodeURIComponent('ZohoBilling.customers.READ');
    const state = encodeURIComponent(email || '');
    return `https://accounts.zoho.com/oauth/v2/auth?scope=${scopes}&client_id=${clientId}&response_type=code&access_type=offline&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&prompt=consent`;
  };
  console.log('Authorization URL:', getAuthorizationUrl());
  console.log('Access Token:', accessToken);


  return (
    <div className="container mt-5">
      <h1 className="mb-4">Zoho Billing Customer Data</h1>

      {!authenticated && !authenticating && (
        <>
          <p>Please authorize the app to access Zoho Billing data for email: <strong>{email || 'N/A'}</strong></p>
          <a href={getAuthorizationUrl()} className="btn btn-primary">
            Authorize with Zoho
          </a>
          {error && <div className="alert alert-danger mt-3">{error}</div>}
        </>
      )}

      {authenticating && (
        <div className="d-flex align-items-center">
          <strong>Exchanging authorization code for tokens...</strong>
          <div className="spinner-border ms-auto" role="status" aria-hidden="true"></div>
        </div>
      )}

      {authenticated && (
        <>
          <p>Authenticated successfully. Showing data for: <strong>{email}</strong></p>

          {!customerData && !error && (
            <div className="d-flex align-items-center">
              <strong>Loading customer data...</strong>
              <div className="spinner-border ms-auto" role="status" aria-hidden="true"></div>
            </div>
          )}

          {error && <div className="alert alert-danger">{error}</div>}

          {customerData && customerData.customers && customerData.customers.length > 0 ? (
            customerData.customers.map((customer) => (
              <div key={customer.customer_id} className="card mb-3">
                <div className="card-body">
                  <h5 className="card-title">{customer.customer_name}</h5>
                  <p className="card-text"><strong>Email:</strong> {customer.email}</p>
                  <p className="card-text"><strong>Company:</strong> {customer.company_name || 'N/A'}</p>
                  <p className="card-text"><strong>Phone:</strong> {customer.phone || 'N/A'}</p>
                  <p className="card-text"><strong>Billing Address:</strong> {customer.billing_address?.address || 'N/A'}</p>
                </div>
              </div>
            ))
          ) : (
            !error && <p>No customer data found for this email.</p>
          )}
        </>
      )}
    </div>
  );
}

export default App;
