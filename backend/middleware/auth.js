import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'roadguard_super_secret_jwt_key_2026_secure';

/**
 * Generate signed JWT Token
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Authentication Middleware:
 * Extracts Bearer token from Authorization header and verifies it.
 * Populates req.user.
 */
export async function authenticate(req, res, next) {
  try {
    let token = '';
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication token is required to access this resource.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid Token',
      message: 'Token verification failed or token has expired.',
    });
  }
}

/**
 * Optional Authentication Middleware:
 * If a valid token is present, populates req.user.
 * If no token is provided, proceeds anonymously without blocking (req.user = null).
 * Useful for public complaint viewing or backwards compatibility.
 */
export async function optionalAuthenticate(req, res, next) {
  try {
    let token = '';
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
      }
    }
  } catch (err) {
    // Silently continue without user
    req.user = null;
  }
  next();
}

/**
 * Role-Based Access Control (RBAC) Middleware:
 * Ensures req.user has one of the allowed roles.
 * Must be placed after authenticate.
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required before checking authorization.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Access denied. Role '${req.user.role}' is not authorized. Allowed roles: ${roles.join(', ')}.`,
      });
    }

    next();
  };
}
