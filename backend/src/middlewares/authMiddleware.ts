import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { prisma } from '../utils/prisma';

const TENANT_ID = process.env.TENANT_ID || 'b6c7bc25-5353-487e-8671-36a77cb1b380';
const SECRET_KEY = process.env.SECRET_KEY || 'my-super-secret-key-12345';

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) return callback(err);
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// Extend Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Check if it's a local JWT or Azure JWT
    const decoded = jwt.decode(token, { complete: true }) as any;
    if (!decoded) {
      return res.status(401).json({ detail: 'Invalid token' });
    }

    if (decoded.payload.tid) {
      // Azure Token
      jwt.verify(token, getKey, { algorithms: ['RS256'] }, async (err, verifiedToken: any) => {
        if (err) {
          return res.status(401).json({ detail: 'Invalid Azure token' });
        }
        
        const email = verifiedToken.preferred_username || verifiedToken.upn || verifiedToken.email;
        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) {
          return res.status(401).json({ detail: 'User not found' });
        }
        req.user = user;
        next();
      });
    } else {
      // Local Token
      const verified = jwt.verify(token, SECRET_KEY) as any;
      const user = await prisma.users.findUnique({ where: { email: verified.sub } });
      if (!user) {
        return res.status(401).json({ detail: 'User not found' });
      }
      req.user = user;
      next();
    }
  } catch (error) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }
};
