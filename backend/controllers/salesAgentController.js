const { SalesAgent } = require('../models');

const listAgents = async (req, res) => {
  const agents = await SalesAgent.findAll();
  res.json(agents);
};

const getAgent = async (req, res) => {
  const agent = await SalesAgent.findByPk(req.params.id);
  if (!agent) return res.status(404).json({ message: 'Agent not found' });
  res.json(agent);
};

const createAgent = async (req, res) => {
  const { name, phone, email, isActive } = req.body;
  const agent = await SalesAgent.create({ name, phone, email, isActive });
  res.status(201).json(agent);
};

const updateAgent = async (req, res) => {
  const agent = await SalesAgent.findByPk(req.params.id);
  if (!agent) return res.status(404).json({ message: 'Agent not found' });
  const { name, phone, email, isActive } = req.body;
  await agent.update({ name, phone, email, isActive });
  res.json(agent);
};

const deleteAgent = async (req, res) => {
  const agent = await SalesAgent.findByPk(req.params.id);
  if (!agent) return res.status(404).json({ message: 'Agent not found' });
  await agent.destroy();
  res.json({ message: 'Agent deleted' });
};

module.exports = { listAgents, getAgent, createAgent, updateAgent, deleteAgent }; 