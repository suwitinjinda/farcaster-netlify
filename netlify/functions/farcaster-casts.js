const axios = require('axios');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const { fid } = event.queryStringParameters;

  if (!fid) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'FID parameter is required' })
    };
  }

  try {
    console.log(`Fetching casts for FID: ${fid}`);

    // Get user's recent casts with engagement data
    const castsResponse = await axios.get(`https://api.farcaster.xyz/v2/casts?fid=${fid}&limit=25`, {
      timeout: 15000
    });

    const casts = castsResponse.data?.result?.casts || [];

    console.log(`Found ${casts.length} casts for user ${fid}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        casts: casts,
        total: casts.length,
        success: true,
      }),
    };
  } catch (error) {
    console.error('Farcaster API error:', error.message);

    let statusCode = 500;
    let errorMessage = 'Failed to fetch cast data from Farcaster API';

    if (error.response?.status === 404) {
      statusCode = 404;
      errorMessage = 'User not found';
    } else if (error.code === 'ECONNABORTED') {
      statusCode = 408;
      errorMessage = 'Request timeout';
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        error: errorMessage,
        details: error.response?.data?.message || error.message,
      }),
    };
  }
};