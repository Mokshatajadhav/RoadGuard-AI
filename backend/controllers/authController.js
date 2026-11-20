import { User } from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

/**
 * POST /api/auth/register
 * Register a new user (Citizen, Admin, or Maintenance Crew)
 */
export async function register(req, res, next) {
  try {
    const { name, email, password, role, phone, ward, crewName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Name, email, and password are required.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate User',
        message: 'An account with this email address already exists.',
      });
    }

    const assignedRole = role && ['citizen', 'admin', 'crew'].includes(role) ? role : 'citizen';

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      phone: phone || '',
      ward: ward || 'Ward 01 - Civic Center',
      crewName: crewName || '',
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        ward: user.ward,
        crewName: user.crewName,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Log in with email and password
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Credentials',
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Credentials',
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        ward: user.ward,
        crewName: user.crewName,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Get profile of currently authenticated user
 */
export async function getMe(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        ward: req.user.ward,
        crewName: req.user.crewName,
      },
    });
  } catch (err) {
    next(err);
  }
}
