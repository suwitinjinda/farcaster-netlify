// netlify/functions/analytics-proxy.js
const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    
    const response = await axios.post('https://privy.farcaster.xyz/api/v1/analytics_events', body, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Farcaster-Dashboard/1.0'
      },
      timeout: 10000
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: response.data })
    };
  } catch (error) {
    console.error('Analytics proxy error:', error.response?.data || error.message);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Analytics event failed',
        note: 'This is non-critical and does not affect functionality'
      })
    };
  }
};