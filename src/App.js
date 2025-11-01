import React, { useState, useEffect } from "react";
import axios from "axios";
import { sdk } from '@farcaster/miniapp-sdk'
import html2canvas from 'html2canvas';

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
const ShareButtons = ({ user, score, tier, onchainData, engagementData }) => {
  if (!user) return null;

  // Calculate actual badge score and tier based on criteria (same logic as BadgeCriteria)
  const calculateBadgeScore = () => {
    // Get FID-based tier
    const getFIDTier = () => {
      if (user.fid <= 1000) return { label: 'The First Wave', days: 730, weight: 20 };
      if (user.fid <= 10000) return { label: 'The Pioneers', days: 545, weight: 15 };
      if (user.fid <= 50000) return { label: 'Early Adopters', days: 365, weight: 10 };
      return { label: 'Community Member', days: 180, weight: 5 };
    };

    const fidTier = getFIDTier();

    const criteria = [
      // Social & Engagement Criteria
      {
        id: 'follower_count',
        achieved: user.followerCount >= 1000,
        weight: 15,
      },
      {
        id: 'engagement_ratio',
        achieved: user.followerCount > 0 && (user.followerCount / (user.followingCount || 1)) >= 0.5,
        weight: 10,
      },
      {
        id: 'post_engagement',
        achieved: engagementData?.avgLikes >= 5,
        weight: 10,
      },
      {
        id: 'account_level',
        achieved: user.profile?.accountLevel === 'pro',
        weight: 10,
      },
      {
        id: 'active_profile',
        achieved: !!(user.profile?.bio?.text && user.pfp?.url),
        weight: 5,
      },

      // FID & Loyalty Criteria
      {
        id: 'fid_tier',
        achieved: true,
        weight: fidTier.weight,
      },
      {
        id: 'early_adopter',
        achieved: user.profile?.earlyWalletAdopter,
        weight: 10,
      },

      // On-chain Activity Criteria
      {
        id: 'transaction_count',
        achieved: onchainData?.transactionCount >= 100,
        weight: 10,
      },
      {
        id: 'nft_holder',
        achieved: onchainData?.nftCount >= 5,
        weight: 10,
      },
      {
        id: 'onchain_active',
        achieved: onchainData?.transactionCount >= 50,
        weight: 5,
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
    
    return {
      score: Math.round(progressPercentage),
      tier: tier.name,
      totalScore,
      maxScore
    };
  };

  const badgeInfo = calculateBadgeScore();
  const actualScore = badgeInfo.score;
  const actualTier = badgeInfo.tier;

  // Farcaster Mini App deep link
  const miniAppUrl = "https://farcaster.xyz/miniapps/YDBKZm-stAPU/farcaster-dashboard";
  
  const shareText = `🎯 My Farcaster Badge Score: ${actualScore}% (${actualTier} Tier)! 
  
${engagementData?.avgLikes ? `❤️ ${engagementData.avgLikes} avg likes` : ''}
${engagementData?.avgReplies ? `💬 ${engagementData.avgReplies} avg replies` : ''}
${engagementData?.avgRecasts ? `🔄 ${engagementData.avgRecasts} avg recasts` : ''}
${user.followerCount ? `👥 ${user.followerCount} followers` : ''}
${onchainData?.transactionCount ? `⛓️ ${onchainData.transactionCount} on-chain TXs` : ''}
${onchainData?.nftCount ? `🖼️ ${onchainData.nftCount} NFTs collected` : ''}

Check your Farcaster badge criteria and engagement score!

${miniAppUrl}

#Farcaster #BadgeScore #Web3 #OnChainReputation`;

  // Function to capture profile as image
  const captureProfileAsImage = async () => {
    try {
      console.log('🖼️ Starting image capture...');
      
      // Wait a bit for the DOM to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try multiple selectors to find the profile card
      const selectors = [
        '[data-profile-card]',
        '.user-profile-card',
        '[style*="background-color: white"][style*="border-radius: 20px"]',
        'div > div > div' // fallback to nested divs
      ];

      let profileElement = null;
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        console.log(`🔍 Searching with selector "${selector}": found ${elements.length} elements`);
        
        profileElement = Array.from(elements).find(el => {
          const text = el.textContent || '';
          return text.includes(user.username) || 
                 text.includes('@') ||
                 text.includes('Followers') ||
                 text.includes('Following');
        });
        
        if (profileElement) {
          console.log(`✅ Found profile element with selector: ${selector}`);
          break;
        }
      }

      if (!profileElement) {
        console.log('❌ Profile card not found with selectors, trying content-based search...');
        // Last resort: find by content
        const allDivs = document.querySelectorAll('div');
        profileElement = Array.from(allDivs).find(div => {
          const text = div.textContent || '';
          return text.includes(user.username) || 
                 text.includes('@') ||
                 (text.includes('Followers') && text.includes('Following'));
        });
        
        if (!profileElement) {
          throw new Error('Profile card not found');
        }
      }

      console.log('📸 Capturing with html2canvas...');
      
      const canvas = await html2canvas(profileElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: true,
        allowTaint: true,
        removeContainer: true,
        width: profileElement.offsetWidth,
        height: profileElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: profileElement.scrollWidth,
        windowHeight: profileElement.scrollHeight,
        onclone: (clonedDoc, element) => {
          console.log('🔧 Cloning element for capture...');
          // Ensure all styles are preserved
          element.style.boxShadow = '0 8px 25px -8px rgba(0, 0, 0, 0.15)';
          element.style.border = '1px solid #e5e7eb';
          element.style.borderRadius = '20px';
          element.style.opacity = '1';
          element.style.transform = 'none';
        }
      });

      console.log('✅ Image capture successful');
      return canvas;

    } catch (error) {
      console.error('❌ Failed to capture profile image:', error);
      
      // Fallback: create a custom image programmatically
      console.log('🔄 Trying fallback image generation...');
      return await generateFallbackImage();
    }
  };

  // Fallback image generation
  const generateFallbackImage = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 400;
    canvas.height = 600;
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Gradient header
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 120);
    
    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎯 Farcaster Badge', canvas.width / 2, 40);
    
    // User info
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`@${user.username}`, canvas.width / 2, 180);
    
    // Score and Tier
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#8b5cf6';
    ctx.fillText(`${actualScore}%`, canvas.width / 2, 230);
    
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`${actualTier} TIER`, canvas.width / 2, 260);
    
    // Stats
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    
    const stats = [
      `👥 Followers: ${user.followerCount?.toLocaleString() || 0}`,
      `❤️ Avg Likes: ${engagementData?.avgLikes || 0}`,
      `💬 Avg Replies: ${engagementData?.avgReplies || 0}`,
      `🔄 Avg Recasts: ${engagementData?.avgRecasts || 0}`,
      `⛓️ Transactions: ${onchainData?.transactionCount || 0}`,
      `🖼️ NFTs: ${onchainData?.nftCount || 0}`
    ];
    
    stats.forEach((stat, index) => {
      ctx.fillText(stat, 50, 320 + (index * 30));
    });
    
    // Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px Arial';
    ctx.fillText('Generated by Farcaster Badges • farcaster.xyz', canvas.width / 2, 580);
    
    return canvas;
  };

  // Share as Image function
  const shareAsImage = async (event) => {
    // Store button reference for resetting
    const button = event?.target;
    
    try {
      // Show loading state
      if (button) {
        button.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; gap: 8px;"><div style="width: 16px; height: 16px; border: 2px solid transparent; border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>Capturing Image...</div>';
        button.disabled = true;
      }

      // Send analytics
      try {
        await fetch('/.netlify/functions/analytics-proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'share_badge_score_image',
            user_fid: user.fid,
            score: actualScore,
            tier: actualTier,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        console.log('Analytics event failed (non-critical)');
      }

      const canvas = await captureProfileAsImage();
      
      if (canvas) {
        // Convert canvas to blob
        return new Promise((resolve) => {
          canvas.toBlob(async (blob) => {
            try {
              const file = new File([blob], 'farcaster-badge.png', { type: 'image/png' });

              console.log('📤 Sharing image...');
              
              // Share on Warpcast with image
              if (window.Farcaster && window.Farcaster.share) {
                await window.Farcaster.share({
                  text: `🎯 My Farcaster Badge Score: ${actualScore}% (${actualTier} Tier)!`,
                  image: file
                });
                console.log('✅ Image shared successfully via Farcaster SDK');
              } else {
                // Fallback for web: download image
                const link = document.createElement('a');
                link.download = `farcaster-badge-${user.username}.png`;
                link.href = canvas.toDataURL();
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                alert('🎉 Image downloaded! You can now share it on Warpcast or other platforms.');
                console.log('📥 Image downloaded as fallback');
              }
              resolve(true);
            } catch (shareError) {
              console.error('❌ Sharing failed:', shareError);
              // Fallback to text sharing
              alert('Image sharing failed, sharing as text instead...');
              shareToFarcaster();
              resolve(false);
            } finally {
              // Reset button state
              if (button) {
                button.innerHTML = '<span style="font-size: 18px">🖼️</span> Share as Image';
                button.disabled = false;
              }
            }
          }, 'image/png');
        });
      } else {
        throw new Error('Canvas is null');
      }
    } catch (error) {
      console.error('❌ Image capture and share failed:', error);
      // Fallback to text sharing
      alert('Image capture failed, sharing as text instead...');
      shareToFarcaster();
      
      // Reset button state
      if (button) {
        button.innerHTML = '<span style="font-size: 18px">🖼️</span> Share as Image';
        button.disabled = false;
      }
      return false;
    }
  };

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
          score: actualScore,
          tier: actualTier,
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

  const openInFarcaster = () => {
    // Open Mini App in Farcaster
    if (window.Farcaster && window.Farcaster.openUrl) {
      window.Farcaster.openUrl(miniAppUrl);
    } else {
      window.open(miniAppUrl, '_blank');
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
      
      {/* Show actual score and tier */}
      <div style={{
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <p style={{ 
          fontSize: '14px', 
          color: '#1f2937', 
          margin: 0,
          fontWeight: '600'
        }}>
          Your Score: <span style={{ color: '#8b5cf6' }}>{actualScore}%</span>
        </p>
        <p style={{ 
          fontSize: '14px', 
          color: '#1f2937', 
          margin: '4px 0 0 0',
          fontWeight: '600'
        }}>
          Tier: <span style={{ color: '#f59e0b' }}>{actualTier}</span>
        </p>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'center'
      }}>
        {/* NEW: Share as Image Button */}
        <button
          onClick={shareAsImage}
          style={{
            backgroundColor: '#10b981',
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
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
          }}
        >
          <span style={{ fontSize: '18px' }}>🖼️</span>
          Share as Image
        </button>

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
          onClick={shareToTwitter}
          style={{
            backgroundColor: '#000000',
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
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '18px' }}>🐦</span>
          Share on X
        </button>
        
        <div style={{
          display: 'flex',
          gap: '8px',
          width: '100%'
        }}>
          <button
            onClick={openInFarcaster}
            style={{
              backgroundColor: 'transparent',
              color: '#8b5cf6',
              border: '2px solid #8b5cf6',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#8b5cf6';
              e.target.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#8b5cf6';
            }}
          >
            <span>🚀</span>
            Open App
          </button>
          
          <button
            onClick={copyToClipboard}
            style={{
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '2px solid #e5e7eb',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
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
            Copy Text
          </button>
        </div>
      </div>

      <p style={{
        fontSize: '12px',
        color: '#9ca3af',
        marginTop: '12px',
        lineHeight: '1.4'
      }}>
        Share your Farcaster engagement score and badge progress!
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
const BadgeCriteria = ({ user, onchainData, engagementData }) => {
  if (!user) return null;

  // Get FID-based tier
  const getFIDTier = () => {
    if (user.fid <= 1000) return { label: 'The First Wave', days: 730, weight: 20 };
    if (user.fid <= 10000) return { label: 'The Pioneers', days: 545, weight: 15 };
    if (user.fid <= 50000) return { label: 'Early Adopters', days: 365, weight: 10 };
    return { label: 'Community Member', days: 180, weight: 5 };
  };

  const fidTier = getFIDTier();

  const criteria = [
    // Social & Engagement Criteria (50 points)
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
      id: 'post_engagement',
      label: 'Active Poster',
      achieved: engagementData?.avgLikes >= 5,
      value: engagementData?.avgLikes || 0,
      target: 5,
      weight: 10,
      description: 'Posts with good engagement (5+ avg likes)',
      category: 'social',
      emoji: '❤️'
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

    // FID & Loyalty Criteria (25 points)
    {
      id: 'fid_tier',
      label: fidTier.label,
      achieved: true, // Always achieved based on FID
      value: user.fid,
      target: fidTier.label,
      weight: fidTier.weight,
      description: `FID ${user.fid} - ${fidTier.label} of Farcaster`,
      category: 'loyalty',
      emoji: '🎯'
    },
    {
      id: 'early_adopter',
      label: 'Early Adopter',
      achieved: user.profile?.earlyWalletAdopter,
      value: user.profile?.earlyWalletAdopter,
      target: true,
      weight: 10,
      description: 'Early wallet adopter - OG status!',
      category: 'loyalty',
      emoji: '🚀'
    },

    // On-chain Activity Criteria (25 points)
    {
      id: 'transaction_count',
      label: '100+ Transactions',
      achieved: onchainData?.transactionCount >= 100,
      value: onchainData?.transactionCount || 0,
      target: 100,
      weight: 10,
      description: 'Active on-chain user with 100+ transactions',
      category: 'onchain',
      emoji: '🔄'
    },
    {
      id: 'nft_holder',
      label: 'NFT Collector',
      achieved: onchainData?.nftCount >= 5,
      value: onchainData?.nftCount || 0,
      target: 5,
      weight: 10,
      description: 'Holder of 5+ NFTs (any collection)',
      category: 'onchain',
      emoji: '🖼️'
    },
    {
      id: 'onchain_active',
      label: 'On-chain Active',
      achieved: onchainData?.transactionCount >= 50,
      value: onchainData?.transactionCount || 0,
      target: 50,
      weight: 5,
      description: 'Regular on-chain activity with 50+ transactions',
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
  return { name: 'MEMBER', color: '#b45309', emoji: '👤' }; // Fixed from 'MEMBER' to 'MEMBER'
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
        🎯 Engagement Score
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
          {totalScore}/{maxScore} points • {fidTier.label}
        </p>
      </div>

      {/* Social Criteria */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#8b5cf6', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🌟 Social Engagement ({socialCriteria.filter(s => s.achieved).length}/{socialCriteria.length})
        </h4>
        {socialCriteria.map((item) => (
          <CriteriaItem key={item.id} item={item} />
        ))}
      </div>

      {/* Loyalty Criteria */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#f59e0b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🎯 FID Tier & Loyalty ({loyaltyCriteria.filter(s => s.achieved).length}/{loyaltyCriteria.length})
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
          <li>Post engaging content regularly</li>
          <li>Interact with other users' posts</li>
          <li>Complete your profile with bio and PFP</li>
          <li>Connect wallets and be active on-chain</li>
        </ul>
      </div>
    </div>
  );
};

// Add this function to capture the profile as image
const captureProfileAsImage = async () => {
  try {
    // Find the main profile card
    const profileElement = document.querySelector('[data-profile-card]');
    
    if (!profileElement) {
      throw new Error('Profile card not found');
    }

    // Use html2canvas library (you'll need to install it)
    const canvas = await html2canvas(profileElement, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      logging: false
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to capture profile image:', error);
    return null;
  }
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
  const [engagementData, setEngagementData] = useState(null);
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

  // Function to analyze post engagement
  const analyzePostEngagement = async (userData) => {
    try {
      // Fetch recent casts for the user
      const castsResponse = await axios.get(`/.netlify/functions/farcaster-casts?fid=${userData.fid}`, {
        timeout: 15000
      });
      
      const casts = castsResponse.data.casts || [];
      
      if (casts.length === 0) {
        return {
          totalCasts: 0,
          avgLikes: 0,
          avgReplies: 0,
          avgRecasts: 0,
          totalEngagement: 0
        };
      }

      // Calculate engagement metrics
      const totalLikes = casts.reduce((sum, cast) => sum + (cast.reactions?.count || 0), 0);
      const totalReplies = casts.reduce((sum, cast) => sum + (cast.replies?.count || 0), 0);
      const totalRecasts = casts.reduce((sum, cast) => sum + (cast.recasts?.count || 0), 0);
      
      const engagementData = {
        totalCasts: casts.length,
        avgLikes: Math.round(totalLikes / casts.length),
        avgReplies: Math.round(totalReplies / casts.length),
        avgRecasts: Math.round(totalRecasts / casts.length),
        totalEngagement: totalLikes + totalReplies + totalRecasts,
        recentCasts: casts.slice(0, 5) // Keep recent casts for display
      };

      console.log('📊 Post engagement analysis:', engagementData);
      return engagementData;

    } catch (error) {
      console.error('❌ Failed to analyze post engagement:', error);
      return {
        totalCasts: 0,
        avgLikes: 0,
        avgReplies: 0,
        avgRecasts: 0,
        totalEngagement: 0,
        error: 'Could not fetch post data'
      };
    }
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
    setEngagementData(null);
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
      
      // Fetch on-chain data and post engagement in parallel
      await Promise.all([
        fetchOnchainData(user),
        analyzePostEngagement(user).then(setEngagementData)
      ]);
      
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
            <UserProfile 
              user={user} 
              currentUser={currentUser} 
              onchainData={onchainData}
              engagementData={engagementData}
            />
            <BadgeCriteria 
              user={user} 
              onchainData={onchainData}
              engagementData={engagementData}
            />
            
            {/* SHARE BUTTONS - STANDALONE OUTSIDE CARDS */}
            <ShareButtons 
              user={user} 
              onchainData={onchainData}
              engagementData={engagementData}
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