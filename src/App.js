import React, { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import axios from "axios";

export default function App() {
  const [fid, setFid] = useState(null);
  const [user, setUser] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Helper: fetch user profile
  const fetchUser = async (fid) => {
    try {
      const res = await axios.get(`https://api.farcaster.xyz/v2/user?fid=${fid}`);
      return res.data?.result?.user || null;
    } catch {
      return null;
    }
  };

  // Helper: fetch followers
  const fetchFollowers = async (fid) => {
    try {
      const res = await axios.get(`https://api.farcaster.xyz/v2/followers?fid=${fid}&limit=100`);
      return res.data?.result?.users || [];
    } catch {
      return [];
    }
  };

  // Detect MiniApp environment
useEffect(() => {
  const init = async () => {
    let currentFid;

    // Check if MiniApp environment exists
    if (sdk?.quickAuth?.getToken) {
      try {
        const { token } = await sdk.quickAuth.getToken();
        // You can send token to your backend to validate and get fid
        currentFid = "2"; // fallback or backend-provided fid
      } catch (err) {
        console.error("MiniApp auth failed", err);
        currentFid = "2"; // fallback fid
      }
    } else {
      // Local dev fallback
      currentFid = "2"; // your test fid
    }

    setFid(currentFid);

    const userData = await fetchUser(currentFid);
    const followerData = await fetchFollowers(currentFid);
    setUser(userData);
    setFollowers(followerData);
  };

  init();
}, []);


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">🌐 Farcaster Dashboard</h1>

      {loading && <p className="text-gray-700 mb-4">Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {user && (
        <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md text-center mb-6">
          <img
            src={user.pfp?.url || "https://via.placeholder.com/80"}
            alt="pfp"
            className="w-20 h-20 rounded-full mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold mb-1">@{user.username || "Unknown"}</h2>
          <p className="text-gray-600">
            {user.displayName || "No Display Name"} {user.profile?.accountLevel || ""}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Followers: {user.followerCount || 0} Following: {user.followingCount || 0}
          </p>
        </div>
      )}

      {followers.length > 0 && (
        <div className="w-full max-w-2xl">
          <h3 className="text-lg font-bold mb-3">Followers</h3>
          <div className="bg-white rounded-xl shadow-md p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {followers.slice(0, 12).map((f) => (
              <div key={f.fid} className="flex flex-col items-center">
                <img
                  src={f.pfp?.url || "https://via.placeholder.com/40"}
                  alt="follower"
                  className="w-12 h-12 rounded-full"
                />
                <p className="text-sm mt-1">@{f.username || "unknown"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
