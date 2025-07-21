const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');
const { createAuditLog } = require('../utils/auditLogger');

const listUsers = async (req, res) => {
  const users = await User.findAll({ include: Role });
  res.json(users);
};

const createUser = async (req, res) => {
  const { username, password, name, email, roleId, language, isActive } = req.body;
  
  // Check if username already exists
  const existingUser = await User.findOne({ where: { username } });
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }
  
  // Hash password
  const hash = await bcrypt.hash(password, 10);
  
  // Create user
  const user = await User.create({
    username,
    password: hash,
    name,
    email,
    roleId,
    language: language || 'en',
    isActive: isActive !== undefined ? isActive : true
  });
  
  // Create audit log
  await createAuditLog(
    req.user.id,
    'user:create',
    {
      description: `Created user: ${username}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    },
    'users',
    'User',
    user.id
  );
  
  res.status(201).json(user);
};

const getUser = async (req, res) => {
  const user = await User.findByPk(req.params.id, { include: Role });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

const updateUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { name, email, roleId, language, isActive } = req.body;
  await user.update({ name, email, roleId, language, isActive });
  
  // Create audit log
  await createAuditLog(
    req.user.id,
    'user:update',
    {
      description: `Updated user: ${user.username}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    },
    'users',
    'User',
    user.id
  );
  
  res.json(user);
};

const deleteUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  const username = user.username; // Store username before deletion
  await user.destroy();
  
  // Create audit log
  await createAuditLog(
    req.user.id,
    'user:delete',
    {
      description: `Deleted user: ${username}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    },
    'users',
    'User',
    parseInt(req.params.id)
  );
  
  res.json({ message: 'User deleted' });
};

const changePassword = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await user.update({ password: hash });
  
  // Create audit log
  await createAuditLog(
    req.user.id,
    'user:password_change',
    {
      description: `Changed password for user: ${user.username}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    },
    'users',
    'User',
    user.id
  );
  
  res.json({ message: 'Password updated' });
};

module.exports = { listUsers, createUser, getUser, updateUser, deleteUser, changePassword }; 