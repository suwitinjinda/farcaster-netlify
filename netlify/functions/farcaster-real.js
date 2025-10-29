// netlify/functions/farcaster-real.js
const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
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
    console.log(`Fetching real data for: ${fid ? `FID: ${fid}` : `username: ${username}`}`);

    // 1. ดึง user data
    let userResponse;
    if (fid) {
      userResponse = await axios.get(`https://api.farcaster.xyz/v2/user?fid=${fid}`, {
        timeout: 15000
      });
    } else {
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

    // 2. ดึง wallet addresses
    const verificationsResponse = await axios.get(`https://api.farcaster.xyz/v2/verifications?fid=${user.fid}`, {
      timeout: 15000
    });

    const verifications = verificationsResponse.data?.result?.verifications || [];
    
    // แยก Ethereum และ Solana addresses
    const ethAddresses = verifications
      .filter(v => v.protocol === 'ethereum')
      .map(v => v.address);
    
    const solanaAddresses = verifications
      .filter(v => v.protocol === 'solana')
      .map(v => v.address);

    const primaryEthAddress = verifications.find(v => v.protocol === 'ethereum' && v.isPrimary)?.address;
    const primarySolAddress = verifications.find(v => v.protocol === 'solana' && v.isPrimary)?.address;

    // 3. ดึง followers
    const followersResponse = await axios.get(`https://api.farcaster.xyz/v2/followers?fid=${user.fid}&limit=100`, {
      timeout: 15000
    });

    const followers = followersResponse.data?.result?.users || [];

    console.log(`User: ${user.username}, ETH: ${ethAddresses.length}, SOL: ${solanaAddresses.length}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: {
          ...user,
          walletData: {
            hasWallets: verifications.length > 0,
            totalWallets: verifications.length,
            ethAddresses,
            solanaAddresses,
            primaryEthAddress,
            primarySolAddress,
            verifications,
            walletLabels: verifications.map(v => ({
              address: v.address,
              protocol: v.protocol,
              isPrimary: v.isPrimary,
              label: v.label,
              labels: v.labels
            }))
          }
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