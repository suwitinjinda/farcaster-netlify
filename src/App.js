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
const Badge = ({ type, text, color, tooltip, isSpecial = false, emoji = "" }) => (
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
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }}
    title={tooltip}
  >
    {emoji && <span>{emoji}</span>}
    {text}
  </span>
);

// ShareButtons Component ที่อัปเดตแล้ว
const ShareButtons = ({ user, score, tier, onchainData }) => {
  if (!user) return null;

  // Mini App URL
  const miniAppUrl = "https://farcaster.xyz/miniapps/YDBKZm-stAPU/farcaster-dashboard";
  
  const shareText = `🎯 My Farcaster Badge Score: ${score}% (${tier} Tier)! 
  
${onchainData?.portfolioValue ? `💰 Portfolio: $${onchainData.portfolioValue.toLocaleString()}` : ''}
${onchainData?.transactionCount ? `⛓️ ${onchainData.transactionCount} TXs` : ''}
${onchainData?.nftCount ? `🖼️ ${onchainData.nftCount} NFTs` : ''}
${user.followerCount ? `👥 ${user.followerCount} followers` : ''}

Check your badge criteria at Farcaster Dashboard!

${miniAppUrl}

#Farcaster #BadgeScore #Web3`;

  const shareUrl = window.location.href;

  const shareToFarcaster = async () => {
    try {
      // Send analytics event
      await fetch('/.netlify/functions/analytics-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'share_badge_score',
          user_fid: user.fid,
          score: score,
          tier: tier,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.log('Analytics event failed (non-critical)');
    }

    if (window.Farcaster && window.Farcaster.share) {
      // ใน Mini App environment
      window.Farcaster.share({
        text: shareText,
        url: miniAppUrl
      });
    } else {
      // ใน Web environment
      const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`;
      window.open(farcasterUrl, '_blank');
    }
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(miniAppUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  const openMiniApp = () => {
    window.open(miniAppUrl, '_blank');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${miniAppUrl}`);
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
        📢 Share Your Badge Score
      </h4>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center'
      }}>
        {/* Mini App Button */}
        <button
          onClick={openMiniApp}
          style={{
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            justifyContent: 'center'
          }}
        >
          <span>🚀</span>
          Open in Farcaster Mini App
        </button>

        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          width: '100%'
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
              gap: '6px',
              flex: 1
            }}
          >
            <span>🌐</span>
            Share on Warpcast
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
              gap: '6px',
              flex: 1
            }}
          >
            <span>🐦</span>
            Share on X
          </button>
        </div>

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
            gap: '6px',
            width: '100%',
            justifyContent: 'center'
          }}
        >
          <span>📋</span>
          Copy Share Text
        </button>
      </div>

      {/* Mini App QR Code Section */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <p style={{ fontSize: '12px', color: '#475569', marginBottom: '8px', fontWeight: '600' }}>
          📱 Scan to open in Farcaster:
        </p>
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            backgroundColor: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            fontSize: '10px',
            color: '#64748b',
            textAlign: 'center',
            padding: '8px'
          }}>
            QR Code Placeholder
            <br />
            (Use QR generator service)
          </div>
          <p style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', margin: 0 }}>
            {miniAppUrl}
          </p>
        </div>
      </div>
    </div>
  );
};

// Criteria Item Component
const CriteriaItem = ({ item }) => (
  <div style={{
    padding: '6px 0',
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
        fontWeight: item.achieved ? '600' : '400',
        fontSize: '11px'
      }}>
        {item.achieved ? '✅ ' : '○ '}{item.label}
      </span>
      <span style={{ 
        color: item.achieved ? '#10b981' : '#6b7280',
        fontSize: '10px',
        fontWeight: '600'
      }}>
        {typeof item.value === 'number' && item.target !== true 
          ? `${item.value.toLocaleString()}/${item.target.toLocaleString()}` 
          : ''} 
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
);

// Badge Criteria Progress Component
const BadgeCriteria = ({ user, onchainData }) => {
  if (!user) return null;

  const criteria = [
    // Social & Profile Criteria (35 points)
    {
      id: 'follower_count',
      label: 'Followers ≥ 1,000',
      achieved: user.followerCount >= 1000,
      value: user.followerCount,
      target: 1000,
      weight: 15,
      description: 'Build a strong community with 1,000+ followers',
      category: 'social',
      emoji: '👥'
    },
    {
      id: 'account_level',
      label: 'PRO Account',
      achieved: user.profile?.accountLevel === 'pro',
      value: user.profile?.accountLevel || 'standard',
      target: 'pro',
      weight: 10,
      description: 'Upgrade to PRO account for premium features',
      category: 'social',
      emoji: '⭐'
    },
    {
      id: 'active_profile',
      label: 'Complete Profile',
      achieved: !!(user.profile?.bio?.text && user.pfp?.url),
      value: !!(user.profile?.bio?.text && user.pfp?.url),
      target: true,
      weight: 10,
      description: 'Complete profile with bio and PFP',
      category: 'social',
      emoji: '📝'
    },

    // Wallet & Multi-chain Criteria (25 points)
    {
      id: 'wallet_connected',
      label: 'Wallet Connected',
      achieved: user.walletData?.hasWallets,
      value: user.walletData?.totalWallets || 0,
      target: 1,
      weight: 10,
      description: 'Connect wallet to Farcaster profile',
      category: 'wallet',
      emoji: '👛'
    },
    {
      id: 'multi_chain',
      label: 'Multi-chain User',
      achieved: user.walletData?.ethAddresses.length > 0 && user.walletData?.solanaAddresses.length > 0,
      value: (user.walletData?.ethAddresses.length > 0 ? 1 : 0) + (user.walletData?.solanaAddresses.length > 0 ? 1 : 0),
      target: 2,
      weight: 15,
      description: 'Use both Ethereum and Solana networks',
      category: 'wallet',
      emoji: '⛓️'
    },

    // On-chain Activity Criteria (40 points)
    {
      id: 'transaction_count',
      label: '10+ Transactions',
      achieved: onchainData?.transactionCount >= 10,
      value: onchainData?.transactionCount || 0,
      target: 10,
      weight: 10,
      description: 'Active on-chain user with 10+ transactions',
      category: 'onchain',
      emoji: '🔄'
    },
    {
      id: 'nft_holder',
      label: 'NFT Collector',
      achieved: onchainData?.nftCount >= 1,
      value: onchainData?.nftCount || 0,
      target: 1,
      weight: 10,
      description: 'Holder of NFTs (any collection)',
      category: 'onchain',
      emoji: '🖼️'
    },
    {
      id: 'defi_user',
      label: 'DeFi User',
      achieved: onchainData?.hasDeFiActivity,
      value: onchainData?.hasDeFiActivity,
      target: true,
      weight: 10,
      description: 'Participated in DeFi protocols',
      category: 'onchain',
      emoji: '🏦'
    },
    {
      id: 'portfolio_value',
      label: 'Portfolio ≥ $1,000',
      achieved: onchainData?.portfolioValue >= 1000,
      value: onchainData?.portfolioValue || 0,
      target: 1000,
      weight: 10,
      description: 'Portfolio value of $1,000 or more',
      category: 'onchain',
      emoji: '💰'
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

  // Group criteria by category
  const socialCriteria = criteria.filter(item => item.category === 'social');
  const walletCriteria = criteria.filter(item => item.category === 'wallet');
  const onchainCriteria = criteria.filter(item => item.category === 'onchain');

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
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
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

      {/* Social Criteria */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#8b5cf6', marginBottom: '8px' }}>
          🌟 Social & Profile ({socialCriteria.filter(s => s.achieved).length}/{socialCriteria.length})
        </h4>
        {socialCriteria.map((item) => (
          <CriteriaItem key={item.id} item={item} />
        ))}
      </div>

      {/* Wallet Criteria */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#f59e0b', marginBottom: '8px' }}>
          👛 Wallet & Multi-chain ({walletCriteria.filter(s => s.achieved).length}/{walletCriteria.length})
        </h4>
        {walletCriteria.map((item) => (
          <CriteriaItem key={item.id} item={item} />
        ))}
      </div>

      {/* On-chain Criteria */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#10b981', marginBottom: '8px' }}>
          ⛓️ On-chain Activity ({onchainCriteria.filter(s => s.achieved).length}/{onchainCriteria.length})
        </h4>
        {onchainCriteria.map((item) => (
          <CriteriaItem key={item.id} item={item} />
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
          <li>Connect both Ethereum and Solana wallets</li>
          <li>Make on-chain transactions regularly</li>
          <li>Collect NFTs from various collections</li>
          <li>Use DeFi protocols for trading</li>
          <li>Grow your Farcaster followers</li>
        </ul>
      </div>

      {/* Share Section */}
      <ShareButtons user={user} score={Math.round(progressPercentage)} tier={tier.name} onchainData={onchainData} />
    </div>
  );
};

// Enhanced User Profile Component with More Badges
const UserProfile = ({ user, currentUser, onchainData }) => {
  if (!user) return null;

  // Badge configurations
  const getAccountLevelBadge = (level) => {
    switch(level) {
      case 'pro': return { color: '#8b5cf6', text: 'PRO', tooltip: 'PRO account holder', emoji: '⭐' };
      case 'premium': return { color: '#f59e0b', text: 'PREMIUM', tooltip: 'Premium account holder', emoji: '🌟' };
      case 'standard': return { color: '#6b7280', text: 'STANDARD', tooltip: 'Standard account', emoji: '📱' };
      default: return null;
    }
  };

  const accountLevelBadge = user.profile?.accountLevel ? getAccountLevelBadge(user.profile.accountLevel) : null;
  const isEarlyAdopter = user.profile?.earlyWalletAdopter;
  const isPowerUser = user.followerCount >= 1000 && user.followingCount >= 500;
  const isActiveUser = !!(user.profile?.bio?.text && user.pfp?.url);
  const hasMultipleConnections = user.connectedAccounts?.length >= 3;
  const isMultiChain = user.walletData?.ethAddresses.length > 0 && user.walletData?.solanaAddresses.length > 0;
  const isDeFiUser = onchainData?.hasDeFiActivity;
  const isNFTHolder = onchainData?.nftCount >= 1;
  const isHighPortfolio = onchainData?.portfolioValue >= 1000;
  const isActiveTrader = onchainData?.transactionCount >= 50;

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
        {/* Social Badges */}
        {accountLevelBadge && (
          <Badge 
            type="accountLevel" 
            text={accountLevelBadge.text} 
            color={accountLevelBadge.color}
            tooltip={accountLevelBadge.tooltip}
            emoji={accountLevelBadge.emoji}
          />
        )}
        {isEarlyAdopter && (
          <Badge 
            type="earlyAdopter" 
            text="Early Adopter" 
            color="#f59e0b"
            tooltip="Early wallet adopter - OG status!"
            emoji="🚀"
          />
        )}
        {user.pfp?.verified && (
          <Badge 
            type="verified" 
            text="Verified PFP" 
            color="#10b981"
            tooltip="Verified profile picture"
            emoji="✅"
          />
        )}
        {isPowerUser && (
          <Badge 
            type="powerUser" 
            text="Power User" 
            color="#dc2626"
            tooltip="1k+ followers & 500+ following"
            emoji="⚡"
            isSpecial={true}
          />
        )}

        {/* Wallet Badges */}
        {user.walletData?.hasWallets && (
          <Badge 
            type="walletConnected" 
            text={`${user.walletData.totalWallets} Wallets`} 
            color="#3b82f6"
            tooltip="Connected wallets to profile"
            emoji="👛"
          />
        )}
        {isMultiChain && (
          <Badge 
            type="multiChain" 
            text="Multi-chain" 
            color="#8b5cf6"
            tooltip="Uses both Ethereum and Solana"
            emoji="⛓️"
            isSpecial={true}
          />
        )}

        {/* On-chain Badges */}
        {isDeFiUser && (
          <Badge 
            type="defiUser" 
            text="DeFi User" 
            color="#059669"
            tooltip="Active DeFi protocol user"
            emoji="🏦"
          />
        )}
        {isNFTHolder && (
          <Badge 
            type="nftHolder" 
            text={`${onchainData?.nftCount || 0} NFTs`} 
            color="#ec4899"
            tooltip="NFT collector"
            emoji="🖼️"
          />
        )}
        {isHighPortfolio && (
          <Badge 
            type="whale" 
            text="Portfolio > $1k" 
            color="#f59e0b"
            tooltip="High portfolio value"
            emoji="🐋"
            isSpecial={true}
          />
        )}
        {isActiveTrader && (
          <Badge 
            type="activeTrader" 
            text="Active Trader" 
            color="#dc2626"
            tooltip="50+ transactions"
            emoji="🔁"
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

      {/* On-chain Stats */}
      {onchainData && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          fontSize: '12px',
          color: '#6b7280',
          marginTop: '12px',
          padding: '8px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px'
        }}>
          <span>⛓️ {onchainData.transactionCount} TXs</span>
          <span>🖼️ {onchainData.nftCount} NFTs</span>
          {onchainData.portfolioValue > 0 && (
            <span>💰 ${onchainData.portfolioValue.toLocaleString()}</span>
          )}
        </div>
      )}

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

      {/* Wallet Addresses */}
      {user.walletData?.hasWallets && (
        <div style={{ marginTop: '12px' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Connected Wallets:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
            {user.walletData.ethAddresses.slice(0, 2).map((address, index) => (
              <span key={index} style={{
                backgroundColor: '#e5e7eb',
                color: '#374151',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontFamily: 'monospace'
              }}>
                ETH: {address.substring(0, 8)}...{address.substring(address.length - 6)}
              </span>
            ))}
            {user.walletData.solanaAddresses.slice(0, 2).map((address, index) => (
              <span key={index} style={{
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontFamily: 'monospace'
              }}>
                SOL: {address.substring(0, 8)}...{address.substring(address.length - 6)}
              </span>
            ))}
          </div>
        </div>
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
              Checking Badges...
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
  const [onchainData, setOnchainData] = useState(null);
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

  // Function to extract primary wallet address
  const extractPrimaryWalletAddress = (userData) => {
    if (!userData.walletData) return null;
    
    // Prefer Ethereum primary address
    const primaryEth = userData.walletData.primaryEthAddress;
    if (primaryEth) return { address: primaryEth, protocol: 'ethereum' };
    
    // Fallback to first Ethereum address
    const firstEth = userData.walletData.ethAddresses[0];
    if (firstEth) return { address: firstEth, protocol: 'ethereum' };
    
    // Fallback to Solana primary address
    const primarySol = userData.walletData.primarySolAddress;
    if (primarySol) return { address: primarySol, protocol: 'solana' };
    
    // Fallback to first Solana address
    const firstSol = userData.walletData.solanaAddresses[0];
    if (firstSol) return { address: firstSol, protocol: 'solana' };
    
    return null;
  };

  // Function to fetch on-chain data
  const fetchOnchainData = async (userData) => {
    try {
      const walletInfo = extractPrimaryWalletAddress(userData);
      
      if (walletInfo) {
        console.log('Fetching on-chain data for:', walletInfo.address);
        const res = await axios.get(
          `/.netlify/functions/onchain-enhanced?address=${walletInfo.address}&protocol=${walletInfo.protocol}`,
          { timeout: 10000 }
        );
        setOnchainData(res.data);
      } else {
        // No wallet connected
        setOnchainData({
          hasWallet: false,
          transactionCount: 0,
          nftCount: 0,
          totalGasSpent: 0,
          hasDeFiActivity: false,
          portfolioValue: 0,
          degenScore: 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch on-chain data:', error);
      setOnchainData({
        hasWallet: false,
        transactionCount: 0,
        nftCount: 0,
        totalGasSpent: 0,
        hasDeFiActivity: false,
        portfolioValue: 0,
        degenScore: 0,
        error: 'Failed to fetch on-chain data'
      });
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const resetStates = () => {
    setUser(null);
    setFollowers([]);
    setOnchainData(null);
    setError("");
  };

  const handleFetchUserData = async (searchInput) => {
    setLoading(true);
    resetStates();

    try {
      let apiUrl;
      if (/^\d+$/.test(searchInput.trim())) {
        apiUrl = `/.netlify/functions/farcaster-real?fid=${searchInput.trim()}`;
      } else {
        const username = searchInput.trim().replace('@', '');
        apiUrl = `/.netlify/functions/farcaster-real?username=${username}`;
      }

      const res = await axios.get(apiUrl, { timeout: 15000 });
      const { user, followers } = res.data;
      
      if (!user) {
        setError("User not found");
        return;
      }
      
      setUser(user);
      setFollowers(followers || []);
      
      // ดึง on-chain data ถ้ามี wallet
      await fetchOnchainData(user);
      
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

  // เพิ่ม analytics tracking ใน App.js
const trackAnalyticsEvent = async (eventName, data = {}) => {
  try {
    await fetch('/.netlify/functions/analytics-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventName,
        user_fid: user?.fid || currentUser?.fid,
        mode: mode,
        timestamp: new Date().toISOString(),
        ...data
      })
    });
  } catch (error) {
    // Silent fail - analytics is non-critical
    console.log(`Analytics event ${eventName} failed (non-critical)`);
  }
};

// ใช้ใน functions ต่างๆ
const handleManualFetch = async () => {
  if (!input.trim()) return;
  
  // Track search event
  await trackAnalyticsEvent('user_search', {
    search_query: input,
    search_type: /^\d+$/.test(input.trim()) ? 'fid' : 'username'
  });
  
  handleFetchUserData(input);
  };
  
const handleShareToFarcaster = async () => {
    await trackAnalyticsEvent('share_farcaster', {
      score: score,
      tier: tier,
      user_fid: user?.fid
    });
  }
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
       // ใน Header section ของ App.js - เพิ่ม promotion
<div style={{ textAlign: 'center', marginBottom: '32px' }}>
  <h1 style={{
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '8px'
  }}>
    🎯 Farcaster Badge Criteria
  </h1>
  <p style={{ color: '#6b7280', marginBottom: '12px' }}>
    {mode === 'mini' ? 'MiniApp Mode' : 'Web Mode'} • Check your badge criteria & airdrop eligibility
  </p>
  
  {/* Mini App Promotion */}
  {mode === 'web' && (
    <div style={{
      backgroundColor: '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: '8px',
      padding: '12px',
      margin: '0 auto',
      maxWidth: '400px'
    }}>
      <p style={{ 
        fontSize: '14px', 
        color: '#0369a1', 
        margin: '0 0 8px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        <span>🚀</span>
        <strong>Try the Farcaster Mini App!</strong>
      </p>
      <a
        href="https://farcaster.xyz/miniapps/YDBKZm-stAPU/farcaster-dashboard"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          backgroundColor: '#8b5cf6',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '6px',
          textDecoration: 'none',
          fontSize: '12px',
          fontWeight: '600',
          display: 'inline-block'
        }}
      >
        Open in Farcaster
      </a>
    </div>
  )}
</div>      

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
        {user && <BadgeCriteria user={user} onchainData={onchainData} />}

        {/* User Profile */}
        {user && <UserProfile user={user} currentUser={currentUser} onchainData={onchainData} />}

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