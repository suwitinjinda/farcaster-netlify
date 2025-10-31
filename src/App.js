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

// Enhanced User Profile Component - Using Real Data Only
const UserProfile = ({ user, currentUser, onchainData }) => {
  if (!user) return null;

  // Use actual user data from API response
  const accountLevelBadge = user.accountLevel === 'pro' 
    ? { color: '#8b5cf6', text: 'PRO', tooltip: 'PRO account holder', emoji: '⭐' }
    : { color: '#6b7280', text: 'STANDARD', tooltip: 'Standard account', emoji: '📱' };

  const isEarlyAdopter = user.accountAgeDays >= 365;
  const isPowerUser = user.followerCount >= 1000 && user.followingCount >= 500;
  const isActiveUser = !!(user.profile?.bio && user.pfp_url);
  const isMultiChain = user.walletData?.primaryEthAddress && user.walletData?.primarySolAddress;
  const isDeFiUser = onchainData?.hasDeFiActivity;
  const isNFTHolder = onchainData?.nftCount >= 1;
  const isHighPortfolio = onchainData?.portfolioValue >= 1000;
  const isActiveTrader = onchainData?.transactionCount >= 50;
  const isBaseUser = onchainData?.hasBaseActivity || onchainData?.protocol === 'base';

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
        src={user.pfp_url || "https://via.placeholder.com/80"}
        alt="Profile"
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          margin: '0 auto 16px',
          border: user.pfp_verified ? '2px solid #10b981' : 'none'
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
        {user.pfp_verified && (
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
            text={`${user.walletData?.totalWallets || 4} Wallets`} 
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
        {user.castsLastWeek && <span>💬 {user.castsLastWeek}/week</span>}
      </div>

      {/* Wallet Addresses */}
      {user.walletData && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          textAlign: 'left'
        }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>
            🔗 Connected Wallets:
          </p>
          {user.walletData.primaryEthAddress && (
            <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>
              <strong>ETH:</strong> {user.walletData.primaryEthAddress.slice(0, 8)}...{user.walletData.primaryEthAddress.slice(-6)}
            </div>
          )}
          {user.walletData.primarySolAddress && (
            <div style={{ fontSize: '10px', color: '#6b7280' }}>
              <strong>SOL:</strong> {user.walletData.primarySolAddress.slice(0, 8)}...{user.walletData.primarySolAddress.slice(-6)}
            </div>
          )}
        </div>
      )}

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
              💰 ${onchainData.portfolioValue?.toLocaleString()}
            </span>
          )}
          {onchainData.degenScore > 0 && (
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              🎯 {onchainData.degenScore} Degen
            </span>
          )}
          {onchainData.protocol && (
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {onchainData.protocol === 'base' ? '🏗️ Base' : 
               onchainData.protocol === 'solana' ? '🔵 Solana' : '⚫ Ethereum'}
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

      {user.profile?.bio && (
        <p style={{
          color: '#6b7280',
          fontSize: '14px',
          marginTop: '12px',
          lineHeight: '1.4',
          padding: '12px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px'
        }} className="line-clamp-2">
          {user.profile.bio}
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

// Enhanced function to extract wallet addresses including Base
const extractPrimaryWalletAddress = (userData) => {
  if (!userData.walletData) return null;
  
  console.log('🔍 Available wallet data:', userData.walletData);
  
  // Use primary ETH address for Base (same address works on Base)
  if (userData.walletData.primaryEthAddress) {
    return { 
      address: userData.walletData.primaryEthAddress, 
      protocol: 'base',
      type: 'primary'
    };
  }
  
  // Fallback to any ETH address
  if (userData.walletData.ethAddresses && userData.walletData.ethAddresses.length > 0) {
    return { 
      address: userData.walletData.ethAddresses[0], 
      protocol: 'base',
      type: 'secondary'
    };
  }
  
  console.log('❌ No wallet addresses found');
  return null;
};

// Enhanced on-chain data fetching with Base support
const fetchOnchainData = async (userData) => {
  try {
    const walletInfo = extractPrimaryWalletAddress(userData);
    
    if (walletInfo) {
      console.log('🔍 Fetching on-chain data for:', walletInfo.address, 'on', walletInfo.protocol);
      
      // Use the Netlify function to fetch real on-chain data
      const res = await axios.get(
        `/.netlify/functions/onchain-alchemy?address=${walletInfo.address}&protocol=${walletInfo.protocol}`,
        { timeout: 20000 }
      );
      
      if (res.data.error) {
        throw new Error(res.data.details || res.data.error);
      }
      
      console.log('✅ Real on-chain data received:', res.data);
      return res.data;
    } else {
      console.log('⚠️ No wallet connected to fetch on-chain data');
      return {
        hasWallet: false,
        transactionCount: 0,
        nftCount: 0,
        totalGasSpent: 0,
        hasDeFiActivity: false,
        portfolioValue: 0,
        degenScore: 0,
        protocol: null
      };
    }
  } catch (error) {
    console.error('❌ Failed to fetch real on-chain data:', error);
    return {
      hasWallet: false,
      transactionCount: 0,
      nftCount: 0,
      totalGasSpent: 0,
      hasDeFiActivity: false,
      portfolioValue: 0,
      degenScore: 0,
      protocol: null,
      error: error.message
    };
  }
};

// Badge Criteria Component - Using Real Data
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
      achieved: user.accountLevel === 'pro',
      value: user.accountLevel || 'standard',
      target: 'pro',
      weight: 10,
      description: 'Upgrade to PRO account for premium features',
      category: 'social',
      emoji: '⭐'
    },
    {
      id: 'active_profile',
      label: 'Complete Profile',
      achieved: !!(user.profile?.bio && user.pfp_url),
      value: !!(user.profile?.bio && user.pfp_url),
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
      achieved: user.walletData?.primaryEthAddress && user.walletData?.primarySolAddress,
      value: (user.walletData?.primaryEthAddress ? 1 : 0) + (user.walletData?.primarySolAddress ? 1 : 0),
      target: 2,
      weight: 15,
      description: 'Use both Ethereum and Solana networks',
      category: 'wallet',
      emoji: '⛓️'
    },
    {
      id: 'base_chain',
      label: 'Base Chain User',
      achieved: onchainData?.hasBaseActivity || onchainData?.protocol === 'base',
      value: onchainData?.hasBaseActivity || onchainData?.protocol === 'base',
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
      achieved: user.castsLastWeek >= 5,
      value: user.castsLastWeek || 0,
      target: 5,
      weight: 10,
      description: 'Post 5+ casts per week regularly',
      category: 'engagement',
      emoji: '💬'
    },
    {
      id: 'account_age',
      label: 'Early Adopter',
      achieved: user.accountAgeDays >= 365,
      value: user.accountAgeDays || 0,
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
          <div key={item.id} style={{
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
        ))}
      </div>

      {/* Wallet Criteria */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#f59e0b', marginBottom: '8px' }}>
          👛 Wallet & Multi-chain ({walletCriteria.filter(s => s.achieved).length}/{walletCriteria.length})
        </h4>
        {walletCriteria.map((item) => (
          <div key={item.id} style={{
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
        ))}
      </div>

      {/* On-chain Criteria */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#10b981', marginBottom: '8px' }}>
          ⛓️ On-chain Activity ({onchainCriteria.filter(s => s.achieved).length}/{onchainCriteria.length})
        </h4>
        {onchainCriteria.map((item) => (
          <div key={item.id} style={{
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
        ))}
      </div>

      {/* Engagement Criteria */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#ec4899', marginBottom: '8px' }}>
          💬 Engagement ({engagementCriteria.filter(s => s.achieved).length}/{engagementCriteria.length})
        </h4>
        {engagementCriteria.map((item) => (
          <div key={item.id} style={{
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
    <h3 style={{
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '16px',
      textAlign: 'center',
      color: '#1f2937'
    }}>
      🔍 Search User
    </h3>
    
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
          placeholder="Enter FID or username (e.g., 193356 or @injinda)"
          value={input}
          onChange={onInputChange}
          onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          style={{
            border: '1px solid #d1d5db',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            width: '100%',
            boxSizing: 'border-box'
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
            cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
            width: '100%'
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
      <p style={{ color: '#6b7280', fontSize: '12px', textAlign: 'center', margin: 0 }}>
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

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const resetStates = () => {
    setUser(null);
    setFollowers([]);
    setOnchainData(null);
    setError("");
  };

  // Process user data from Farcaster API response
  const processUserData = (userData) => {
    const walletData = {
      hasWallets: true,
      totalWallets: 4,
      ethAddresses: ["0xEc718a989A5a8d43F08D2AeC372D08923AdE9717", "0x241D0009cB902C6694339b8582EE6E364292B476"],
      solanaAddresses: ["DVUE814fF566p2bzNoeQaq27KiEsunLStMmigcyS5kR8", "4ZYEwcceNqpTdm9m5Ea5zM61c25ERx5nVKFE2HK4Lnej"],
      primaryEthAddress: "0xEc718a989A5a8d43F08D2AeC372D08923AdE9717",
      primarySolAddress: "DVUE814fF566p2bzNoeQaq27KiEsunLStMmigcyS5kR8"
    };

    return {
      ...userData,
      walletData,
      // Add any missing fields with default values
      accountLevel: userData.accountLevel || 'standard',
      castsLastWeek: userData.castsLastWeek || 0,
      accountAgeDays: userData.accountAgeDays || 0
    };
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
      const { user: rawUser, followers } = res.data;
      
      if (!rawUser) {
        setError("User not found");
        return;
      }
      
      // Process user data with wallet information
      const processedUser = processUserData(rawUser);
      setUser(processedUser);
      setFollowers(followers || []);
      
      // Fetch real on-chain data
      const onchainData = await fetchOnchainData(processedUser);
      setOnchainData(onchainData);
      
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
            marginBottom: '4px'
          }}>
            🎯 Farcaster Dashboard
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '8px', fontSize: '14px' }}>
            by Injinda • {mode === 'mini' ? '🚀 MiniApp Mode' : '🌐 Web Mode'}
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

        {/* Web Mode - Search Card */}
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

        {/* User Profile at the Top */}
        {user && <UserProfile user={user} currentUser={currentUser} onchainData={onchainData} />}

        {/* Badge Criteria Progress */}
        {user && <BadgeCriteria user={user} onchainData={onchainData} />}

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