const { Settings } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const listSettings = async (req, res) => {
  const settings = await Settings.findAll();
  res.json(settings);
};

const getSetting = async (req, res) => {
  const setting = await Settings.findByPk(req.params.id);
  if (!setting) return res.status(404).json({ message: 'Setting not found' });
  res.json(setting);
};

const createSetting = async (req, res) => {
  const { key, value, description } = req.body;
  const setting = await Settings.create({ key, value, description });
  res.status(201).json(setting);
};

const deleteFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

const updateSetting = async (req, res) => {
  const setting = await Settings.findByPk(req.params.id);
  if (!setting) return res.status(404).json({ message: 'Setting not found' });
  const { key, value, description } = req.body;
  // Sanitize old logo if branding.logo is being updated
  if (key === 'branding' && value.logo && setting.value && setting.value.logo && value.logo !== setting.value.logo) {
    // Only delete if the old logo is in /uploads/
    if (setting.value.logo.startsWith('/uploads/')) {
      const oldLogoPath = path.join(__dirname, '..', setting.value.logo)
      deleteFileIfExists(oldLogoPath)
    }
  }
  await setting.update({ key, value, description });
  res.json(setting);
};

const deleteSetting = async (req, res) => {
  const setting = await Settings.findByPk(req.params.id);
  if (!setting) return res.status(404).json({ message: 'Setting not found' });
  await setting.destroy();
  res.json({ message: 'Setting deleted' });
};

const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Delete old logo if provided and safe
    const oldLogo = req.body.oldLogo;
    if (oldLogo && typeof oldLogo === 'string' && oldLogo.startsWith('/uploads/')) {
      const oldLogoPath = path.join(__dirname, '..', oldLogo);
      if (fs.existsSync(oldLogoPath)) {
        try {
          fs.unlinkSync(oldLogoPath);
        } catch (err) {
          console.error('Failed to delete old logo:', oldLogoPath, err);
        }
      }
    }

    const logoUrl = `/uploads/${req.file.filename}`;
    res.json({ logoUrl });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ message: 'Failed to upload logo' });
  }
};

module.exports = { 
  listSettings, 
  getSetting, 
  createSetting, 
  updateSetting, 
  deleteSetting, 
  uploadLogo,
  upload 
}; 