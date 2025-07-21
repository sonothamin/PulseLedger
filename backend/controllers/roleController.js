const { Role } = require('../models');

const listRoles = async (req, res) => {
  const roles = await Role.findAll();
  res.json(roles);
};

const getRole = async (req, res) => {
  const role = await Role.findByPk(req.params.id);
  if (!role) return res.status(404).json({ message: 'Role not found' });
  res.json(role);
};

const createRole = async (req, res) => {
  const { name, description, permissions } = req.body;
  const role = await Role.create({ name, description, permissions });
  res.status(201).json(role);
};

const updateRole = async (req, res) => {
  const role = await Role.findByPk(req.params.id);
  if (!role) return res.status(404).json({ message: 'Role not found' });
  const { name, description, permissions } = req.body;
  await role.update({ name, description, permissions });
  res.json(role);
};

const deleteRole = async (req, res) => {
  const role = await Role.findByPk(req.params.id);
  if (!role) return res.status(404).json({ message: 'Role not found' });
  await role.destroy();
  res.json({ message: 'Role deleted' });
};

module.exports = { listRoles, getRole, createRole, updateRole, deleteRole }; 