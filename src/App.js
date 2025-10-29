import React, { useState, useEffect } from "react";
import axios from "axios";
import { sdk } from '@farcaster/miniapp-sdk'

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
    .pulse-gold {
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    .glow {
      box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
    }
  `;
  document.head.appendChild(style);
};

// Badge Component
const Badge = ({ type, text, color, tooltip, isSpecial = false }) => (
  <span 
    style={{
      backgroundColor: color,
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: '600',
      margin: '2px',
      textTransform: 'uppercase',
      border: isSpecial ? '2px solid gold' : 'none',
      animation: isSpecial ? 'pulse 2s infinite' : 'none',
      cursor: tooltip ? 'help' : 'default',
      position: 'relative'
    }}
    title={tooltip}
  >
    {text}
    {isSpecial && ' ⭐'}
  </span>
);

// Share Buttons Component
const ShareButtons = ({ user, score, tier }) => {
  if (!user) return null;

  const shareText = `🚀 My Farcaster Airdrop Score: ${score}% (${tier} Tier)! 
  
Check your eligibility at Farcaster Dashboard!

@${user.username} • ${user.followerCount} followers • ${user.followingCount} following

#Farcaster #Airdrop #Web3`;

  const shareUrl = window.location.href;

  const shareToFarcaster = () => {
    if (window.Farcaster && window.Farcaster.share) {
      window.Farcaster.share({
        text: shareText,
        url: shareUrl
      });
    } else {
      // Fallback for web
      const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`;
      window.open(farcasterUrl, '_blank');
    }
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      alert('Copied to clipboard! 📋');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '16px',
      marginBottom: '24px',
      maxWidth: '400px',
      width: '100%',
      textAlign: 'center'
    }}>
      <h4 style={{
        fontSize: '16px',
        fontWeight: '600',
        marginBottom: '12px',
        color: '#1f2937'
      }}>
        📢 Share Your Score
      </h4>
      
      <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={shareToFarcaster}
          style={{
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🌐</span>
          Share on Farcaster
        </button>
        
        <button
          onClick={shareToTwitter}
          style={{
            backgroundColor: '#1da1f2',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🐦</span>
          Share on X
        </button>
        
        <button
          onClick={copyToClipboard}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>📋</span>
          Copy
        </button>
      </div>
    </div>
  );
};

// Badge Criteria Progress Component
const BadgeCriteria = ({ user }) => {
  if (!user) return null;

  const criteria = [
    {
      id: 'follower_count',
      label: 'Followers ≥ 1,000',
      achieved: user.followerCount >= 1000,
      value: user.followerCount,
      target: 1000,
      weight: 25,
      description: 'Build a strong community with 1,000+ followers'
    },
    {
      id: 'following_count',
      label: 'Following ≥ 500',
      achieved: user.followingCount >= 500,
      value: user.followingCount,
      target: 500,
      weight: 15,
      description: 'Be an active member by following 500+ accounts'
    },
    {
      id: 'account_level',
      label: 'PRO Account',
      achieved: user.profile?.accountLevel === 'pro',
      value: user.profile?.accountLevel || 'standard',
      target: 'pro',
      weight: 20,
      description: 'Upgrade to PRO account for premium features'
    },
    {
      id: 'early_adopter',
      label: 'Early Adopter',
      achieved: user.profile?.earlyWalletAdopter === true,
      value: user.profile?.earlyWalletAdopter,
      target: true,
      weight: 15,
      description: 'Early wallet adopter - OG status!'
    },
    {
      id: 'connected_accounts',
      label: '≥ 3 Connected Accounts',
      achieved: user.connectedAccounts?.length >= 3,
      value: user.connectedAccounts?.length || 0,
      target: 3,
      weight: 10,
      description: 'Connect multiple social accounts for wider reach'
    },
    {
      id: 'active_user',
      label: 'Active User (Bio + PFP)',
      achieved: !!(user.profile?.bio?.text && user.pfp?.url),
      value: !!(user.profile?.bio?.text && user.pfp?.url),
      target: true,
      weight: 15,
      description: 'Complete your profile with bio and profile picture'
    }
  ];

  const totalScore = criteria.reduce((sum, item) => 
    sum + (item.achieved ? item.weight : 0), 0
  );
  const maxScore = criteria.reduce((sum, item) => sum + item.weight, 0);
  const progressPercentage = (totalScore / maxScore) * 100;

  const getTier = (score) => {
    if (score >= 80) return { name: 'DIAMOND', color: '#8b5cf6', emoji: '💎' };
    if (score >= 60) return { name: 'GOLD', color: '#f59e0b', emoji: '🥇' };
    if (score >= 40) return { name: 'SILVER', color: '#9ca3af', emoji: '🥈' };
    return { name: 'BRONZE', color: '#b45309', emoji: '🥉' };
  };

  const tier = getTier(progressPercentage);

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '20px',
      marginBottom: '24px',
      maxWidth: '400px',
      width: '100%'
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '16px',
        textAlign: 'center',
        color: '#1f2937'
      }}>
        🎯 Badge Criteria & Airdrop Score
      </h3>

      {/* Progress Bar */}
      <div style={{
        backgroundColor: '#f3f4f6',
        borderRadius: '10px',
        height: '20px',
        marginBottom: '16px',
        overflow: 'hidden'
      }}>
        <div 
          style={{
            backgroundColor: tier.color,
            height: '100%',
            borderRadius: '10px',
            width: `${progressPercentage}%`,
            transition: 'width 0.5s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          {Math.round(progressPercentage)}%
        </div>
      </div>

      {/* Tier Badge */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <Badge 
          type="tier" 
          text={`${tier.emoji} ${tier.name} TIER`} 
          color={tier.color}
          isSpecial={progressPercentage >= 60}
          tooltip={`Your airdrop eligibility score: ${Math.round(progressPercentage)}%`}
        />
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
          Score: {totalScore}/{maxScore} points
        </p>
      </div>

      {/* Criteria List */}
      <div style={{ fontSize: '12px' }}>
        {criteria.map((item) => (
          <div key={item.id} style={{
            padding: '8px 0',
            borderBottom: '1px solid #f3f4f6',
            cursor: 'pointer'
          }}
          title={item.description}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2px'
            }}>
              <span style={{ 
                color: item.achieved ? '#10b981' : '#6b7280',
                fontWeight: item.achieved ? '600' : '400'
              }}>
                {item.achieved ? '✅ ' : '○ '}{item.label}
              </span>
              <span style={{ 
                color: item.achieved ? '#10b981' : '#6b7280',
                fontSize: '10px',
                fontWeight: '600'
              }}>
                {typeof item.value === 'number' ? `${item.value.toLocaleString()}/${item.target.toLocaleString()}` : ''} 
                {item.achieved && ` +${item.weight}pts`}
              </span>
            </div>
            <div style={{
              fontSize: '10px',
              color: '#9ca3af',
              fontStyle: 'italic'
            }}>
              {item.description}
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div style={{
        marginTop: '12px',
        padding: '10px',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        border: '1px solid #bae6fd'
      }}>
        <p style={{ fontSize: '11px', color: '#0369a1', margin: 0, fontWeight: '600' }}>
          💡 How to improve your score:
        </p>
        <ul style={{ fontSize: '10px', color: '#0369a1', margin: '4px 0 0 0', paddingLeft: '16px' }}>
          <li>Engage with community to grow followers</li>
          <li>Upgrade to PRO account for premium features</li>
          <li>Connect Twitter/X and other social accounts</li>
          <li>Complete your profile with bio and PFP</li>
          <li>Be active and post regularly</li>
        </ul>
      </div>

      {/* Share Section */}
      <ShareButtons user={user} score={Math.round(progressPercentage)} tier={tier.name} />
    </div>
  );
};

// Enhanced User Profile Component
const UserProfile = ({ user, currentUser }) => {
  if (!user) return null;

  const getAccountLevelBadge = (level) => {
    switch(level) {
      case 'pro': return { color: '#8b5cf6', text: 'PRO', tooltip: 'PRO account holder' };
      case 'premium': return { color: '#f59e0b', text: 'PREMIUM', tooltip: 'Premium account holder' };
      case 'standard': return { color: '#6b7280', text: 'STANDARD', tooltip: 'Standard account' };
      default: return null;
    }
  };

  const accountLevelBadge = user.profile?.accountLevel ? getAccountLevelBadge(user.profile.accountLevel) : null;
  const isEarlyAdopter = user.profile?.earlyWalletAdopter;
  const isPowerUser = user.followerCount >= 1000 && user.followingCount >= 500;
  const isActiveUser = !!(user.profile?.bio?.text && user.pfp?.url);
  const hasMultipleConnections = user.connectedAccounts?.length >= 3;

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
          margin: '0 auto 16px',
          border: user.pfp?.verified ? '2px solid #10b981' : 'none'
        }}
        onError={(e) => {
          e.target.src = "https://via.placeholder.com/80";
        }}
      />
      
      {/* Achievement Badges row */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {accountLevelBadge && (
          <Badge 
            type="accountLevel" 
            text={accountLevelBadge.text} 
            color={accountLevelBadge.color}
            tooltip={accountLevelBadge.tooltip}
          />
        )}
        {isEarlyAdopter && (
          <Badge 
            type="earlyAdopter" 
            text="Early Adopter" 
            color="#f59e0b"
            tooltip="Early wallet adopter - OG status!"
          />
        )}
        {user.pfp?.verified && (
          <Badge 
            type="verified" 
            text="Verified PFP" 
            color="#10b981"
            tooltip="Verified profile picture"
          />
        )}
        {isPowerUser && (
          <Badge 
            type="powerUser" 
            text="Power User" 
            color="#dc2626"
            tooltip="1k+ followers & 500+ following"
            isSpecial={true}
          />
        )}
        {hasMultipleConnections && (
          <Badge 
            type="connected" 
            text={`${user.connectedAccounts?.length} Connected`} 
            color="#3b82f6"
            tooltip="Multiple connected social accounts"
          />
        )}
        {isActiveUser && (
          <Badge 
            type="active" 
            text="Active User" 
            color="#10b981"
            tooltip="Complete profile with bio and PFP"
          />
        )}
      </div>

      <h2 style={{
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '4px'
      }}>
        @{user.username || "Unknown"}
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '8px' }}>
        {user.displayName || "No Display Name"} • FID: {user.fid}
      </p>
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        fontSize: '14px',
        color: '#6b7280',
        marginTop: '8px'
      }}>
        <span>👥 {user.followerCount?.toLocaleString() || 0}</span>
        <span>🔄 {user.followingCount?.toLocaleString() || 0}</span>
      </div>

      {user.profile?.bio?.text && (
        <p style={{
          color: '#6b7280',
          fontSize: '14px',
          marginTop: '12px',
          lineHeight: '1.4',
          padding: '12px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px'
        }} className="line-clamp-2">
          {user.profile.bio.text}
        </p>
      )}

      {/* Connected Accounts */}
      {user.connectedAccounts && user.connectedAccounts.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Connected Accounts:</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {user.connectedAccounts.map((account, index) => (
              <span key={index} style={{
                backgroundColor: '#e5e7eb',
                color: '#374151',
                padding: '2px 6px',
                borderRadius: '6px',
                fontSize: '10px'
              }}>
                {account.platform}: {account.username}
                {account.expired && ' ⚠️'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Location */}
      {user.profile?.location?.description && (
        <div style={{ marginTop: '8px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            📍 {user.profile.location.description}
          </span>
        </div>
      )}
      
      {/* Show current user info if different from viewed profile */}
      {currentUser && currentUser.fid !== user.fid && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #bae6fd'
        }}>
          <p style={{ fontSize: '12px', color: '#0369a1', margin: 0 }}>
            👋 You're signed in as @{currentUser.username}
          </p>
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

// Manual Search Component (Web Mode Only)
const ManualSearch = ({ input, onInputChange, onSearch, onClear, loading, user, error }) => (
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
          placeholder="Enter FID or username"
          value={input}
          onChange={onInputChange}
          onKeyPress={(e) => e.key === 'Enter' && onSearch()}
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
          onClick={onSearch}
          disabled={!input.trim() || loading}
          style={{
            backgroundColor: (!input.trim() || loading) ? '#9ca3af' : '#8b5cf6',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
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
              Checking...
            </span>
          ) : (
            "🎯 Check Badge Criteria"
          )}
        </button>
      </div>
      <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>
        Enter any Farcaster ID or username to check badge criteria and airdrop eligibility
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

    {/* Clear Button when user is loaded */}
    {user && (
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <button
          onClick={onClear}
          style={{
            color: '#6b7280',
            background: 'none',
            border: 'none',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Check Another User
        </button>
      </div>
    )}
  </div>
);

export default function App() {
  const [input, setInput] = useState("");
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mode, setMode] = useState('web');

  useEffect(() => {
    addSpinnerStyles();
    detectEnvironment();
  }, []);

  const detectEnvironment = async () => {
    try {
      const isMiniApp = await sdk.isInMiniApp()
      if (isMiniApp) {
        console.log('Running in Farcaster MiniApp mode');
        setMode('mini');
        setIsMiniApp(true);
        autoLoginMiniApp();
      } else {
        console.log('Running in Web mode');
        setMode('web');
        setIsMiniApp(false);
      }
    } catch (error) {
      console.error('Error detecting environment:', error);
      setMode('web');
      setIsMiniApp(false);
    }
  };

  const autoLoginMiniApp = async () => {
    setLoading(true);
    try {
      const { token } = await sdk.quickAuth.getToken();
      console.log('Token received');
      
      if (token) {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const fid = tokenPayload.sub;
        
        console.log('Extracted FID from token:', fid);
        
        if (fid) {
          const userInfo = {
            fid: parseInt(fid),
            username: 'user_' + fid,
            displayName: 'User ' + fid
          };
          
          setCurrentUser(userInfo);
          setIsLoggedIn(true);
          setInput(fid.toString());
          await handleFetchUserData(fid.toString());
        }
      }
    } catch (err) {
      console.error('MiniApp auto-login failed:', err);
      setError('Auto-login failed. Please try manual search.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
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

  const handleManualFetch = () => {
    if (!input.trim()) return;
    handleFetchUserData(input);
  };

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
            🎯 Farcaster Badge Criteria
          </h1>
          <p style={{ color: '#6b7280' }}>
            {mode === 'mini' ? 'MiniApp Mode' : 'Web Mode'} • Check your badge criteria & airdrop eligibility
          </p>
        </div>

        {/* MiniApp Mode */}
        {mode === 'mini' && (
          <div>
            {loading && <LoadingSpinner />}
            {error && (
              <div style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '12px 16px',
                borderRadius: '8px',
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                <strong>Error: </strong>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Web Mode */}
        {mode === 'web' && (
          <ManualSearch 
            input={input}
            onInputChange={handleInputChange}
            onSearch={handleManualFetch}
            onClear={handleClear}
            loading={loading}
            user={user}
            error={error}
          />
        )}

        {/* Badge Criteria Progress */}
        {user && <BadgeCriteria user={user} />}

        {/* User Profile */}
        {user && <UserProfile user={user} currentUser={currentUser} />}

        {/* Empty State */}
        {user && followers.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ color: '#6b7280', fontSize: '18px' }}>No followers data available</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ marginTop: '48px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
        <p>Built with Farcaster API • Check your badge criteria & share your score • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}