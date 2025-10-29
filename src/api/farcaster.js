import axios from "axios";

const BASE_URL = "https://api.farcaster.xyz/v2";

// get user profile
export async function getUser(fid) {
  const res = await axios.get(`${BASE_URL}/user?fid=${fid}`);
  return res.data.result.user;
}

// get user followers
export async function getFollowers(fid, limit = 100) {
  const res = await axios.get(`${BASE_URL}/followers?fid=${fid}&limit=${limit}`);
  return res.data.result.users;
}
