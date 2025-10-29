import axios from "axios";

export async function handler(event, context) {
  try {
    const { fid } = event.queryStringParameters || {};

    if (!fid) {
      return { statusCode: 400, body: JSON.stringify({ error: "FID required" }) };
    }

    // Fetch user
    const userRes = await axios.get(`https://api.farcaster.xyz/v2/user?fid=${fid}`);
    const user = userRes.data?.result?.user || null;

    // Fetch followers
    const followersRes = await axios.get(`https://api.farcaster.xyz/v2/followers?fid=${fid}&limit=100`);
    const followers = followersRes.data?.result?.users || [];

    return {
      statusCode: 200,
      body: JSON.stringify({ user, followers }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch Farcaster data", details: err.message }),
    };
  }
}
