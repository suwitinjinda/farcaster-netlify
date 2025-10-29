const axios = require('axios');

exports.handler = async (event) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // This function can be extended for web authentication
  // For now, it just returns a message since Farcaster doesn't have traditional web login
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: 'Web authentication endpoint',
      note: 'Farcaster primarily uses in-app authentication via MiniApps'
    }),
  };
};