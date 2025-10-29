import axios from "axios";

export async function handler(event, context) {
  try {
    const { fid } = event.queryStringParameters || {};
    if (!fid) return { statusCode: 400, body: JSON.stringify({ error: "FID required" }) };

    const userRes = await axios.get(`https://api.farcaster.xyz/v2/user?fid=${fid}`);
    const followersRes = await axios.get(`https://api.farcaster.xyz/v2/followers?fid=${fid}&limit=100`);

      console.log(userRes)
    return {
      statusCode: 200,
      body: JSON.stringify({
        user: userRes.data.result.user,
        followers: followersRes.data.result?.users || [],
      }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
