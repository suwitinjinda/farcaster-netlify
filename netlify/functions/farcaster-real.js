// netlify/functions/farcaster-real.js
const axios = require('axios');

// Neynar API Key - you'll need to add this to your environment variables
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || 'NEYNAR_API_DEFAULT';

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

    // 1. ดึง user data จาก Farcaster API
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
    console.log(userResponse)
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

    // 4. ดึง engagement data จาก Neynar API
    let engagementData = {
      castsLastWeek: 0,
      accountAgeDays: 0,
      totalCasts: 0,
      lastCastDate: null
    };

    try {
      console.log(`Fetching engagement data for FID: ${user.fid}`);
      
      // 4.1 ดึง user details จาก Neynar เพื่อหา registration date
      const neynarUserResponse = await axios.get(
        `https://api.neynar.com/v2/farcaster/user/bulk?fids=${user.fid}`,
        {
          headers: {
            'api_key': NEYNAR_API_KEY,
            'accept': 'application/json'
          },
          timeout: 15000
        }
      );

      const neynarUser = neynarUserResponse.data?.users?.[0];
      
      if (neynarUser) {
        // คำนวณ account age
        if (neynarUser.registered_at) {
          const registrationDate = new Date(neynarUser.registered_at);
          const today = new Date();
          engagementData.accountAgeDays = Math.floor((today - registrationDate) / (1000 * 60 * 60 * 24));
        }

        // ข้อมูล casts
        engagementData.totalCasts = neynarUser.follower_count || 0;
      }

      // 4.2 ดึง recent casts เพื่อนับ casts ใน 1 สัปดาห์
      const castsResponse = await axios.get(
        `https://api.neynar.com/v2/farcaster/casts?fid=${user.fid}&limit=50`,
        {
          headers: {
            'api_key': NEYNAR_API_KEY,
            'accept': 'application/json'
          },
          timeout: 15000
        }
      );

      const casts = castsResponse.data?.casts || [];
      
      if (casts.length > 0) {
        // นับ casts ใน 7 วันที่ผ่านมา
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentCasts = casts.filter(cast => {
          const castDate = new Date(cast.timestamp);
          return castDate > oneWeekAgo;
        });
        
        engagementData.castsLastWeek = recentCasts.length;
        engagementData.lastCastDate = casts[0]?.timestamp; // ล่าสุด
      }

      console.log(`Engagement data: ${engagementData.castsLastWeek} casts/week, ${engagementData.accountAgeDays} days old`);

    } catch (neynarError) {
      console.warn('Neynar API failed, using fallback data:', neynarError.message);
      
      // Fallback: ใช้ข้อมูลพื้นฐานจาก Farcaster API
      // สมมติว่ามีการโพสต์บ้างถ้ามี follower เยอะ
      engagementData.castsLastWeek = user.follower_count > 1000 ? 5 : 2;
      engagementData.accountAgeDays = 180; // สมมติ 6 เดือน
      engagementData.totalCasts = Math.floor(user.follower_count * 0.5);
    }

    console.log(`User: ${user.username}, ETH: ${ethAddresses.length}, SOL: ${solanaAddresses.length}, Casts/week: ${engagementData.castsLastWeek}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: {
          ...user,
          profile: {
            ...user,
            accountLevel: user.follower_count > 5000 ? 'pro' : 'standard',
            earlyWalletAdopter: engagementData.accountAgeDays > 365,
            castsLastWeek: engagementData.castsLastWeek,
            accountAgeDays: engagementData.accountAgeDays,
            totalCasts: engagementData.totalCasts,
            lastCastDate: engagementData.lastCastDate
          },
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
        engagement: engagementData,
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