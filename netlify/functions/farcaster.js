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

    const user = userResponse.data?.result?.user;

    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Get followers
    const followersResponse = await axios.get(`https://api.farcaster.xyz/v2/followers?fid=${user.fid}&limit=100`, {
      timeout: 15000
    });

    const followers = followersResponse.data?.result?.users || [];

    // NEW: Get user's verifications (wallet addresses)
    let verifications = [];
    try {
      const verificationsResponse = await axios.get(`https://api.farcaster.xyz/v2/verifications?fid=${user.fid}`, {
        timeout: 10000
      });
      verifications = verificationsResponse.data?.result?.verifications || [];
      console.log(`Found ${verifications.length} verifications for user ${user.fid}`);
    } catch (error) {
      console.log('Could not fetch verifications:', error.message);
    }

    // NEW: Get user's custody address and wallet connections
    let custodyAddress = null;
    let connectedAddresses = [];
    
    try {
      // Get user's custody address (primary wallet)
      const custodyResponse = await axios.get(`https://api.farcaster.xyz/v2/custody-address?fid=${user.fid}`, {
        timeout: 10000
      });
      custodyAddress = custodyResponse.data?.result?.custodyAddress;
      console.log(`Custody address for ${user.fid}:`, custodyAddress);
    } catch (error) {
      console.log('Could not fetch custody address:', error.message);
    }

    // Process wallet data from verifications
    const walletData = {
      hasWallets: verifications.length > 0 || !!custodyAddress,
      totalWallets: verifications.length + (custodyAddress ? 1 : 0),
      custodyAddress: custodyAddress,
      verifications: verifications,
      ethAddresses: verifications.filter(v => v.protocol === 'ethereum').map(v => v.address),
      solanaAddresses: verifications.filter(v => v.protocol === 'solana').map(v => v.address),
      primaryEthAddress: verifications.find(v => v.protocol === 'ethereum')?.address || null,
      primarySolAddress: verifications.find(v => v.protocol === 'solana')?.address || null
    };

    console.log(`User found: ${user.username}, Followers: ${followers.length}, Wallets: ${walletData.totalWallets}`);
    console.log('Wallet data:', {
      hasWallets: walletData.hasWallets,
      ethAddresses: walletData.ethAddresses,
      solanaAddresses: walletData.solanaAddresses,
      custodyAddress: walletData.custodyAddress
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: {
          ...user,
          walletData: walletData
        },
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