const axios = require('axios');

exports.handler = async (event) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const authHeader = event.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'No token provided' })
    };
  }

  const token = authHeader.split(' ')[1];

  try {
    console.log('Verifying Farcaster token...');

    // Verify token with Farcaster API
    const response = await axios.get('https://api.farcaster.xyz/v2/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000,
    });

    const fid = response.data.result.fid;
    
    console.log(`Token verified for FID: ${fid}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        fid,
        success: true 
      }),
    };
  } catch (error) {
    console.error('Token verification error:', error.response?.data || error.message);
    
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ 
        error: 'Invalid token',
        details: error.response?.data?.message || error.message 
      }),
    };
  }
};