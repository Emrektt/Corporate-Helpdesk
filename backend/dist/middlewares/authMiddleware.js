"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const prisma_1 = require("../utils/prisma");
const TENANT_ID = process.env.TENANT_ID || 'b6c7bc25-5353-487e-8671-36a77cb1b380';
const SECRET_KEY = process.env.SECRET_KEY || 'my-super-secret-key-12345';
const client = (0, jwks_rsa_1.default)({
    jwksUri: `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`
});
function getKey(header, callback) {
    client.getSigningKey(header.kid, function (err, key) {
        if (err)
            return callback(err);
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
    });
}
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ detail: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        // Check if it's a local JWT or Azure JWT
        const decoded = jsonwebtoken_1.default.decode(token, { complete: true });
        if (!decoded) {
            return res.status(401).json({ detail: 'Invalid token' });
        }
        if (decoded.payload.tid) {
            // Azure Token
            jsonwebtoken_1.default.verify(token, getKey, { algorithms: ['RS256'] }, async (err, verifiedToken) => {
                if (err) {
                    return res.status(401).json({ detail: 'Invalid Azure token' });
                }
                const email = verifiedToken.preferred_username || verifiedToken.upn || verifiedToken.email;
                const user = await prisma_1.prisma.users.findUnique({ where: { email } });
                if (!user) {
                    return res.status(401).json({ detail: 'User not found' });
                }
                req.user = user;
                next();
            });
        }
        else {
            // Local Token
            const verified = jsonwebtoken_1.default.verify(token, SECRET_KEY);
            const user = await prisma_1.prisma.users.findUnique({ where: { email: verified.sub } });
            if (!user) {
                return res.status(401).json({ detail: 'User not found' });
            }
            req.user = user;
            next();
        }
    }
    catch (error) {
        return res.status(401).json({ detail: 'Unauthorized' });
    }
};
exports.authenticate = authenticate;
