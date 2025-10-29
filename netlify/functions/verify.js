import axios from "axios";

export async function handler(event, context) {
  try {
    const { fid } = event.queryStringParameters || {};
    console.log("Requested FID:", fid);

    if (!fid) {
      return { statusCode: 400, body: JSON.stringify({ error: "FID required" }) };
    }

    const userRes = await axios.get(`https://api.farcaster.xyz/v2/user?fid=${fid}`);
    console.log("User response:", userRes.data);

    const user = userRes.data?.result?.user || null;

    const followersRes = await axios.get(`https://api.farcaster.xyz/v2/followers?fid=${fid}&limit=100`);
    console.log("Followers response:", followersRes.data);

    const followers = followersRes.data?.result?.users || [];

    return {
      statusCode: 200,
      body: JSON.stringify({ user, followers }),
    };
  } catch (err) {
    console.error("Error fetching Farcaster data:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch Farcaster data", details: err.message }),
    };
  }
}
