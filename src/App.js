import React, { useEffect, useState } from 'react';

function App() {
  const [email, setEmail] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');

    if (emailParam) {
      setEmail(emailParam);
      fetchCustomerData(emailParam);
    } else {
      setError('No email provided in query parameters.');
    }
  }, []);

  const fetchCustomerData = async (email) => {
    setLoading(true);
    setError(null);
    setCustomerData(null);

    try {
      const response = await fetch(`/api/getCustomer?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch customer data');
      }
      const data = await response.json();
      setCustomerData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Zoho Billing Customer Data</h1>

      {email && <p>Showing data for: <strong>{email}</strong></p>}

      {loading && <p>Loading customer data...</p>}

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {customerData && !loading && !error && (
        <section style={{ marginTop: '1rem' }}>
          {customerData.customers && customerData.customers.length > 0 ? (
            customerData.customers.map((customer) => (
              <div key={customer.customer_id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>
                <h2>{customer.customer_name}</h2>
                <p><strong>Email:</strong> {customer.email}</p>
                <p><strong>Company:</strong> {customer.company_name || 'N/A'}</p>
                <p><strong>Phone:</strong> {customer.phone || 'N/A'}</p>
                <p><strong>Billing Address:</strong> {customer.billing_address?.address || 'N/A'}</p>
              </div>
            ))
          ) : (
            <p>No customer data found for this email.</p>
          )}
        </section>
      )}
    </main>
  );
}

export default App;
