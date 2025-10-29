import React, { useState, useEffect } from "react";
import axios from "axios";

// Add spinner styles to document head
const addSpinnerStyles = () => {
  if (document.getElementById('spinner-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'spinner-styles';
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `;
  document.head.appendChild(style);
};

// User Profile Component
const UserProfile = ({ user }) => {
  if (!user) return null;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      width: '100%',
      maxWidth: '400px',
      textAlign: 'center',
      marginBottom: '24px'
    }}>
      <img
        src={user.pfp?.url || "https://via.placeholder.com/80"}
        alt="Profile"
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          margin: '0 auto 16px'
        }}
        onError={(e) => {
          e.target.src = "https://via.placeholder.com/80";
        }}
      />
      <h2 style={{
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '4px'
      }}>
        @{user.username || "Unknown"}
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '8px' }}>
        {user.displayName || "No Display Name"} 
        {user.profile?.accountLevel && ` • ${user.profile.accountLevel}`}
      </p>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        fontSize: '14px',
        color: '#6b7280',
        marginTop: '8px'
      }}>
        <span>Followers: {user.followerCount?.toLocaleString() || 0}</span>
        <span>Following: {user.followingCount?.toLocaleString() || 0}</span>
      </div>
      {user.profile?.bio?.text && (
        <p style={{
          color: '#6b7280',
          fontSize: '14px',
          marginTop: '12px',
          lineHeight: '1.4'
        }} className="line-clamp-2">
          {user.profile.bio.text}
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
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '12px'
      }}>
        Followers ({followers.length})
      </h3>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        padding: '16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px'
      }}>
        {followers.slice(0, visibleCount).map((f) => (
          <div key={f.fid} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px'
          }}>
            <img
              src={f.pfp?.url || "https://via.placeholder.com/40"}
              alt={`${f.username}'s avatar`}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                marginBottom: '8px'
              }}
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/40";
              }}
            />
            <p style={{
              fontSize: '14px',
              fontWeight: '500',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              maxWidth: '100%'
            }}>
              @{f.username || "unknown"}
            </p>
          </div>
        ))}
      </div>
      {visibleCount < followers.length && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={loadMore}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
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
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '32px 0'
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      border: '3px solid #f3f4f6',
      borderTop: '3px solid #2563eb',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
  </div>
);

export default function App() {
  const [input, setInput] = useState(""); // Changed from 'fid' to 'input'
  const [user, setUser] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMiniApp, setIsMiniApp] = useState(false);

  // Add spinner styles on component mount
  useEffect(() => {
    addSpinnerStyles();
    setIsMiniApp(!!window.FarcasterMiniAppSDK);
  }, []);

  // Input validation - allow both numbers (FID) and letters (username)
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
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
        setError("Farcaster SDK not available, please enter FID or username manually");
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
      setInput(currentFid.toString());

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
      setError(err.message || "Quick Auth failed. You can enter FID or username manually.");
    } finally {
      setLoading(false);
    }
  };

  // Manual fetch handler - now supports both FID and username
  const handleManualFetch = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    resetStates();

    try {
      let apiUrl;
      
      // Check if input is numeric (FID) or alphanumeric (username)
      if (/^\d+$/.test(input.trim())) {
        // It's a FID (only numbers)
        apiUrl = `/.netlify/functions/farcaster?fid=${input.trim()}`;
      } else {
        // It's a username (remove @ if present and use username endpoint)
        const username = input.trim().replace('@', '');
        apiUrl = `/.netlify/functions/farcaster?username=${username}`;
      }

      // Use Netlify function to fetch data
      const res = await axios.get(apiUrl, {
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
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to fetch user data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Clear results and start over
  const handleClear = () => {
    setInput("");
    resetStates();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #dbeafe, #e0e7ff)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: '800px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            🌐 Farcaster Dashboard
          </h1>
          <p style={{ color: '#6b7280' }}>
            Explore Farcaster profiles and followers
          </p>
        </div>

        {/* Authentication Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          padding: '24px',
          marginBottom: '32px',
          maxWidth: '500px',
          width: '100%',
          margin: '0 auto 32px'
        }}>
          {isMiniApp && !user && (
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <button
                onClick={handleQuickAuth}
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#9ca3af' : '#9333ea',
                  color: 'white',
                  padding: '16px 32px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '18px',
                  fontWeight: '600',
                  width: '100%',
                  maxWidth: '300px',
                  marginBottom: '16px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      marginRight: '8px',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Signing in...
                  </span>
                ) : (
                  "Sign in with Farcaster"
                )}
              </button>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>- OR -</p>
            </div>
          )}

          {/* Manual Input Section */}
          {!user && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '100%',
                maxWidth: '300px'
              }}>
                <input
                  type="text"
                  placeholder="Enter FID or username (e.g., 193356 or injinda)"
                  value={input}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  style={{
                    border: '1px solid #d1d5db',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    width: '100%'
                  }}
                  disabled={loading}
                />
                <button
                  onClick={handleManualFetch}
                  disabled={!input.trim() || loading}
                  style={{
                    backgroundColor: (!input.trim() || loading) ? '#9ca3af' : '#2563eb',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        marginRight: '8px',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Loading...
                    </span>
                  ) : (
                    "Fetch Profile"
                  )}
                </button>
              </div>
              <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>
                Enter a Farcaster ID (e.g., 193356) or username (e.g., injinda)
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '12px 16px',
              borderRadius: '8px',
              textAlign: 'center',
              marginTop: '16px'
            }}>
              <strong>Error: </strong>
              {error}
            </div>
          )}

          {/* Clear Button when user is loaded */}
          {user && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                onClick={handleClear}
                style={{
                  color: '#6b7280',
                  background: 'none',
                  border: 'none',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
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
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ color: '#6b7280', fontSize: '18px' }}>No followers found</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ marginTop: '48px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
        <p>Built with Farcaster API • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}