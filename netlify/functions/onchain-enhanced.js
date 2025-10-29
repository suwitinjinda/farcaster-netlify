// netlify/functions/onchain-enhanced.js
const axios = require('axios');

// ใช้ Covalent API (รองรับทั้ง Ethereum และ Solana)
const COVALENT_API_KEY = mo8SK-whAlq6FzJ_SjjR2Xozl8RWYd3w;

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
      portfolioValue: 0,
      degenScore: 0,
      lastUpdated: new Date().toISOString()
    };

    if (protocol === 'ethereum') {
      // ดึงข้อมูล Ethereum
      const [txResponse, nftResponse, balanceResponse] = await Promise.allSettled([
        axios.get(`https://api.covalenthq.com/v1/1/address/${address}/transactions_v2/?key=${COVALENT_API_KEY}`),
        axios.get(`https://api.covalenthq.com/v1/1/address/${address}/balances_nft/?key=${COVALENT_API_KEY}`),
        axios.get(`https://api.covalenthq.com/v1/1/address/${address}/balances_v2/?key=${COVALENT_API_KEY}`)
      ]);

      // Process Ethereum data...
      if (txResponse.status === 'fulfilled') {
        const transactions = txResponse.value.data.data.items;
        onchainData.transactionCount = transactions.length;
        
        onchainData.totalGasSpent = transactions.reduce((sum, tx) => {
          return sum + (parseFloat(tx.gas_spent) * parseFloat(tx.gas_price) / 1e18);
        }, 0);

        const defiProtocols = ['uniswap', 'aave', 'compound', 'sushiswap', 'curve', 'balancer'];
        onchainData.hasDeFiActivity = transactions.some(tx => 
          defiProtocols.some(protocol => 
            tx.log_events?.some(event => 
              event.sender_name?.toLowerCase().includes(protocol) ||
              event.contract_name?.toLowerCase().includes(protocol)
            )
          )
        );
      }

      if (nftResponse.status === 'fulfilled') {
        onchainData.nftCount = nftResponse.value.data.data.items.filter(item => 
          item.type === 'nft' && item.balance > 0
        ).length;
      }

      if (balanceResponse.status === 'fulfilled') {
        const balances = balanceResponse.value.data.data.items;
        const totalValue = balances.reduce((sum, token) => 
          sum + (token.quote || 0), 0
        );
        onchainData.portfolioValue = totalValue;
      }

    } else if (protocol === 'solana') {
      // ดึงข้อมูล Solana (ใช้ Covalent หรืออื่นๆ)
      const solanaResponse = await axios.get(`https://api.covalenthq.com/v1/solana-mainnet/address/${address}/balances_v2/?key=${COVALENT_API_KEY}`);
      
      const data = solanaResponse.data.data;
      onchainData.transactionCount = data.transaction_count || 0;
      onchainData.nftCount = data.nft_count || 0;
      onchainData.portfolioValue = data.quote || 0;
      
      // Solana-specific metrics
      onchainData.hasDeFiActivity = data.items.some(item => 
        item.protocol?.toLowerCase().includes('raydium') ||
        item.protocol?.toLowerCase().includes('orca') ||
        item.protocol?.toLowerCase().includes('jupiter')
      );
    }

    // คำนวณ degen score
    onchainData.degenScore = Math.min(
      (onchainData.transactionCount * 5) + 
      (onchainData.nftCount * 10) + 
      (onchainData.hasDeFiActivity ? 50 : 0) + 
      (onchainData.totalGasSpent * 100) +
      (onchainData.portfolioValue > 1000 ? 100 : 0),
      1000
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(onchainData),
    };

  } catch (error) {
    console.error('On-chain API error:', error);
    
    // Fallback data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        hasWallet: true,
        protocol: protocol,
        address: address,
        transactionCount: 0,
        nftCount: 0,
        totalGasSpent: 0,
        hasDeFiActivity: false,
        portfolioValue: 0,
        degenScore: 0,
        lastUpdated: new Date().toISOString(),
        note: 'Using fallback data due to API limitations'
      })
    };
  }
};