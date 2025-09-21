const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const verificationRoutes = require('./routes/verification');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api', verificationRoutes);

// Serve the scanner pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/fast', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'fast-scanner.html'));
});

// HTTPS options
const httpsOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

// Create HTTPS server
https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
  console.log(`🎟️ Ticket Scanner Server running on https://localhost:${PORT}`);
  console.log(`📱 Mobile Access: https://172.20.10.3:${PORT}`);
  console.log(`📱 Open this URL on your phone/tablet to scan tickets`);
  console.log(`⚠️  You'll see a security warning - click "Advanced" and "Proceed" to continue`);
});
