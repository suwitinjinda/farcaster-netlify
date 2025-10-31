// netlify/functions/onchain-alchemy.js
const axios = require('axios');

// ใช้ Alchemy API key โดยตรง
const ALCHEMY_API_KEY = "mo8SK-whAlq6FzJ_SjjR2Xozl8RWYd3w";

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { address, protocol = 'ethereum' } = event.queryStringParameters;

  if (!address) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Wallet address is required' })
    };
  }

  try {
    let onchainData = {
      hasWallet: true,
      protocol: protocol,
      address: address,
      transactionCount: 0,
      nftCount: 0,
      totalGasSpent: 0,
      hasDeFiActivity: false,
      hasBaseActivity: false, // ADDED THIS FIELD
      portfolioValue: 0,
      degenScore: 0,
      lastUpdated: new Date().toISOString()
    };

    if (protocol === 'ethereum') {
      // ใช้ Alchemy API สำหรับ Ethereum
      const alchemyBaseURL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
      
      try {
        console.log('🔍 Fetching Ethereum data for:', address);
        
        // 1. ดึง transaction count
        const txCountResponse = await axios.post(alchemyBaseURL, {
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getTransactionCount",
          params: [address, "latest"]
        }, { timeout: 15000 });
        
        if (txCountResponse.data && txCountResponse.data.result) {
          onchainData.transactionCount = parseInt(txCountResponse.data.result, 16);
        }

        // 2. ดึง NFT data
        const nftResponse = await axios.get(
          `${alchemyBaseURL}/getNFTs?owner=${address}`,
          { timeout: 15000 }
        );
        
        if (nftResponse.data) {
          onchainData.nftCount = nftResponse.data.totalCount || 0;
        }

        // 3. ดึง ETH balance
        const ethBalanceResponse = await axios.post(alchemyBaseURL, {
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getBalance",
          params: [address, "latest"]
        }, { timeout: 15000 });

        let ethBalance = 0;
        if (ethBalanceResponse.data && ethBalanceResponse.data.result) {
          ethBalance = parseInt(ethBalanceResponse.data.result, 16) / 1e18;
        }

        // 4. ดึง transaction history สำหรับตรวจสอบ DeFi activity
        const txHistoryResponse = await axios.post(alchemyBaseURL, {
          jsonrpc: "2.0",
          id: 1,
          method: "alchemy_getAssetTransfers",
          params: [{
            fromBlock: "0x0",
            fromAddress: address,
            category: ["external", "internal", "erc20", "erc721", "erc1155"],
            maxCount: 50
          }]
        }, { timeout: 15000 });

        // ตรวจสอบ DeFi activity
        if (txHistoryResponse.data && txHistoryResponse.data.result) {
          const transactions = txHistoryResponse.data.result.transfers || [];
          const defiProtocols = [
            'uniswap', 'aave', 'compound', 'sushiswap', 
            'curve', 'balancer', 'maker', 'yearn', 'dydx'
          ];
          
          onchainData.hasDeFiActivity = transactions.some(tx => {
            const contractAddress = tx.rawContract?.address || '';
            return defiProtocols.some(protocol => 
              contractAddress.toLowerCase().includes(protocol)
            );
          });
        }

        // 5. ดึง token balances สำหรับ portfolio value
        const tokenBalancesResponse = await axios.post(alchemyBaseURL, {
          jsonrpc: "2.0",
          id: 1,
          method: "alchemy_getTokenBalances",
          params: [address]
        }, { timeout: 15000 });

        let tokenValue = 0;
        if (tokenBalancesResponse.data && tokenBalancesResponse.data.result) {
          const tokens = tokenBalancesResponse.data.result.tokenBalances || [];
          // คำนวณ portfolio value (simplified - ใช้เฉพาะ ETH สำหรับตอนนี้)
          tokenValue = tokens.length * 100; // ประมาณค่า tokens
        }

        // คำนวณ portfolio value
        onchainData.portfolioValue = (ethBalance * 2500) + tokenValue; // ใช้ ETH price ~$2500

        console.log('✅ Ethereum data fetched successfully');

      } catch (alchemyError) {
        console.error('❌ Alchemy Ethereum API error:', alchemyError.response?.data || alchemyError.message);
        throw new Error(`Ethereum API failed: ${alchemyError.message}`);
      }

    } else if (protocol === 'base') {
      // ใช้ Alchemy API สำหรับ Base
      const alchemyBaseURL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
      
      try {
        console.log('🔍 Fetching Base data for:', address);
        
        // 1. ดึง transaction count
        const txCountResponse = await axios.post(alchemyBaseURL, {
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getTransactionCount",
          params: [address, "latest"]
        }, { timeout: 15000 });
        
        if (txCountResponse.data && txCountResponse.data.result) {
          onchainData.transactionCount = parseInt(txCountResponse.data.result, 16);
        }

        // 2. ดึง NFT data
        const nftResponse = await axios.get(
          `${alchemyBaseURL}/getNFTs?owner=${address}`,
          { timeout: 15000 }
        );
        
        if (nftResponse.data) {
          onchainData.nftCount = nftResponse.data.totalCount || 0;
        }

        // 3. ดึง ETH balance (บน Base ใช้ ETH เช่นกัน)
        const ethBalanceResponse = await axios.post(alchemyBaseURL, {
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getBalance",
          params: [address, "latest"]
        }, { timeout: 15000 });

        let ethBalance = 0;
        if (ethBalanceResponse.data && ethBalanceResponse.data.result) {
          ethBalance = parseInt(ethBalanceResponse.data.result, 16) / 1e18;
        }

        // 4. ดึง transaction history สำหรับตรวจสอบ DeFi activity
        const txHistoryResponse = await axios.post(alchemyBaseURL, {
          jsonrpc: "2.0",
          id: 1,
          method: "alchemy_getAssetTransfers",
          params: [{
            fromBlock: "0x0",
            fromAddress: address,
            category: ["external", "internal", "erc20", "erc721", "erc1155"],
            maxCount: 50
          }]
        }, { timeout: 15000 });

        // ตรวจสอบ DeFi activity บน Base
        if (txHistoryResponse.data && txHistoryResponse.data.result) {
          const transactions = txHistoryResponse.data.result.transfers || [];
          const baseDefiProtocols = [
            'uniswap', 'aave', 'compound', 'sushiswap', 
            'curve', 'balancer', 'aerodrome', 'baseswap',
            'odos', 'inch', 'moonwell', 'compoundv3'
          ];
          
          onchainData.hasDeFiActivity = transactions.some(tx => {
            const contractAddress = tx.rawContract?.address || '';
            return baseDefiProtocols.some(protocol => 
              contractAddress.toLowerCase().includes(protocol)
            );
          });
        }

        // 5. ดึง token balances สำหรับ portfolio value
        const tokenBalancesResponse = await axios.post(alchemyBaseURL, {
          jsonrpc: "2.0",
          id: 1,
          method: "alchemy_getTokenBalances",
          params: [address]
        }, { timeout: 15000 });

        let tokenValue = 0;
        if (tokenBalancesResponse.data && tokenBalancesResponse.data.result) {
          const tokens = tokenBalancesResponse.data.result.tokenBalances || [];
          tokenValue = tokens.length * 75; // ประมาณค่า tokens บน Base
        }

        // คำนวณ portfolio value สำหรับ Base
        onchainData.portfolioValue = (ethBalance * 2500) + tokenValue;

        // SET hasBaseActivity TO TRUE FOR BASE CHAIN - THIS IS THE KEY FIX
        onchainData.hasBaseActivity = true;

        console.log('✅ Base data fetched successfully');

      } catch (alchemyError) {
        console.error('❌ Alchemy Base API error:', alchemyError.response?.data || alchemyError.message);
        throw new Error(`Base API failed: ${alchemyError.message}`);
      }

    } else if (protocol === 'solana') {
      // ใช้ Alchemy API สำหรับ Solana
      const alchemySolURL = `https://solana-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
      
      try {
        console.log('🔍 Fetching Solana data for:', address);
        
        // 1. ดึง NFT data
        const nftResponse = await axios.post(alchemySolURL, {
          jsonrpc: "2.0",
          id: 1,
          method: "getAssetsByOwner",
          params: {
            ownerAddress: address,
            pageSize: 100
          }
        }, { timeout: 15000 });

        if (nftResponse.data && nftResponse.data.result) {
          onchainData.nftCount = nftResponse.data.result.total || 0;
        }

        // 2. ดึง transaction count
        const signaturesResponse = await axios.post(alchemySolURL, {
          jsonrpc: "2.0",
          id: 1,
          method: "getSignaturesForAddress",
          params: [address, { limit: 100 }]
        }, { timeout: 15000 });

        if (signaturesResponse.data && signaturesResponse.data.result) {
          onchainData.transactionCount = signaturesResponse.data.result.length || 0;
        }

        // 3. ตรวจสอบ DeFi activity
        const transactions = signaturesResponse.data?.result || [];
        const defiProtocols = ['raydium', 'orca', 'jupiter', 'serum', 'saber', 'marinade', 'mango', 'port'];
        onchainData.hasDeFiActivity = transactions.some(tx => 
          defiProtocols.some(protocol => 
            tx.memo?.toLowerCase().includes(protocol)
          )
        );

        // 4. ดึง token balances
        const tokenAccountsResponse = await axios.post(alchemySolURL, {
          jsonrpc: "2.0",
          id: 1,
          method: "getTokenAccountsByOwner",
          params: [
            address,
            { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
            { encoding: "jsonParsed" }
          ]
        }, { timeout: 15000 });

        let solPortfolioValue = 0;
        if (tokenAccountsResponse.data && tokenAccountsResponse.data.result) {
          const tokenAccounts = tokenAccountsResponse.data.result.value || [];
          solPortfolioValue = tokenAccounts.length * 50; // ประมาณค่า tokens
        }

        // คำนวณ portfolio value สำหรับ Solana
        onchainData.portfolioValue = (onchainData.nftCount * 150) + solPortfolioValue;

        console.log('✅ Solana data fetched successfully');

      } catch (alchemyError) {
        console.error('❌ Alchemy Solana API error:', alchemyError.response?.data || alchemyError.message);
        throw new Error(`Solana API failed: ${alchemyError.message}`);
      }
    }

    // คำนวณ degen score
    onchainData.degenScore = calculateDegenScore(onchainData);

    console.log('🎯 Final on-chain data:', {
      protocol: onchainData.protocol,
      transactions: onchainData.transactionCount,
      nfts: onchainData.nftCount,
      defi: onchainData.hasDeFiActivity,
      base: onchainData.hasBaseActivity, // ADDED THIS LOG
      portfolio: `$${onchainData.portfolioValue.toLocaleString()}`,
      degenScore: onchainData.degenScore
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(onchainData),
    };

  } catch (error) {
    console.error('❌ On-chain API error:', error.message);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch on-chain data',
        details: error.message,
        address: address,
        protocol: protocol
      }),
    };
  }
};

// Helper function สำหรับคำนวณ degen score
function calculateDegenScore(data) {
  const score = Math.min(
    (data.transactionCount * 2) + 
    (data.nftCount * 15) + 
    (data.hasDeFiActivity ? 100 : 0) + 
    (data.portfolioValue > 1000 ? 50 : 0) +
    (data.portfolioValue > 10000 ? 100 : 0),
    1000
  );
  
  return Math.floor(score);
}