const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const client = jwksClient({
  jwksUri: "https://miniapps.farcaster.xyz/.well-known/jwks.json"
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

exports.handler = async (event) => {
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { statusCode: 401, body: JSON.stringify({ error: "Missing token" }) };
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, getKey, {});
    return {
      statusCode: 200,
      body: JSON.stringify({ fid: decoded.sub })
    };
  } catch (err) {
    return { statusCode: 401, body: JSON.stringify({ error: "Invalid token" }) };
  }
};
