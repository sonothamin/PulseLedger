const fs = require('fs');
const path = require('path');

const LANG_DIR = path.join(__dirname, '../lang');

const listLanguages = (req, res) => {
  fs.readdir(LANG_DIR, (err, files) => {
    if (err) return res.status(500).json({ message: 'Failed to list languages' });
    const langs = files.filter(f => f.endsWith('.lang')).map(f => f.replace('.lang', ''));
    res.json(langs);
  });
};

const getLanguage = (req, res) => {
  const lang = req.params.lang;
  const filePath = path.join(LANG_DIR, `${lang}.lang`);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ message: 'Language file not found' });
    try {
      const map = JSON.parse(data);
      res.json(map);
    } catch (e) {
      res.status(500).json({ message: 'Invalid language file format' });
    }
  });
};

module.exports = { listLanguages, getLanguage }; 