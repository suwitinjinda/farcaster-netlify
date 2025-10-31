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
  `;
  document.head.appendChild(style);
};

// Initialize SDK and call ready()
const initializeSDK = async () => {
  try {
    await sdk.actions.ready();
    console.log('✅ Farcaster SDK ready called successfully');
  } catch (error) {
    console.error('❌ Failed to call sdk.actions.ready():', error);
  }
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

// ShareButtons Component (Standalone - Outside Main Card)
const ShareButtons = ({ user, score, tier, onchainData }) => {
  if (!user) return null;

  const shareText = `🎯 My Farcaster Badge Score: ${score}% (${tier} Tier)! 
  
${onchainData?.transactionCount ? `⛓️ ${onchainData.transactionCount} TXs` : ''}
${onchainData?.nftCount ? `🖼️ ${onchainData.nftCount} NFTs` : ''}
${user.followerCount ? `👥 ${user.followerCount} followers` : ''}
${user.profile?.accountLevel === 'pro' ? `⭐ PRO Account` : ''}

Check your badge criteria in the Farcaster Dashboard Mini App!

#Farcaster #BadgeScore #Web3`;

  const shareToFarcaster = async () => {
    try {
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
      window.Farcaster.share({
        text: shareText
      });
    } else {
      const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`;
      window.open(farcasterUrl, '_blank');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      alert('Copied to clipboard! 📋');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.15)',
      padding: '20px',
      marginBottom: '24px',
      maxWidth: '400px',
      width: '100%',
      textAlign: 'center',
      border: '1px solid #e5e7eb'
    }}>
      <h4 style={{
        fontSize: '18px',
        fontWeight: '700',
        marginBottom: '16px',
        color: '#1f2937',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        🎉 Share Your Achievement
      </h4>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'center'
      }}>
        <button
          onClick={shareToFarcaster}
          style={{
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            padding: '14px 24px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
          }}
        >
          <span style={{ fontSize: '18px' }}>🌐</span>
          Share on Warpcast
        </button>
        
        <button
          onClick={copyToClipboard}
          style={{
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: '2px solid #e5e7eb',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#f8fafc';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
        >
          <span>📋</span>
          Copy Share Text
        </button>
      </div>

      <p style={{
        fontSize: '12px',
        color: '#9ca3af',
        marginTop: '12px',
        lineHeight: '1.4'
      }}>
        Share your progress and encourage friends to check their badge scores!
      </p>
    </div>
  );
};

// Criteria Item Component
const CriteriaItem = ({ item }) => (
  <div style={{
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
        fontWeight: item.achieved ? '600' : '400',
        fontSize: '12px'
      }}>
        {item.achieved ? '✅ ' : '○ '}{item.label}
      </span>
      <span style={{ 
        color: item.achieved ? '#10b981' : '#6b7280',
        fontSize: '11px',
        fontWeight: '600'
      }}>
        {typeof item.value === 'number' && item.target !== true 
          ? `${item.value.toLocaleString()}/${item.target.toLocaleString()}` 
          : ''} 
        {item.achieved && ` +${item.weight}pts`}
      </span>
    </div>
    <div style={{
      fontSize: '11px',
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

  // Calculate account age in days (approximate based on FID)
  const getAccountAge = () => {
    // Lower FID generally means older account
    if (user.fid <= 10000) return 730; // 2+ years
    if (user.fid <= 50000) return 365; // 1-2 years
    if (user.fid <= 200000) return 180; // 6-12 months
    return 90; // 3-6 months
  };

  const criteria = [
    // Social & Engagement Criteria (45 points)
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
      id: 'engagement_ratio',
      label: 'Good Engagement',
      achieved: user.followerCount > 0 && (user.followerCount / (user.followingCount || 1)) >= 0.5,
      value: user.followerCount / (user.followingCount || 1),
      target: 0.5,
      weight: 10,
      description: 'Healthy follower/following ratio',
      category: 'social',
      emoji: '📊'
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

    // Account Age & Loyalty Criteria (30 points)
    {
      id: 'og_user',
      label: 'OG User (2+ years)',
      achieved: getAccountAge() >= 730,
      value: getAccountAge(),
      target: 730,
      weight: 15,
      description: 'Early Farcaster adopter - 2+ years on platform',
      category: 'loyalty',
      emoji: '🏆'
    },
    {
      id: 'early_adopter',
      label: 'Early Adopter',
      achieved: user.profile?.earlyWalletAdopter || getAccountAge() >= 365,
      value: getAccountAge(),
      target: 365,
      weight: 10,
      description: 'Early wallet adopter or 1+ year user',
      category: 'loyalty',
      emoji: '🚀'
    },
    {
      id: 'active_user',
      label: 'Active User (6+ months)',
      achieved: getAccountAge() >= 180,
      value: getAccountAge(),
      target: 180,
      weight: 5,
      description: 'Active on Farcaster for 6+ months',
      category: 'loyalty',
      emoji: '📅'
    },

    // On-chain Activity Criteria (25 points)
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
      id: 'onchain_active',
      label: 'On-chain Active',
      achieved: onchainData?.transactionCount >= 5,
      value: onchainData?.transactionCount || 0,
      target: 5,
      weight: 5,
      description: 'Regular on-chain activity',
      category: 'onchain',
      emoji: '⚡'
    }
  ];

  const totalScore = criteria.reduce((sum, item) => 
    sum + (item.achieved ? item.weight : 0), 0
  );
  const maxScore = criteria.reduce((sum, item) => sum + item.weight, 0);
  const progressPercentage = (totalScore / maxScore) * 100;

  const getTier = (score) => {
    if (score >= 80) return { name: 'LEGEND', color: '#8b5cf6', emoji: '🏆' };
    if (score >= 60) return { name: 'ELITE', color: '#f59e0b', emoji: '⭐' };
    if (score >= 40) return { name: 'PRO', color: '#6b7280', emoji: '🔷' };
    return { name: 'MEMBER', color: '#b45309', emoji: '👤' };
  };

  const tier = getTier(progressPercentage);

  // Group criteria by category
  const socialCriteria = criteria.filter(item => item.category === 'social');
  const loyaltyCriteria = criteria.filter(item => item.category === 'loyalty');
  const onchainCriteria = criteria.filter(item => item.category === 'onchain');

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '20px',
      boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.15)',
      padding: '24px',
      marginBottom: '24px',
      maxWidth: '400px',
      width: '100%',
      border: '1px solid #e5e7eb'
    }}>
      <h3 style={{
        fontSize: '20px',
        fontWeight: 'bold',
        marginBottom: '20px',
        textAlign: 'center',
        color: '#1f2937',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        🎯 Badge Criteria Score
      </h3>

      {/* Progress Bar */}
      <div style={{
        backgroundColor: '#f3f4f6',
        borderRadius: '12px',
        height: '24px',
        marginBottom: '20px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb'
      }}>
        <div 
          style={{
            backgroundColor: tier.color,
            height: '100%',
            borderRadius: '12px',
            width: `${progressPercentage}%`,
            transition: 'width 0.5s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: 'white',
            fontWeight: 'bold',
            boxShadow: `0 2px 8px ${tier.color}40`
          }}
        >
          {Math.round(progressPercentage)}%
        </div>
      </div>

      {/* Tier Badge */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Badge 
          type="tier" 
          text={`${tier.emoji} ${tier.name} TIER`} 
          color={tier.color}
          isSpecial={progressPercentage >= 60}
          tooltip={`Your engagement score: ${Math.round(progressPercentage)}%`}
        />
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px', fontWeight: '500' }}>
          {totalScore}/{maxScore} points • {getAccountAge()} days on Farcaster
        </p>
      </div>

      {/* Social Criteria */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#8b5cf6', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🌟 Social & Engagement ({socialCriteria.filter(s => s.achieved).length}/{socialCriteria.length})
        </h4>
        {socialCriteria.map((item) => (
          <CriteriaItem key={item.id} item={item} />
        ))}
      </div>

      {/* Loyalty Criteria */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#f59e0b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          📅 Account Loyalty ({loyaltyCriteria.filter(s => s.achieved).length}/{loyaltyCriteria.length})
        </h4>
        {loyaltyCriteria.map((item) => (
          <CriteriaItem key={item.id} item={item} />
        ))}
      </div>

      {/* On-chain Criteria */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#10b981', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ⛓️ On-chain Activity ({onchainCriteria.filter(s => s.achieved).length}/{onchainCriteria.length})
        </h4>
        {onchainCriteria.map((item) => (
          <CriteriaItem key={item.id} item={item} />
        ))}
      </div>

      {/* Tips */}
      <div style={{
        marginTop: '16px',
        padding: '16px',
        backgroundColor: '#f0f9ff',
        borderRadius: '12px',
        border: '1px solid #bae6fd'
      }}>
        <p style={{ fontSize: '14px', color: '#0369a1', margin: '0 0 8px 0', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
          💡 Boost Your Score
        </p>
        <ul style={{ fontSize: '12px', color: '#0369a1', margin: '0', paddingLeft: '16px', lineHeight: '1.5' }}>
          <li>Engage regularly with the Farcaster community</li>
          <li>Complete your profile with bio and PFP</li>
          <li>Connect wallets and be active on-chain</li>
          <li>Upgrade to PRO for premium features</li>
        </ul>
      </div>
    </div>
  );
};

// Enhanced User Profile Component with Engagement Badges
const UserProfile = ({ user, currentUser, onchainData }) => {
  if (!user) return null;

  // Calculate engagement metrics
  const getAccountAge = () => {
    if (user.fid <= 10000) return { days: 730, label: 'OG (2+ years)' };
    if (user.fid <= 50000) return { days: 365, label: 'Veteran (1-2 years)' };
    if (user.fid <= 200000) return { days: 180, label: 'Regular (6-12 months)' };
    return { days: 90, label: 'New (3-6 months)' };
  };

  const accountAge = getAccountAge();
  const engagementRatio = user.followerCount > 0 ? (user.followerCount / (user.followingCount || 1)) : 0;
  
  // Enhanced badge conditions for engagement
  const isOG = accountAge.days >= 730;
  const isVeteran = accountAge.days >= 365;
  const isRegular = accountAge.days >= 180;
  const isEarlyAdopter = user.profile?.earlyWalletAdopter;
  const isPowerUser = user.followerCount >= 1000 && user.followingCount >= 500;
  const isActiveUser = !!(user.profile?.bio?.text && user.pfp?.url);
  const isSocialInfluencer = user.followerCount >= 5000;
  const isContentCreator = user.profile?.bio?.text && user.profile.bio.text.length > 50;
  const isVerifiedPFP = user.pfp?.verified;
  const isProAccount = user.profile?.accountLevel === 'pro';
  const isHighEngagement = engagementRatio >= 1.0;
  const isCommunityBuilder = user.followerCount >= 2000 && user.followingCount >= 500;
  const isActiveFollower = user.followingCount >= 1000;
  const isNFTCollector = onchainData?.nftCount >= 1;
  const isOnchainActive = onchainData?.transactionCount >= 10;
  const isSuperActive = onchainData?.transactionCount >= 50;
  const isMultiChain = user.walletData?.ethAddresses?.length > 0 && user.walletData?.solanaAddresses?.length > 0;
  const isWalletConnected = user.walletData?.hasWallets;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '20px',
      boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.15)',
      padding: '24px',
      width: '100%',
      maxWidth: '400px',
      textAlign: 'center',
      marginBottom: '24px',
      border: '1px solid #e5e7eb'
    }}>
      <img
        src={user.pfp?.url || "https://via.placeholder.com/80"}
        alt="Profile"
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          margin: '0 auto 16px',
          border: user.pfp?.verified ? '3px solid #10b981' : '3px solid #e5e7eb',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
        onError={(e) => {
          e.target.src = "https://via.placeholder.com/80";
        }}
      />
      
      {/* Achievement Badges row - Enhanced for engagement */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {/* Account Age & Loyalty Badges */}
        {isOG && (
          <Badge 
            type="og" 
            text="ULTRA OG" 
            color="#8b5cf6"
            tooltip="2+ years on Farcaster - Legendary status!"
            emoji="🏆"
            isSpecial={true}
          />
        )}
        {isVeteran && !isOG && (
          <Badge 
            type="veteran" 
            text="Veteran" 
            color="#f59e0b"
            tooltip="1+ year on Farcaster"
            emoji="⭐"
          />
        )}
        {isRegular && !isVeteran && (
          <Badge 
            type="regular" 
            text="Regular" 
            color="#6b7280"
            tooltip="6+ months on Farcaster"
            emoji="📅"
          />
        )}
        {isEarlyAdopter && (
          <Badge 
            type="earlyAdopter" 
            text="Early Adopter" 
            color="#dc2626"
            tooltip="Early wallet adopter - Pioneer!"
            emoji="🚀"
            isSpecial={true}
          />
        )}

        {/* Social & Engagement Badges */}
        {isProAccount && (
          <Badge 
            type="pro" 
            text="PRO" 
            color="#8b5cf6"
            tooltip="PRO account holder"
            emoji="💎"
          />
        )}
        {isSocialInfluencer && (
          <Badge 
            type="influencer" 
            text="Influencer" 
            color="#ec4899"
            tooltip="5k+ followers - Social star!"
            emoji="📢"
            isSpecial={true}
          />
        )}
        {isPowerUser && (
          <Badge 
            type="powerUser" 
            text="Power User" 
            color="#dc2626"
            tooltip="1k+ followers & 500+ following"
            emoji="⚡"
          />
        )}
        {isCommunityBuilder && (
          <Badge 
            type="community" 
            text="Community Builder" 
            color="#059669"
            tooltip="2k+ followers & active engagement"
            emoji="🌱"
          />
        )}
        {isHighEngagement && (
          <Badge 
            type="engagement" 
            text="High Engagement" 
            color="#10b981"
            tooltip="Excellent follower/following ratio"
            emoji="📊"
          />
        )}
        {isContentCreator && (
          <Badge 
            type="creator" 
            text="Content Creator" 
            color="#8b5cf6"
            tooltip="Detailed bio - Active creator"
            emoji="✍️"
          />
        )}
        {isActiveFollower && (
          <Badge 
            type="connector" 
            text="Super Connector" 
            color="#3b82f6"
            tooltip="Follows 1k+ accounts - Great networker!"
            emoji="🔗"
          />
        )}

        {/* On-chain Badges */}
        {isSuperActive && (
          <Badge 
            type="degen" 
            text="Ultra Degen" 
            color="#dc2626"
            tooltip="50+ transactions - True degen!"
            emoji="🎯"
            isSpecial={true}
          />
        )}
        {isOnchainActive && (
          <Badge 
            type="active" 
            text="On-chain Active" 
            color="#10b981"
            tooltip="10+ transactions"
            emoji="⚡"
          />
        )}
        {isNFTCollector && (
          <Badge 
            type="nft" 
            text="NFT Collector" 
            color="#ec4899"
            tooltip="NFT enthusiast"
            emoji="🖼️"
          />
        )}
        {isMultiChain && (
          <Badge 
            type="multiChain" 
            text="Multi-chain" 
            color="#8b5cf6"
            tooltip="Uses both Ethereum and Solana"
            emoji="⛓️"
          />
        )}
        {isWalletConnected && (
          <Badge 
            type="wallet" 
            text={`${user.walletData.totalWallets} Wallet${user.walletData.totalWallets > 1 ? 's' : ''}`} 
            color="#3b82f6"
            tooltip="Connected wallets"
            emoji="👛"
          />
        )}
      </div>

      <h2 style={{
        fontSize: '22px',
        fontWeight: '700',
        marginBottom: '4px',
        color: '#1f2937'
      }}>
        @{user.username || "Unknown"}
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
        {user.displayName || "No Display Name"} • FID: {user.fid}
      </p>
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        fontSize: '15px',
        color: '#6b7280',
        marginTop: '12px',
        fontWeight: '600'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          👥 {user.followerCount?.toLocaleString() || 0}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          🔄 {user.followingCount?.toLocaleString() || 0}
        </span>
      </div>

      {/* Account Age & Engagement */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        fontSize: '13px',
        color: '#6b7280',
        marginTop: '12px',
        flexWrap: 'wrap'
      }}>
        <span>📅 {accountAge.label}</span>
        {engagementRatio > 0 && (
          <span>📊 {engagementRatio.toFixed(1)} Ratio</span>
        )}
      </div>

      {/* On-chain Stats Summary */}
      {onchainData && (onchainData.transactionCount > 0 || onchainData.nftCount > 0) && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          fontSize: '13px',
          color: '#6b7280',
          marginTop: '12px',
          flexWrap: 'wrap',
          fontWeight: '500'
        }}>
          {onchainData.transactionCount > 0 && (
            <span>🔄 {onchainData.transactionCount} TXs</span>
          )}
          {onchainData.nftCount > 0 && (
            <span>🖼️ {onchainData.nftCount} NFTs</span>
          )}
        </div>
      )}

      {user.profile?.bio?.text && (
        <p style={{
          color: '#6b7280',
          fontSize: '14px',
          marginTop: '16px',
          lineHeight: '1.5',
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }} className="line-clamp-2">
          {user.profile.bio.text}
        </p>
      )}

      {/* Show current user info if different from viewed profile */}
      {currentUser && currentUser.fid !== user.fid && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f0f9ff',
          borderRadius: '12px',
          border: '1px solid #bae6fd'
        }}>
          <p style={{ fontSize: '13px', color: '#0369a1', margin: 0, fontWeight: '500' }}>
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
    padding: '48px 0'
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      border: '3px solid #f3f4f6',
      borderTop: '3px solid #8b5cf6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
  </div>
);

// Manual Search Component (Web Mode Only)
const ManualSearch = ({ input, onInputChange, onSearch, onClear, loading, user, error }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 10px 25px -8px rgba(0, 0, 0, 0.15)',
    padding: '24px',
    marginBottom: '32px',
    maxWidth: '400px',
    width: '100%',
    margin: '0 auto 32px',
    border: '1px solid #e5e7eb'
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
        width: '100%'
      }}>
        <input
          type="text"
          placeholder="Enter FID or username"
          value={input}
          onChange={onInputChange}
          onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          style={{
            border: '2px solid #e5e7eb',
            padding: '14px 16px',
            borderRadius: '12px',
            fontSize: '16px',
            width: '100%',
            transition: 'all 0.2s ease'
          }}
          disabled={loading}
          onFocus={(e) => {
            e.target.style.borderColor = '#8b5cf6';
            e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e5e7eb';
            e.target.style.boxShadow = 'none';
          }}
        />
        <button
          onClick={onSearch}
          disabled={!input.trim() || loading}
          style={{
            backgroundColor: (!input.trim() || loading) ? '#9ca3af' : '#8b5cf6',
            color: 'white',
            padding: '14px 24px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '16px',
            fontWeight: '700',
            cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            boxShadow: (!input.trim() || loading) ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.3)'
          }}
          onMouseOver={(e) => {
            if (!input.trim() || loading) return;
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
          }}
          onMouseOut={(e) => {
            if (!input.trim() || loading) return;
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: '18px',
                height: '18px',
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                marginRight: '10px',
                animation: 'spin 1s linear infinite'
              }}></div>
              Checking Badges...
            </span>
          ) : (
            "🎯 Check Badge Criteria"
          )}
        </button>
      </div>
      <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', lineHeight: '1.5' }}>
        Enter any Farcaster ID or username to check engagement score and badge criteria
      </p>
    </div>

    {/* Error Display */}
    {error && (
      <div style={{
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#dc2626',
        padding: '16px',
        borderRadius: '12px',
        textAlign: 'center',
        marginTop: '16px',
        fontSize: '14px'
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
            fontSize: '14px',
            fontWeight: '500'
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
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    addSpinnerStyles();
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await initializeSDK();
      setSdkReady(true);
      await detectEnvironment();
    } catch (error) {
      console.error('App initialization failed:', error);
      setMode('web');
      setIsMiniApp(false);
    }
  };

  const detectEnvironment = async () => {
    try {
      const isMiniApp = await sdk.isInMiniApp();
      
      if (isMiniApp) {
        console.log('✅ Running in Farcaster MiniApp mode');
        setMode('mini');
        setIsMiniApp(true);
        await autoLoginMiniApp();
      } else {
        console.log('🌐 Running in Web mode');
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
      console.log('🔐 Starting MiniApp auto-login...');
      
      const { token } = await sdk.quickAuth.getToken();
      console.log('✅ Token received from quickAuth');
      
      if (token) {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const fid = tokenPayload.sub;
        
        console.log('📋 Extracted FID from token:', fid);
        
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
      console.error('❌ MiniApp auto-login failed:', err);
      setError('Auto-login failed. Please try manual search.');
    } finally {
      setLoading(false);
    }
  };

  const extractPrimaryWalletAddress = (userData) => {
    if (!userData.walletData) return null;
    
    const primaryEth = userData.walletData.primaryEthAddress;
    if (primaryEth) return { address: primaryEth, protocol: 'base' };
    
    const firstEth = userData.walletData.ethAddresses?.[0];
    if (firstEth) return { address: firstEth, protocol: 'base' };
    
    const custodyAddress = userData.walletData.custodyAddress;
    if (custodyAddress) return { address: custodyAddress, protocol: 'base' };
    
    const primarySol = userData.walletData.primarySolAddress;
    if (primarySol) return { address: primarySol, protocol: 'solana' };
    
    const firstSol = userData.walletData.solanaAddresses?.[0];
    if (firstSol) return { address: firstSol, protocol: 'solana' };
    
    return null;
  };

  const fetchOnchainData = async (userData) => {
    try {
      const walletInfo = extractPrimaryWalletAddress(userData);
      
      if (walletInfo) {
        console.log('🔍 Fetching on-chain data for:', walletInfo.address);
        const res = await axios.get(
          `/.netlify/functions/onchain-alchemy?address=${walletInfo.address}&protocol=${walletInfo.protocol}`,
          { timeout: 20000 }
        );
        
        if (res.data.error) {
          throw new Error(res.data.details || res.data.error);
        }
        
        setOnchainData(res.data);
      } else {
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
      console.error('❌ Failed to fetch on-chain data:', error);
      setOnchainData({
        hasWallet: false,
        transactionCount: 0,
        nftCount: 0,
        totalGasSpent: 0,
        hasDeFiActivity: false,
        portfolioValue: 0,
        degenScore: 0,
        error: error.message
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

  const handleManualFetch = async () => {
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Header - Clean Mini App Design */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '800',
            color: 'white',
            marginBottom: '8px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            🎯 Farcaster Badges
          </h1>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.9)', 
            marginBottom: '12px',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            {mode === 'mini' ? 'Your Engagement Score' : 'Check Badge Criteria'}
          </p>
          
          {/* SDK Status Indicator */}
          {mode === 'mini' && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: sdkReady ? '#10b981' : '#f59e0b',
                animation: sdkReady ? 'pulse 2s infinite' : 'none'
              }}></div>
              {sdkReady ? 'Connected' : 'Connecting...'}
            </div>
          )}
        </div>

        {/* Loading State */}
        {mode === 'mini' && !sdkReady && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '32px',
            textAlign: 'center',
            marginBottom: '24px',
            boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '3px solid #f3f4f6',
              borderTop: '3px solid #8b5cf6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <h3 style={{ color: '#1f2937', marginBottom: '8px', fontWeight: '600' }}>
              Connecting to Farcaster...
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Preparing your badge experience
            </p>
          </div>
        )}

        {/* USER PROFILE AT THE TOP */}
        {user && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <UserProfile user={user} currentUser={currentUser} onchainData={onchainData} />
            <BadgeCriteria user={user} onchainData={onchainData} />
            
            {/* SHARE BUTTONS - STANDALONE OUTSIDE CARDS */}
            <ShareButtons user={user} 
              score={Math.round((user.badgeScore || 0))} 
              tier={user.tier || 'MEMBER'} 
              onchainData={onchainData} 
            />
          </div>
        )}

        {/* MiniApp Mode - Auto-logged in */}
        {mode === 'mini' && sdkReady && !user && (
          <div>
            {loading && <LoadingSpinner />}
            
            {error && (
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center',
                marginBottom: '24px',
                boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.15)'
              }}>
                <strong>Error: </strong>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Web Mode - Manual search */}
        {mode === 'web' && !user && (
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
      </div>

      {/* Footer - Minimal */}
      <footer style={{ 
        marginTop: '32px', 
        textAlign: 'center', 
        color: 'rgba(255, 255, 255, 0.7)', 
        fontSize: '12px',
        padding: '16px'
      }}>
        <p>Built for Farcaster • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}