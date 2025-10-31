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

// Updated ShareButtons Component with improved share content
const ShareButtons = ({ user, score, tier, onchainData, criteria }) => {
  if (!user) return null;

  // Calculate stats for share text
  const achievedCriteria = criteria.filter(item => item.achieved).length;
  const totalCriteria = criteria.length;
  const portfolioValue = onchainData?.portfolioValue || 0;
  const transactionCount = onchainData?.transactionCount || 0;
  const nftCount = onchainData?.nftCount || 0;
  const followerCount = user.followerCount || 0;

  const shareText = `🎯 My Farcaster Badge Score: ${score}% (${tier} Tier)

📊 ${achievedCriteria}/${totalCriteria} Criteria Achieved
${portfolioValue > 0 ? `💰 Portfolio: $${portfolioValue.toLocaleString()}` : '💼 Building Portfolio'}
${transactionCount > 0 ? `⛓️ ${transactionCount} Transactions` : '🔄 Starting On-chain Journey'}
${nftCount > 0 ? `🖼️ ${nftCount} NFTs Collected` : '🎨 Exploring NFTs'}
${followerCount > 0 ? `👥 ${followerCount.toLocaleString()} Followers` : '🌟 Growing Community'}

Check your badge criteria and improve your score!

#Farcaster #BadgeScore #Web3 #OnChain`;

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

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, '_blank');
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
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '16px',
      marginTop: '16px',
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
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          width: '100%'
        }}>
          <button
            onClick={shareToFarcaster}
            style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
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
            Warpcast
          </button>
          
          <button
            onClick={shareToTwitter}
            style={{
              backgroundColor: '#1da1f2',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
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
            Twitter
          </button>
        </div>

        <button
          onClick={copyToClipboard}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
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
    // Social & Profile Criteria (40 points)
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
      id: 'following_count',
      label: 'Following ≥ 500',
      achieved: user.followingCount >= 500,
      value: user.followingCount,
      target: 500,
      weight: 10,
      description: 'Active engagement with 500+ accounts',
      category: 'social',
      emoji: '🔗'
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
      weight: 5,
      description: 'Complete profile with bio and PFP',
      category: 'social',
      emoji: '📝'
    },

    // Wallet & Multi-chain Criteria (30 points)
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
    {
      id: 'base_chain',
      label: 'Base Chain User',
      achieved: onchainData?.hasBaseActivity || false,
      value: onchainData?.hasBaseActivity || false,
      target: true,
      weight: 5,
      description: 'Active on Base chain (Coinbase L2)',
      category: 'wallet',
      emoji: '🏗️'
    },

    // On-chain Activity Criteria (50 points)
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
    },
    {
      id: 'gas_spent',
      label: 'Gas Spent ≥ 0.1 ETH',
      achieved: onchainData?.totalGasSpent >= 0.1,
      value: onchainData?.totalGasSpent || 0,
      target: 0.1,
      weight: 5,
      description: 'Active network participant with gas spending',
      category: 'onchain',
      emoji: '⛽'
    },
    {
      id: 'degen_score',
      label: 'Degen Score ≥ 500',
      achieved: onchainData?.degenScore >= 500,
      value: onchainData?.degenScore || 0,
      target: 500,
      weight: 5,
      description: 'High on-chain activity score',
      category: 'onchain',
      emoji: '🎯'
    },

    // Engagement Criteria (20 points)
    {
      id: 'casts_per_week',
      label: 'Active Caster',
      achieved: user.profile?.castsLastWeek >= 5,
      value: user.profile?.castsLastWeek || 0,
      target: 5,
      weight: 10,
      description: 'Post 5+ casts per week regularly',
      category: 'engagement',
      emoji: '💬'
    },
    {
      id: 'account_age',
      label: 'Early Adopter',
      achieved: user.profile?.accountAgeDays >= 365,
      value: user.profile?.accountAgeDays || 0,
      target: 365,
      weight: 10,
      description: 'Farcaster user for 1+ year',
      category: 'engagement',
      emoji: '🚀'
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
  const engagementCriteria = criteria.filter(item => item.category === 'engagement');

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '20px',
      marginBottom: '16px',
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
          Score: {totalScore}/{maxScore} points • {criteria.filter(item => item.achieved).length}/{criteria.length} Criteria
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

      {/* Engagement Criteria */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#ec4899', marginBottom: '8px' }}>
          💬 Engagement ({engagementCriteria.filter(s => s.achieved).length}/{engagementCriteria.length})
        </h4>
        {engagementCriteria.map((item) => (
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
          <li>Try Base chain for low-cost transactions</li>
          <li>Make regular on-chain transactions</li>
          <li>Collect NFTs and use DeFi protocols</li>
          <li>Post casts regularly and grow your followers</li>
        </ul>
      </div>

      {/* Share Section - Now outside main card */}
    </div>
  );
};

// Enhanced User Profile Component
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
  const isEarlyAdopter = user.profile?.accountAgeDays >= 365;
  const isPowerUser = user.followerCount >= 1000 && user.followingCount >= 500;
  const isActiveUser = !!(user.profile?.bio?.text && user.pfp?.url);
  const isMultiChain = user.walletData?.ethAddresses.length > 0 && user.walletData?.solanaAddresses.length > 0;
  const isDeFiUser = onchainData?.hasDeFiActivity;
  const isNFTHolder = onchainData?.nftCount >= 1;
  const isHighPortfolio = onchainData?.portfolioValue >= 1000;
  const isActiveTrader = onchainData?.transactionCount >= 50;
  const isBaseUser = onchainData?.hasBaseActivity;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '20px',
      width: '100%',
      textAlign: 'center',
      marginBottom: '16px'
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
            text="OG User" 
            color="#f59e0b"
            tooltip="Farcaster user for 1+ year"
            emoji="🚀"
          />
        )}
        {user.pfp?.verified && (
          <Badge 
            type="verified" 
            text="Verified" 
            color="#10b981"
            tooltip="Verified profile"
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
        {isBaseUser && (
          <Badge 
            type="baseUser" 
            text="Base User" 
            color="#0052ff"
            tooltip="Active on Base chain"
            emoji="🏗️"
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
      <p style={{ color: '#6b7280', marginBottom: '8px', fontSize: '14px' }}>
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
        {user.profile?.castsLastWeek && <span>💬 {user.profile.castsLastWeek}/week</span>}
      </div>

      {/* On-chain Stats Summary */}
      {onchainData && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '12px',
          flexWrap: 'wrap'
        }}>
          {onchainData.transactionCount > 0 && (
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              ⛓️ {onchainData.transactionCount} TXs
            </span>
          )}
          {onchainData.nftCount > 0 && (
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              🖼️ {onchainData.nftCount} NFTs
            </span>
          )}
          {onchainData.portfolioValue > 0 && (
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              💰 ${onchainData.portfolioValue.toLocaleString()}
            </span>
          )}
          {onchainData.degenScore > 0 && (
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              🎯 {onchainData.degenScore} Degen
            </span>
          )}
        </div>
      )}

      {onchainData?.error && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          color: '#92400e',
          padding: '12px',
          borderRadius: '8px',
          marginTop: '12px',
          fontSize: '12px'
        }}>
          <strong>⚠️ On-chain Data Limited:</strong> {onchainData.error}
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
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    padding: '20px',
    marginBottom: '16px',
    width: '100%'
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
          placeholder="Enter FID or username (e.g., 1234 or @username)"
          value={input}
          onChange={onInputChange}
          onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          style={{
            border: '1px solid #d1d5db',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
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
            fontSize: '14px',
            fontWeight: '600',
            cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer'
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
      <p style={{ color: '#6b7280', fontSize: '12px', textAlign: 'center' }}>
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
            fontSize: '12px'
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
    if (primaryEth) return { address: primaryEth, protocol: 'ethereum' };
    
    const firstEth = userData.walletData.ethAddresses[0];
    if (firstEth) return { address: firstEth, protocol: 'ethereum' };
    
    const primarySol = userData.walletData.primarySolAddress;
    if (primarySol) return { address: primarySol, protocol: 'solana' };
    
    const firstSol = userData.walletData.solanaAddresses[0];
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

  // Calculate criteria for share component
  const criteria = user ? [
    // Social & Profile Criteria
    {
      id: 'follower_count',
      achieved: user.followerCount >= 1000,
      value: user.followerCount,
      target: 1000,
    },
    {
      id: 'following_count',
      achieved: user.followingCount >= 500,
      value: user.followingCount,
      target: 500,
    },
    {
      id: 'account_level',
      achieved: user.profile?.accountLevel === 'pro',
    },
    {
      id: 'active_profile',
      achieved: !!(user.profile?.bio?.text && user.pfp?.url),
    },
    // Wallet & Multi-chain Criteria
    {
      id: 'wallet_connected',
      achieved: user.walletData?.hasWallets,
    },
    {
      id: 'multi_chain',
      achieved: user.walletData?.ethAddresses.length > 0 && user.walletData?.solanaAddresses.length > 0,
    },
    {
      id: 'base_chain',
      achieved: onchainData?.hasBaseActivity || false,
    },
    // On-chain Activity Criteria
    {
      id: 'transaction_count',
      achieved: onchainData?.transactionCount >= 10,
      value: onchainData?.transactionCount || 0,
      target: 10,
    },
    {
      id: 'nft_holder',
      achieved: onchainData?.nftCount >= 1,
      value: onchainData?.nftCount || 0,
      target: 1,
    },
    {
      id: 'defi_user',
      achieved: onchainData?.hasDeFiActivity,
    },
    {
      id: 'portfolio_value',
      achieved: onchainData?.portfolioValue >= 1000,
      value: onchainData?.portfolioValue || 0,
      target: 1000,
    },
    {
      id: 'gas_spent',
      achieved: onchainData?.totalGasSpent >= 0.1,
      value: onchainData?.totalGasSpent || 0,
      target: 0.1,
    },
    {
      id: 'degen_score',
      achieved: onchainData?.degenScore >= 500,
      value: onchainData?.degenScore || 0,
      target: 500,
    },
    // Engagement Criteria
    {
      id: 'casts_per_week',
      achieved: user.profile?.castsLastWeek >= 5,
      value: user.profile?.castsLastWeek || 0,
      target: 5,
    },
    {
      id: 'account_age',
      achieved: user.profile?.accountAgeDays >= 365,
      value: user.profile?.accountAgeDays || 0,
      target: 365,
    }
  ] : [];

  const totalScore = criteria.reduce((sum, item) => sum + (item.achieved ? 1 : 0), 0);
  const maxScore = criteria.length;
  const progressPercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  const getTier = (score) => {
    if (score >= 80) return { name: 'DIAMOND', color: '#8b5cf6', emoji: '💎' };
    if (score >= 60) return { name: 'GOLD', color: '#f59e0b', emoji: '🥇' };
    if (score >= 40) return { name: 'SILVER', color: '#9ca3af', emoji: '🥈' };
    return { name: 'BRONZE', color: '#b45309', emoji: '🥉' };
  };

  const tier = getTier(progressPercentage);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #dbeafe, #e0e7ff)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            🎯 Farcaster Dashboard
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '12px', fontSize: '14px' }}>
            {mode === 'mini' ? '🚀 MiniApp Mode' : '🌐 Web Mode'} • by Injinda
          </p>
          
          {mode === 'mini' && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: sdkReady ? '#d1fae5' : '#fef3c7',
              color: sdkReady ? '#065f46' : '#92400e',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: sdkReady ? '#10b981' : '#f59e0b',
                animation: sdkReady ? 'pulse 2s infinite' : 'none'
              }}></div>
              {sdkReady ? 'SDK Ready' : 'SDK Initializing...'}
            </div>
          )}
        </div>

        {/* Loading State for SDK Initialization */}
        {mode === 'mini' && !sdkReady && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            marginBottom: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #f3f4f6',
              borderTop: '3px solid #8b5cf6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px'
            }}></div>
            <h3 style={{ color: '#1f2937', marginBottom: '8px', fontSize: '16px' }}>
              Initializing Farcaster Mini App...
            </h3>
          </div>
        )}

        {/* User Profile at the Top */}
        {user && <UserProfile user={user} currentUser={currentUser} onchainData={onchainData} />}

        {/* MiniApp Mode - Auto-logged in */}
        {mode === 'mini' && sdkReady && (
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
                marginBottom: '16px'
              }}>
                <strong>Error: </strong>
                {error}
                <div style={{ marginTop: '8px' }}>
                  <button
                    onClick={handleManualFetch}
                    style={{
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Try Manual Search
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Web Mode - Direct manual search */}
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

        {/* Share Card - Outside main criteria card */}
        {user && (
          <ShareButtons 
            user={user} 
            score={Math.round(progressPercentage)} 
            tier={tier.name} 
            onchainData={onchainData}
            criteria={criteria}
          />
        )}

        {/* Empty State */}
        {user && followers.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>No followers data available</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ marginTop: '24px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
        <p>
          Built with Farcaster API • {mode === 'mini' ? 'MiniApp Mode' : 'Web Mode'} • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}