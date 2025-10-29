const axios = require('axios');

exports.handler = async (event, context) => {
  console.log('🔍 VERIFY FUNCTION STARTED');
  console.log('📋 HTTP Method:', event.httpMethod);
  console.log('📋 Headers:', event.headers);
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ Handling OPTIONS preflight');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    console.log('❌ Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const authHeader = event.headers.authorization;
  console.log('📋 Authorization header present:', !!authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No Bearer token found in header');
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'No token provided' })
    };
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('📋 Token received (first 50 chars):', token.substring(0, 50) + '...');
  console.log('📋 Full token length:', token.length);

  try {
    // Debug token structure
    try {
      const tokenParts = token.split('.');
      console.log('📋 Token parts count:', tokenParts.length);
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('📋 Token payload:', {
          fid: payload.sub,
          iss: payload.iss,
          exp: payload.exp,
          exp_date: new Date(payload.exp * 1000).toISOString(),
          aud: payload.aud,
          iat: payload.iat
        });
        
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        console.log('📋 Token expiry check - now:', now, 'exp:', payload.exp, 'is_expired:', now > payload.exp);
      }
    } catch (parseError) {
      console.warn('⚠️ Token parsing failed:', parseError);
    }

    console.log('🔍 Calling Farcaster API: https://api.farcaster.xyz/v2/me');
    
    // Verify token with Farcaster's API
    const verifyResponse = await axios.get('https://api.farcaster.xyz/v2/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });

    console.log('✅ Farcaster API response status:', verifyResponse.status);
    console.log('✅ Farcaster API response data:', JSON.stringify(verifyResponse.data, null, 2));

    const userData = verifyResponse.data;
    
    if (userData && userData.result && userData.result.user) {
      const user = userData.result.user;
      console.log('🎉 Token verified for user:', user.username, 'FID:', user.fid);
      
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
      console.log('❌ Invalid user data from Farcaster API');
      throw new Error('Invalid user data from Farcaster API');
    }
  } catch (error) {
    console.error('❌ Token verification failed:');
    console.error('📋 Error name:', error.name);
    console.error('📋 Error message:', error.message);
    
    if (error.response) {
      console.error('📋 Farcaster API response status:', error.response.status);
      console.error('📋 Farcaster API response data:', error.response.data);
      console.error('📋 Farcaster API response headers:', error.response.headers);
    } else if (error.request) {
      console.error('📋 No response received from Farcaster API');
      console.error('📋 Request details:', error.request);
    } else {
      console.error('📋 Request setup error:', error.message);
    }
    
    console.error('📋 Full error:', error);

    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        error: 'Token verification failed',
        details: error.response?.data?.message || error.message,
        farcaster_status: error.response?.status
      })
    };
  }
};