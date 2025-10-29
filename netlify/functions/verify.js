const axios = require('axios');

exports.handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    };
  }

  const { fid } = event.queryStringParameters;

  if (!fid) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'FID parameter is required' }),
    };
  }

  try {
    // Fetch user data and followers in parallel
    const [userResponse, followersResponse] = await Promise.all([
      axios.get(`https://api.farcaster.xyz/v2/user?fid=${fid}`, {
        timeout: 15000,
      }),
      axios.get(`https://api.farcaster.xyz/v2/followers?fid=${fid}&limit=100`, {
        timeout: 15000,
      }),
    ]);

    const user = userResponse.data?.result?.user;
    const followers = followersResponse.data?.result?.users || [];

    if (!user) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user,
        followers,
        success: true,
      }),
    };
  } catch (error) {
    console.error('Farcaster API error:', error.response?.data || error.message);

    // Handle different types of errors
    let statusCode = 500;
    let errorMessage = 'Failed to fetch data from Farcaster API';

    if (error.response?.status === 404) {
      statusCode = 404;
      errorMessage = 'User not found';
    } else if (error.code === 'ECONNABORTED') {
      statusCode = 408;
      errorMessage = 'Request timeout';
    }

    return {
      statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: errorMessage,
        details: error.response?.data?.message || error.message,
      }),
    };
  }
};