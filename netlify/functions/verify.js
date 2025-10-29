const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'No token provided' }) };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    console.log('Verifying token with Farcaster API...');
    
    // Verify token with Farcaster's API
    const verifyResponse = await axios.get('https://api.farcaster.xyz/v2/me', {
      headers: { 'Authorization': `Bearer ${token}` },
      timeout: 10000
    });

    const userData = verifyResponse.data;
    
    if (userData && userData.result && userData.result.user) {
      const user = userData.result.user;
      console.log('Token verified for user:', user.username);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          fid: user.fid,
          username: user.username,
          displayName: user.display_name,
          pfp: user.pfp_url ? { url: user.pfp_url } : null,
          verified: true
        })
      };
    } else {
      throw new Error('Invalid user data from Farcaster API');
    }
  } catch (error) {
    console.error('Token verification failed:', error.response?.data || error.message);
    
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        error: 'Token verification failed',
        details: error.response?.data?.message || error.message
      })
    };
  }
};