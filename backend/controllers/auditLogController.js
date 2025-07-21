const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');
const { ACTION_MAPPINGS, CONTEXT_MAPPINGS, createAuditLog } = require('../utils/auditLogger');

const listLogs = async (req, res) => {
  try {
    const {
      action,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where = {};
    const include = [{ model: User, attributes: ['id', 'username', 'name'] }];

    // Filter by action
    if (action) {
      where.action = { [Op.like]: `%${action}%` };
    }

    // Filter by user
    if (userId) {
      where.userId = userId;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate + ' 23:59:59');
      }
    }

    // Search in action or details
    if (search) {
      where[Op.or] = [
        { action: { [Op.like]: `%${search}%` } }
        // Note: JSON search in SQLite is limited, so we'll search in action only
        // The details are stored as JSON and can be searched in the frontend
      ];
    }

    // Validate sortBy field
    const allowedSortFields = ['createdAt', 'action', 'userId', 'context'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Handle special sorting cases
    let order = [[validSortBy, validSortOrder]];
    
    // For context sorting, we'll sort by createdAt as fallback since SQLite doesn't support JSON_EXTRACT
    if (validSortBy === 'context') {
      order = [['createdAt', validSortOrder]];
    }

    const offset = (page - 1) * limit;

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      include,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};

const getLog = async (req, res) => {
  const log = await AuditLog.findByPk(req.params.id, { include: User });
  if (!log) return res.status(404).json({ message: 'Log not found' });
  res.json(log);
};

const createLog = async (req, res) => {
  const { userId, action, details } = req.body;
  const log = await AuditLog.create({ userId, action, details });
  res.status(201).json(log);
};

const deleteLog = async (req, res) => {
  const log = await AuditLog.findByPk(req.params.id);
  if (!log) return res.status(404).json({ message: 'Log not found' });
  await log.destroy();
  res.json({ message: 'Log deleted' });
};

const deleteAllLogs = async (req, res) => {
  try {
    // Get count before deletion for audit log
    const count = await AuditLog.count();
    
    // Delete all audit logs
    await AuditLog.destroy({ where: {} });
    
    // Create audit log for this action
    await createAuditLog(
      req.user.id,
      'audit:purge_all',
      {
        description: `Deleted all ${count} audit logs`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      },
      'audit'
    );
    
    res.json({ 
      message: `Successfully deleted ${count} audit logs`,
      deletedCount: count
    });
  } catch (error) {
    console.error('Error deleting all audit logs:', error);
    res.status(500).json({ message: 'Failed to delete all audit logs' });
  }
};

const getFilterOptions = async (req, res) => {
  try {
    // Get unique actions from existing logs
    const actions = await AuditLog.findAll({
      attributes: [[AuditLog.sequelize.fn('DISTINCT', AuditLog.sequelize.col('action')), 'action']],
      raw: true
    });

    // Get unique contexts from existing logs - SQLite compatible approach
    const allLogs = await AuditLog.findAll({
      attributes: ['details'],
      where: {
        details: {
          [Op.not]: null
        }
      },
      raw: true
    });

    // Extract contexts manually from JSON details
    const contextSet = new Set();
    allLogs.forEach(log => {
      try {
        const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
        if (details && details.context) {
          contextSet.add(details.context);
        }
      } catch (e) {
        // Skip invalid JSON
      }
    });

    // Get all users (not just those who have created audit logs)
    const users = await User.findAll({
      attributes: ['id', 'username', 'name'],
      order: [['name', 'ASC'], ['username', 'ASC']]
    });

    res.json({
      actions: actions.map(a => ({
        value: a.action,
        label: ACTION_MAPPINGS[a.action] || a.action
      })),
      contexts: Array.from(contextSet)
        .filter(c => c)
        .map(c => ({
          value: c,
          label: CONTEXT_MAPPINGS[c] || c
        })),
      users: users.map(u => ({
        value: u.id,
        label: u.name || u.username
      }))
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ message: 'Failed to fetch filter options' });
  }
};

module.exports = { listLogs, getLog, createLog, deleteLog, deleteAllLogs, getFilterOptions }; 