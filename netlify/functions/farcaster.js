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

  const { fid, username } = event.queryStringParameters;

  if (!fid && !username) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'FID or username parameter is required' })
    };
  }

  try {
    console.log(`Fetching data for: ${fid ? `FID: ${fid}` : `username: ${username}`}`);

    let userResponse;
    
    if (fid) {
      // Search by FID
      userResponse = await axios.get(`https://api.farcaster.xyz/v2/user?fid=${fid}`, {
        timeout: 15000
      });
    } else {
      // Search by username
      userResponse = await axios.get(`https://api.farcaster.xyz/v2/user-by-username?username=${username}`, {
        timeout: 15000
      });
    }
    console.log(userResponse)
    const user = userResponse.data?.result?.user;

    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Get followers using the user's FID
    const followersResponse = await axios.get(`https://api.farcaster.xyz/v2/followers?fid=${user.fid}&limit=100`, {
      timeout: 15000
    });

    const followers = followersResponse.data?.result?.users || [];

    console.log(`User found: ${user.username}, Followers: ${followers.length}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user,
        followers,
        success: true,
      }),
    };
  } catch (error) {
    console.error('Farcaster API error:', error.message);

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
      headers,
      body: JSON.stringify({
        error: errorMessage,
        details: error.response?.data?.message || error.message,
      }),
    };
  }
};