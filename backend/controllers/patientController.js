const { Patient } = require('../models');

const listPatients = async (req, res) => {
  const patients = await Patient.findAll();
  res.json(patients);
};

const getPatient = async (req, res) => {
  const patient = await Patient.findByPk(req.params.id);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  res.json(patient);
};

const createPatient = async (req, res) => {
  const { name, age, gender, phone, email, address, isActive } = req.body;
  const patient = await Patient.create({ name, age, gender, phone, email, address, isActive });
  res.status(201).json(patient);
};

const updatePatient = async (req, res) => {
  const patient = await Patient.findByPk(req.params.id);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  const { name, age, gender, phone, email, address, isActive } = req.body;
  await patient.update({ name, age, gender, phone, email, address, isActive });
  res.json(patient);
};

const deletePatient = async (req, res) => {
  const patient = await Patient.findByPk(req.params.id);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  await patient.destroy();
  res.json({ message: 'Patient deleted' });
};

module.exports = { listPatients, getPatient, createPatient, updatePatient, deletePatient }; 