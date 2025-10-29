import React, { useState, useEffect } from "react";
import axios from "axios"; // Make sure this import is at the top

// User Profile Component
const UserProfile = ({ user }) => {
  if (!user) return null;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md text-center mb-6">
      <img
        src={user.pfp?.url || "https://via.placeholder.com/80"}
        alt="Profile"
        className="w-20 h-20 rounded-full mx-auto mb-4"
        onError={(e) => {
          e.target.src = "https://via.placeholder.com/80";
        }}
      />
      <h2 className="text-xl font-semibold mb-1">
        @{user.username || "Unknown"}
      </h2>
      <p className="text-gray-600 mb-2">
        {user.displayName || "No Display Name"} 
        {user.profile?.accountLevel && ` • ${user.profile.accountLevel}`}
      </p>
      <div className="flex justify-center space-x-4 text-sm text-gray-500">
        <span>Followers: {user.followerCount?.toLocaleString() || 0}</span>
        <span>Following: {user.followingCount?.toLocaleString() || 0}</span>
      </div>
      {user.profile?.bio && (
        <p className="text-gray-600 text-sm mt-3 line-clamp-2">
          {user.profile.bio}
        </p>
      )}
    </div>
  );
};

// Follower List Component
const FollowerList = ({ followers }) => {
  const [visibleCount, setVisibleCount] = useState(12);

  const loadMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  return (
    <div className="w-full max-w-2xl">
      <h3 className="text-lg font-bold mb-3">
        Followers ({followers.length})
      </h3>
      <div className="bg-white rounded-xl shadow-md p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
        {followers.slice(0, visibleCount).map((f) => (
          <div key={f.fid} className="flex flex-col items-center p-2 hover:bg-gray-50 rounded">
            <img
              src={f.pfp?.url || "https://via.placeholder.com/40"}
              alt={`${f.username}'s avatar`}
              className="w-12 h-12 rounded-full mb-2"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/40";
              }}
            />
            <p className="text-sm font-medium truncate max-w-full">
              @{f.username || "unknown"}
            </p>
          </div>
        ))}
      </div>
      {visibleCount < followers.length && (
        <div className="text-center mt-4">
          <button
            onClick={loadMore}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Load More ({followers.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

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

  // Input validation
  const validateFid = (input) => {
    return input.replace(/[^0-9]/g, '');
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setFid(validateFid(value));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleManualFetch();
    }
  };

  // Reset states
  const resetStates = () => {
    setUser(null);
    setFollowers([]);
    setError("");
  };

  // Quick Auth handler
  const handleQuickAuth = async () => {
    setLoading(true);
    setError("");
    try {
      const sdk = window.FarcasterMiniAppSDK;
      if (!sdk?.quickAuth?.getToken) {
        setError("Farcaster SDK not available, please enter FID manually");
        setLoading(false);
        return;
      }

      const { token } = await sdk.quickAuth.getToken();
      
      if (!token) {
        throw new Error("No token received from Quick Auth");
      }

      // Use Netlify function to verify token
      const res = await axios.get("/.netlify/functions/verify", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      if (!res.data?.fid) {
        throw new Error("No FID received from verification");
      }

      const currentFid = res.data.fid;
      setFid(currentFid.toString());

      // Use Netlify function to fetch user data
      const userRes = await axios.get(`/.netlify/functions/farcaster?fid=${currentFid}`, {
        timeout: 15000
      });

      const { user, followers } = userRes.data;
      
      if (!user) {
        throw new Error("User data not found");
      }

      setUser(user);
      setFollowers(followers || []);
      
    } catch (err) {
      console.error("Quick Auth error:", err);
      setError(err.message || "Quick Auth failed. You can enter FID/username manually.");
    } finally {
      setLoading(false);
    }
  };

  // Manual fetch handler
  const handleManualFetch = async () => {
    if (!fid.trim()) return;
    
    setLoading(true);
    resetStates();

    try {
      // Use Netlify function to fetch data
      const res = await axios.get(`/.netlify/functions/farcaster?fid=${fid}`, {
        timeout: 15000
      });
      
      console.log("Proxy response:", res.data);
      const { user, followers } = res.data;
      
      if (!user) {
        setError("User not found");
        return;
      }
      
      setUser(user);
      setFollowers(followers || []);
    } catch (err) {
      console.error("Frontend fetch error:", err);
      setError(
        err.response?.status === 404 
          ? "User not found" 
          : "Failed to fetch user data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Clear results and start over
  const handleClear = () => {
    setFid("");
    resetStates();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🌐 Farcaster Dashboard</h1>
          <p className="text-gray-600">Explore Farcaster profiles and followers</p>
        </div>

        {/* Authentication Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          {isMiniApp && !user && (
            <div className="text-center mb-6">
              <button
                onClick={handleQuickAuth}
                disabled={loading}
                className="bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 mb-4 transition-colors duration-200 font-semibold text-lg w-full max-w-md"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </span>
                ) : (
                  "Sign in with Farcaster"
                )}
              </button>
              <p className="text-gray-500 text-sm">- OR -</p>
            </div>
          )}

          {/* Manual Input Section */}
          {!user && (
            <div className="flex flex-col items-center space-y-4">
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full max-w-md">
                <input
                  type="text"
                  placeholder="Enter Farcaster ID (FID)"
                  value={fid}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="flex-1 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
                <button
                  onClick={handleManualFetch}
                  disabled={!fid.trim() || loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium whitespace-nowrap"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading...
                    </span>
                  ) : (
                    "Fetch Profile"
                  )}
                </button>
              </div>
              <p className="text-gray-500 text-sm text-center">
                Enter a Farcaster ID to view profile and followers
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
              <strong className="font-medium">Error: </strong>
              {error}
            </div>
          )}

          {/* Clear Button when user is loaded */}
          {user && (
            <div className="text-center mt-4">
              <button
                onClick={handleClear}
                className="text-gray-500 hover:text-gray-700 underline text-sm transition-colors"
              >
                Search Another User
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && <LoadingSpinner />}

        {/* User Profile */}
        <UserProfile user={user} />

        {/* Followers List */}
        {followers.length > 0 && <FollowerList followers={followers} />}

        {/* Empty State */}
        {user && followers.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No followers found</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Built with Farcaster API • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}