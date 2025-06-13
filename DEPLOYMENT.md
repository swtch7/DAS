# Deployment Guide

This guide covers deploying the DAS (Digital Asset System) to various platforms.

## Prerequisites

- Node.js 20+
- PostgreSQL database
- Environment variables configured

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your_secure_random_string
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
EMAIL_USER=your_email_username
EMAIL_PASS=your_email_password
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password
NODE_ENV=production
PORT=5000
```

## Database Setup

1. Create a PostgreSQL database
2. Update the `DATABASE_URL` in your environment variables
3. Run database migrations:
```bash
npm run db:push
```

## Local Development

```bash
npm install
npm run dev
```

## Production Deployment

### Build the Application
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## Platform-Specific Deployments

### Heroku
1. Create a new Heroku app
2. Add PostgreSQL addon: `heroku addons:create heroku-postgresql:hobby-dev`
3. Set environment variables: `heroku config:set KEY=value`
4. Deploy: `git push heroku main`

### Railway
1. Connect your GitHub repository
2. Add PostgreSQL database
3. Set environment variables in Railway dashboard
4. Deploy automatically on push

### DigitalOcean App Platform
1. Create new app from GitHub repository
2. Add managed PostgreSQL database
3. Configure environment variables
4. Deploy

### Self-Hosted (Ubuntu/Debian)

1. Install Node.js and PostgreSQL:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql
```

2. Clone and setup:
```bash
git clone https://github.com/swtch7/DAS.git
cd DAS
npm install
npm run build
```

3. Setup systemd service:
```bash
sudo nano /etc/systemd/system/das.service
```

```ini
[Unit]
Description=DAS Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/DAS
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

4. Start service:
```bash
sudo systemctl enable das
sudo systemctl start das
```

## Security Considerations

- Use strong passwords for all accounts
- Enable SSL/TLS certificates
- Configure firewall rules
- Regular security updates
- Monitor application logs

## Monitoring

- Set up application monitoring (e.g., PM2, New Relic)
- Database monitoring and backups
- Log aggregation and alerting
- Uptime monitoring

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify DATABASE_URL format
   - Check database server availability
   - Ensure firewall allows connections

2. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review build logs for specific errors

3. **Authentication Issues**
   - Verify OAuth credentials
   - Check callback URLs
   - Ensure session secret is set

4. **SMS/Email Not Working**
   - Verify Twilio credentials
   - Check email provider settings
   - Review service logs for errors