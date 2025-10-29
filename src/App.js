import React, { useState, useEffect } from "react";
import axios from "axios";

export default function App() {
  const [fid, setFid] = useState("");
  const [user, setUser] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMiniApp, setIsMiniApp] = useState(false);

  // Detect if running inside Farcaster MiniApp
  useEffect(() => {
    setIsMiniApp(!!window.FarcasterMiniAppSDK);
  }, []);

  const fetchUser = async (fid) => {
    try {
      const res = await axios.get(`https://api.farcaster.xyz/v2/user?fid=${fid}`);
      return res.data?.result?.user || null;
    } catch {
      return null;
    }
  };

  const fetchFollowers = async (fid) => {
    try {
      const res = await axios.get(`https://api.farcaster.xyz/v2/followers?fid=${fid}&limit=100`);
      return res.data?.result?.users || [];
    } catch {
      return [];
    }
  };

  const handleQuickAuth = async () => {
    setLoading(true);
    setError("");
    try {
      const sdk = window.FarcasterMiniAppSDK;
      const { token } = await sdk.quickAuth.getToken();

      // Verify token via Netlify function
      const res = await axios.get("/.netlify/functions/verify", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const currentFid = res.data.fid;
      setFid(currentFid);

      const userData = await fetchUser(currentFid);
      const followerData = await fetchFollowers(currentFid);

      setUser(userData);
      setFollowers(followerData);
    } catch (err) {
      console.error(err);
      setError("Quick Auth failed. You can enter FID/username manually.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualFetch = async () => {
    if (!fid) return;
    setLoading(true);
    setError("");
    setUser(null);
    setFollowers([]);

    try {
      let currentFid = fid;

      // If input is username, get FID
      if (isNaN(fid)) {
        const res = await axios.get(`https://api.farcaster.xyz/v2/user?username=${fid}`);
        currentFid = res.data?.result?.user?.fid;
        if (!currentFid) {
          setError("Username not found");
          setLoading(false);
          return;
        }
      }

      const userData = await fetchUser(currentFid);
      const followerData = await fetchFollowers(currentFid);

      setFid(currentFid);
      setUser(userData);
      setFollowers(followerData);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">🌐 Farcaster Dashboard</h1>

      {/* Quick Auth button if in MiniApp */}
      {isMiniApp && !fid && (
        <button
          onClick={handleQuickAuth}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 mb-4"
        >
          {loading ? "Signing in..." : "Sign in with Farcaster"}
        </button>
      )}

      {/* Manual input fallback */}
      {!fid && (
        <div className="flex space-x-2 mb-6">
          <input
            type="text"
            placeholder="Enter FID or username"
            value={fid}
            onChange={(e) => setFid(e.target.value)}
            className="border px-3 py-2 rounded-lg w-48"
          />
          <button
            onClick={handleManualFetch}
            disabled={!fid || loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? "Loading..." : "Fetch"}
          </button>
        </div>
      )}

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {user && (
        <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md text-center mb-6">
          <img
            src={user.pfp?.url || "https://via.placeholder.com/80"}
            alt="pfp"
            className="w-20 h-20 rounded-full mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold mb-1">@{user.username || "Unknown"}</h2>
          <p className="text-gray-600">{user.displayName || "No Display Name"} {user.profile?.accountLevel || ""}</p>
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
