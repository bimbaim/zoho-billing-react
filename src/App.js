import React, { useEffect, useState } from 'react';

function App() {
  const [authenticating, setAuthenticating] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [accessToken, setAccessToken] = useState(null);

  const getQueryParam = (param) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
  };

  // ✅ Exchange authorization code for tokens via your backend API
  const exchangeCodeForTokens = async (code) => {
  setAuthenticating(true);
  setError(null);
  try {
    const response = await fetch('/api/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const text = await response.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Server returned invalid JSON.');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Failed to exchange authorization code for tokens.');
    }

    const { access_token } = data;

    if (!access_token) {
      throw new Error('No access token received from server.');
    }

    setAccessToken(access_token);
    setAuthenticated(true);
    fetchCustomerData(access_token);
  } catch (err) {
    setError('Failed to exchange authorization code for tokens. ' + err.message);
    setAuthenticated(false);
  } finally {
    setAuthenticating(false);
  }
};


  // ✅ Fetch customer data from your backend
  const fetchCustomerData = async (token) => {
    setError(null);
    setCustomerData(null);
    const emailParam = getQueryParam('state') || '';
    setEmail(emailParam);

    if (!emailParam) {
      setError('No email provided in query parameters.');
      return;
    }

    try {
      const response = await fetch(`/api/getCustomer?email=${encodeURIComponent(emailParam)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch customer data.');
      }

      setCustomerData(data);
    } catch (err) {
      setError('Failed to fetch customer data. ' + err.message);
    }
  };

  useEffect(() => {
    const code = getQueryParam('code');
    const emailParam = getQueryParam('state'); // you're passing email as state in the Zoho OAuth URL

    if (!emailParam) {
      setError('No email provided in query parameters.');
      return;
    }
    setEmail(emailParam);

    if (code) {
      exchangeCodeForTokens(code);
    } else {
      setAuthenticated(false);
    }
  }, []);

  const getAuthorizationUrl = () => {
    const clientId = process.env.REACT_APP_ZOHO_CLIENT_ID;
    const redirectUri = process.env.REACT_APP_ZOHO_REDIRECT_URI;
    const scopes = encodeURIComponent('ZohoSubscriptions.customers.READ');
    const state = encodeURIComponent(email || '');
    return `https://accounts.zoho.com/oauth/v2/auth?scope=${scopes}&client_id=${clientId}&response_type=code&access_type=offline&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&prompt=consent`; 
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Zoho Billing Customer Data</h1>
      <p>access_token: {accessToken}</p>
      <p>email: {email}</p>
      <p>authenticated: {authenticated ? 'true' : 'false'}</p>

      {!authenticated && !authenticating && (
        <>
          <p>
            Please authorize the app to access Zoho Billing data for email: <strong>{email || 'N/A'}</strong>
          </p>
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
          <p>
            Authenticated successfully. Showing data for: <strong>{email}</strong>
          </p>

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
                  <p className="card-text">
                    <strong>Email:</strong> {customer.email}
                  </p>
                  <p className="card-text">
                    <strong>Company:</strong> {customer.company_name || 'N/A'}
                  </p>
                  <p className="card-text">
                    <strong>Phone:</strong> {customer.phone || 'N/A'}
                  </p>
                  <p className="card-text">
                    <strong>Billing Address:</strong> {customer.billing_address?.address || 'N/A'}
                  </p>
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
