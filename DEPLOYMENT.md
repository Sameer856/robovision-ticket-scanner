# 🚀 Deployment Guide - Robovision Ticket Scanner

## 📋 Pre-Deployment Checklist

- [ ] Robovision branding added ✅
- [ ] Environment variables configured
- [ ] Google Sheets credentials setup
- [ ] SSL certificates generated
- [ ] GitHub repository created
- [ ] Domain DNS configured

## 🌐 Subdomain Setup: miseen.robovision.in

### 1. DNS Configuration

Add these DNS records to your domain provider:

```
Type: CNAME
Name: miseen
Value: yourusername.github.io
TTL: 300 (or automatic)
```

OR for custom server:

```
Type: A
Name: miseen
Value: YOUR_SERVER_IP
TTL: 300
```

### 2. GitHub Pages Deployment

#### Step 1: Create GitHub Repository
```bash
cd /Users/sameersmacbookair/Documents/TICKET-BOOKING/ticket-scanner

# Initialize git (if not already done)
git init

# Add files
git add .

# Initial commit
git commit -m "🎟️ Initial Robovision Ticket Scanner deployment"

# Add remote (replace with your GitHub username)
git remote add origin https://github.com/yourusername/robovision-ticket-scanner.git

# Push to GitHub
git push -u origin main
```

#### Step 2: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** / **root**
5. Custom domain: **miseen.robovision.in**
6. ✅ **Enforce HTTPS**

#### Step 3: Verify Deployment
- Wait 5-10 minutes for DNS propagation
- Visit: `https://miseen.robovision.in`
- Ultra-Fast Scanner: `https://miseen.robovision.in/fast`

### 3. Custom Server Deployment (Alternative)

#### Option A: Digital Ocean/VPS

```bash
# SSH to your server
ssh root@YOUR_SERVER_IP

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/yourusername/robovision-ticket-scanner.git
cd robovision-ticket-scanner

# Install dependencies
npm install

# Create environment file
cp env.example .env
nano .env  # Configure your variables

# Generate SSL certificates
sudo apt install certbot
sudo certbot certonly --standalone -d miseen.robovision.in

# Install PM2 for process management
npm install -g pm2

# Start application
pm2 start server.js --name "ticket-scanner"
pm2 startup
pm2 save
```

#### Option B: Heroku Deployment

```bash
# Install Heroku CLI
# Create Heroku app
heroku create robovision-ticket-scanner

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set PORT=443

# Deploy
git push heroku main

# Set custom domain
heroku domains:add miseen.robovision.in
```

## 🔧 Environment Configuration

### Production Environment Variables

```env
# Server
PORT=443
NODE_ENV=production
HOST=0.0.0.0

# SSL (for HTTPS)
SSL_KEY=path/to/privkey.pem
SSL_CERT=path/to/fullchain.pem

# Google Sheets
# Upload credentials.json to server

# Email (optional)
GMAIL_USER=scanner@robovision.in
GMAIL_PASS=your-app-password
```

### SSL Certificate Setup

#### For Custom Domain (Let's Encrypt):
```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d miseen.robovision.in

# Certificates will be at:
# /etc/letsencrypt/live/miseen.robovision.in/privkey.pem
# /etc/letsencrypt/live/miseen.robovision.in/fullchain.pem
```

#### For Development (Self-Signed):
```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

## 📱 Mobile Access Configuration

### Network Setup for Event Day

1. **Find Server IP**:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Output example: 192.168.1.100
```

2. **Configure Firewall**:
```bash
# Allow port 4000
sudo ufw allow 4000

# Or for production
sudo ufw allow 443
```

3. **Mobile URLs**:
- Local network: `https://192.168.1.100:4000/fast`
- Production: `https://miseen.robovision.in/fast`

## 🎯 Performance Optimization

### Server Configuration

```nginx
# /etc/nginx/sites-available/ticket-scanner
server {
    listen 80;
    server_name miseen.robovision.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name miseen.robovision.in;

    ssl_certificate /etc/letsencrypt/live/miseen.robovision.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/miseen.robovision.in/privkey.pem;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Load Balancing (for High Traffic)

```yaml
# docker-compose.yml
version: '3.8'
services:
  app1:
    build: .
    ports:
      - "4001:4000"
    environment:
      - NODE_ENV=production
  
  app2:
    build: .
    ports:
      - "4002:4000"
    environment:
      - NODE_ENV=production
  
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app1
      - app2
```

## 🔍 Monitoring & Analytics

### Server Monitoring

```bash
# Install monitoring
npm install -g pm2

# Start with monitoring
pm2 start server.js --name "ticket-scanner" --watch

# Monitor dashboard
pm2 monit

# View logs
pm2 logs ticket-scanner
```

### Performance Metrics

Monitor these key metrics:
- **Response Time**: < 100ms
- **Concurrent Users**: 20+
- **Memory Usage**: < 512MB
- **CPU Usage**: < 50%
- **Cache Hit Rate**: > 95%

## 🚨 Troubleshooting

### Common Issues

1. **Certificate Errors**:
```bash
# Regenerate certificates
sudo certbot renew
sudo systemctl restart nginx
```

2. **Port Issues**:
```bash
# Check port usage
sudo netstat -tulpn | grep :4000

# Kill process if needed
sudo kill -9 PID
```

3. **DNS Issues**:
```bash
# Check DNS propagation
nslookup miseen.robovision.in
dig miseen.robovision.in
```

4. **Memory Issues**:
```bash
# Restart application
pm2 restart ticket-scanner

# Clear cache
pm2 reload ticket-scanner
```

## 📞 Support

For deployment issues:
- **Technical Support**: support@robovision.in
- **GitHub Issues**: Create an issue in your repository
- **Documentation**: [Robovision.in](https://robovision.in)

## ✅ Deployment Verification

After deployment, verify:

- [ ] Scanner loads at `https://miseen.robovision.in`
- [ ] Ultra-fast scanner works at `https://miseen.robovision.in/fast`
- [ ] Mobile access works on local network
- [ ] QR scanning functions properly
- [ ] Google Sheets integration working
- [ ] SSL certificate valid
- [ ] Robovision branding displays correctly
- [ ] Real-time stats updating
- [ ] Cache system functioning

## 🎉 Go Live!

Your Robovision Ticket Scanner is now live at:
**https://miseen.robovision.in/fast**

Ready to handle 2000+ tickets with 20+ concurrent scanners! 🚀

---

**Made with ❤️ by [Robovision](https://robovision.in)**
