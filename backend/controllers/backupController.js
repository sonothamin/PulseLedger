const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '../database.sqlite');
const ALGORITHM = 'aes-256-cbc';
const PASSPHRASE = process.env.BACKUP_PASSPHRASE || 'default_backup_passphrase';

function getKeyIV() {
  const key = crypto.createHash('sha256').update(PASSPHRASE).digest();
  const iv = Buffer.alloc(16, 0); // 16 bytes IV (all zeros)
  return { key, iv };
}

const backup = (req, res) => {
  const { key, iv } = getKeyIV();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const input = fs.createReadStream(DB_PATH);
  res.setHeader('Content-Disposition', 'attachment; filename="backup.enc"');
  res.setHeader('Content-Type', 'application/octet-stream');
  input.pipe(cipher).pipe(res);
};

const restore = (req, res) => {
  const { key, iv } = getKeyIV();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const output = fs.createWriteStream(DB_PATH);
  req.pipe(decipher).pipe(output);
  output.on('finish', () => {
    res.json({ message: 'Database restored successfully.' });
  });
  output.on('error', (err) => {
    res.status(500).json({ message: 'Restore failed', error: err.message });
  });
};

module.exports = { backup, restore }; 