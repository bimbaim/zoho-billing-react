import React, { useEffect, useState } from 'react';

function App() {
  const [customerData, setCustomerData] = useState(null);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');

  const getQueryParam = (param) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
  };

  const fetchCustomerData = async (emailParam) => {
    try {
      const response = await fetch(`/api/getCustomer?email=${encodeURIComponent(emailParam)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch customer data.');
      }

      const data = await response.json();
      setCustomerData(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const emailParam = getQueryParam('email');
    if (!emailParam) {
      setError('No email provided in query parameters.');
      return;
    }
    setEmail(emailParam);
    fetchCustomerData(emailParam);
  }, []);

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Zoho Billing Customer Data</h1>
      <p><strong>Email:</strong> {email}</p>

      {error && <div className="alert alert-danger">{error}</div>}

      {!error && !customerData && (
        <div className="d-flex align-items-center">
          <strong>Loading customer data...</strong>
          <div className="spinner-border ms-auto" role="status" aria-hidden="true"></div>
        </div>
      )}

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
    </div>
  );
}

export default App;
