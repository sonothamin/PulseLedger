const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { createAuditLog } = require('../utils/auditLogger');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        message: 'Username and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    const user = await User.findOne({ 
      where: { username }, 
      include: [{ 
        model: Role, 
        attributes: ['id', 'name', 'permissions'] 
      }] 
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Update last login time
    await user.update({ lastLoginAt: new Date() });
    
    // Create audit log for login
    await createAuditLog(
      user.id,
      'user:login',
      {
        description: 'User logged into the system',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      },
      'auth'
    );
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Set secure cookies
    res.cookie('access_token', accessToken, { 
      httpOnly: true, 
      secure: false, // Set to false for development
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/'
    });
    
    res.cookie('refresh_token', refreshToken, { 
      httpOnly: true, 
      secure: false, // Set to false for development
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
    
    res.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        name: user.name, 
        email: user.email,
        role: user.Role?.name, 
        permissions: user.Role?.permissions || [],
        language: user.language
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: 'Login failed',
      code: 'LOGIN_FAILED'
    });
  }
};

const refresh = async (req, res) => {
  try {
    const token = req.cookies['refresh_token'];
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No refresh token',
        code: 'NO_REFRESH_TOKEN'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, { 
      include: [{ 
        model: Role, 
        attributes: ['id', 'name', 'permissions'] 
      }] 
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        message: 'Invalid user',
        code: 'INVALID_USER'
      });
    }
    
    const accessToken = generateAccessToken(user);
    
    res.cookie('access_token', accessToken, { 
      httpOnly: true, 
      secure: false, // Set to false for development
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/'
    });
    
    res.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        name: user.name, 
        email: user.email,
        role: user.Role?.name, 
        permissions: user.Role?.permissions || [],
        language: user.language
      } 
    });
  } catch (err) {
    console.error('Refresh error:', err);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Refresh token expired',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
    
    res.status(500).json({ 
      message: 'Token refresh failed',
      code: 'REFRESH_FAILED'
    });
  }
};

const logout = async (req, res) => {
  try {
    // Create audit log for logout if user is available
    if (req.user) {
      await createAuditLog(
        req.user.id,
        'user:logout',
        {
          description: 'User logged out of the system',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        },
        'auth'
      );
    }
    
    // Clear cookies with same options they were set with
    res.clearCookie('access_token', { 
      httpOnly: true, 
      secure: false, // Set to false for development
      sameSite: 'lax',
      path: '/'
    });
    res.clearCookie('refresh_token', { 
      httpOnly: true, 
      secure: false, // Set to false for development
      sameSite: 'lax',
      path: '/'
    });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ 
      message: 'Logout failed',
      code: 'LOGOUT_FAILED'
    });
  }
};

const me = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.json({ 
      id: user.id, 
      username: user.username, 
      name: user.name, 
      email: user.email,
      role: user.Role?.name, 
      permissions: user.Role?.permissions || [],
      language: user.language,
      isActive: user.isActive
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ 
      message: 'Failed to get user info',
      code: 'ME_FAILED'
    });
  }
};

const register = async (req, res) => {
  try {
    const { username, password, name, email, roleId, language } = req.body;
    
    if (!username || !password || !name) {
      return res.status(400).json({ 
        message: 'Username, password, and name are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }
    
    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Username already exists',
        code: 'USERNAME_EXISTS'
      });
    }
    
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      username, 
      password: hash, 
      name, 
      email, 
      roleId, 
      language: language || 'en',
      isActive: true
    });
    
    res.status(201).json({ 
      id: user.id, 
      username: user.username, 
      name: user.name,
      message: 'User created successfully'
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ 
      message: 'Registration failed',
      code: 'REGISTER_FAILED'
    });
  }
};

module.exports = { login, refresh, logout, me, register }; 