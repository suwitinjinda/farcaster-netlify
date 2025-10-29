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

// Welcome Component - Shows different options based on environment
const WelcomeScreen = ({ onManualSearch, onMiniAppLogin, isMiniApp, loading }) => {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '32px',
      textAlign: 'center',
      maxWidth: '480px',
      margin: '0 auto',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        backgroundColor: '#8b5cf6',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        fontSize: '32px'
      }}>
        🌐
      </div>
      
      <h2 style={{ 
        fontSize: '28px', 
        fontWeight: 'bold', 
        color: '#1f2937',
        marginBottom: '12px'
      }}>
        Farcaster Dashboard
      </h2>
      
      <p style={{ 
        color: '#6b7280', 
        marginBottom: '32px',
        fontSize: '16px',
        lineHeight: '1.5'
      }}>
        Explore Farcaster profiles, followers, and social connections
      </p>

      {/* MiniApp Mode */}
      {isMiniApp && (
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={onMiniAppLogin}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#9ca3af' : '#8b5cf6',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '18px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              width: '100%',
              marginBottom: '16px'
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
                  marginRight: '12px',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Connecting to Warpcast...
              </span>
            ) : (
              "Connect Your Farcaster Account"
            )}
          </button>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            🔒 Secure connection via Warpcast MiniApp
          </p>
        </div>
      )}

      {/* Manual Search Option */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <h4 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#374151',
          marginBottom: '12px'
        }}>
          {isMiniApp ? 'Or search manually:' : 'Get started:'}
        </h4>
        
        <button
          onClick={onManualSearch}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '14px 28px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          🔍 Search Farcaster Profile
        </button>
        
        <p style={{ 
          fontSize: '14px', 
          color: '#6b7280', 
          marginTop: '12px',
          textAlign: 'left'
        }}>
          Enter any Farcaster ID or username to explore profiles and followers
        </p>
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        border: '1px solid #bae6fd'
      }}>
        <p style={{ 
          fontSize: '14px', 
          color: '#0369a1',
          margin: 0,
          textAlign: 'left'
        }}>
          💡 <strong>Tip:</strong> {isMiniApp 
            ? 'Connect your account to automatically view your own profile, or search any user manually.' 
            : 'Enter a Farcaster ID (e.g., 193356) or username (e.g., injinda) to get started.'}
        </p>
      </div>
    </div>
  );
};

export default function App() {
  const [input, setInput] = useState("");
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [mode, setMode] = useState('web');

  // Add spinner styles on component mount
  useEffect(() => {
    addSpinnerStyles();
    detectEnvironment();
  }, []);

  // Detect if we're in a MiniApp environment
  const detectEnvironment = () => {
    // Check for Farcaster MiniApp SDK
    if (window.FarcasterMiniAppSDK) {
      console.log('Running in Farcaster MiniApp mode');
      setMode('mini');
      setIsMiniApp(true);
    } else {
      console.log('Running in Web mode');
      setMode('web');
      setIsMiniApp(false);
    }
  };

  // MiniApp authentication
  const handleMiniAppLogin = async () => {
    setLoading(true);
    setError("");
    
    try {
      const sdk = window.FarcasterMiniAppSDK;
      if (sdk?.quickAuth?.getToken) {
        const { token } = await sdk.quickAuth.getToken();
        
        if (token) {
          // Verify token and get user info
          const res = await axios.get("/.netlify/functions/verify", {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          });

          if (res.data?.fid) {
            const userInfo = {
              fid: res.data.fid,
              username: res.data.username,
              displayName: res.data.displayName,
              pfp: res.data.pfp
            };
            
            setCurrentUser(userInfo);
            setShowWelcome(false);
            
            // Auto-load the current user's profile
            setInput(userInfo.fid.toString());
            await handleFetchUserData(userInfo.fid.toString());
          }
        } else {
          throw new Error('No token received from Warpcast');
        }
      } else {
        throw new Error('MiniApp SDK not available');
      }
    } catch (err) {
      console.error('MiniApp login failed:', err);
      setError('Failed to connect to Warpcast. Please try manual search.');
    } finally {
      setLoading(false);
    }
  };

  // Manual search mode
  const handleManualSearch = () => {
    setShowWelcome(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleManualFetch();
    }
  };

  const resetStates = () => {
    setUser(null);
    setFollowers([]);
    setError("");
  };

  const handleFetchUserData = async (searchInput) => {
    setLoading(true);
    resetStates();

    try {
      let apiUrl;
      
      if (/^\d+$/.test(searchInput.trim())) {
        apiUrl = `/.netlify/functions/farcaster?fid=${searchInput.trim()}`;
      } else {
        const username = searchInput.trim().replace('@', '');
        apiUrl = `/.netlify/functions/farcaster?username=${username}`;
      }

      const res = await axios.get(apiUrl, { timeout: 15000 });
      
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

  const handleManualFetch = () => {
    if (!input.trim()) return;
    handleFetchUserData(input);
  };

  const handleBackToWelcome = () => {
    setShowWelcome(true);
    setInput("");
    resetStates();
  };

  const handleClearSearch = () => {
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
            {mode === 'mini' ? 'MiniApp Mode' : 'Web Mode'} 
            {currentUser && ` • Connected as @${currentUser.username}`}
          </p>
        </div>

        {/* Welcome Screen */}
        {showWelcome ? (
          <WelcomeScreen 
            onManualSearch={handleManualSearch}
            onMiniAppLogin={handleMiniAppLogin}
            isMiniApp={isMiniApp}
            loading={loading}
          />
        ) : (
          /* Main App Interface */
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
            {/* Back to Welcome */}
            <button
              onClick={handleBackToWelcome}
              style={{
                backgroundColor: 'transparent',
                color: '#6b7280',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ← Back
            </button>

            {/* Search Input */}
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
                width: '100%'
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
                <div style={{ display: 'flex', gap: '8px' }}>
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
                      flex: 1
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
                        Searching...
                      </span>
                    ) : (
                      "🔍 Search Profile"
                    )}
                  </button>
                  
                  {input && (
                    <button
                      onClick={handleClearSearch}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#6b7280',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        cursor: 'pointer'
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              
              <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>
                Enter any Farcaster ID or username to explore their profile and followers
              </p>
            </div>

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
          </div>
        )}

        {/* Loading State */}
        {loading && <LoadingSpinner />}

        {/* User Profile */}
        {!showWelcome && <UserProfile user={user} />}

        {/* Followers List */}
        {!showWelcome && followers.length > 0 && <FollowerList followers={followers} />}

        {/* Empty State */}
        {!showWelcome && user && followers.length === 0 && !loading && (
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