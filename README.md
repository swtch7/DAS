# DAS - Digital Asset System

A gaming-inspired financial management platform that transforms personal finance into an engaging, interactive experience with robust authentication and credit management.

## Features

- **Credit Management System**: Buy and redeem credits with real-time USD conversion
- **Transaction Tracking**: Complete history of all credit purchases and redemptions
- **Admin Dashboard**: Administrative interface for managing credit requests and user accounts
- **Game Integration**: Direct access to Golden Dragon City with seamless credential transfer
- **Real-time Processing**: Live transaction updates and status tracking
- **Secure Authentication**: OAuth and local authentication with session management
- **SMS & Email Notifications**: Automated communication for transaction updates

## Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database with Drizzle ORM
- **Authentication**: Passport.js with local and OAuth strategies
- **Real-time**: WebSocket support
- **External APIs**: Google Sheets, Twilio SMS, Nodemailer

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** with custom styling
- **TanStack Query** for data fetching
- **Wouter** for routing
- **Radix UI** components with shadcn/ui

### Database Schema
- Users with credit balances
- Transactions (purchases, redemptions, game sessions)
- Credit purchase requests with admin workflow
- Password reset tokens
- Session management

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Environment variables for external services

### Installation

1. Clone the repository:
```bash
git clone https://github.com/swtch7/DAS.git
cd DAS
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with:
```env
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
EMAIL_USER=your_email_username
EMAIL_PASS=your_email_password
```

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
├── server/                # Express backend
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── replitAuth.ts      # Authentication logic
│   └── index.ts           # Server entry point
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema definitions
└── package.json           # Dependencies and scripts
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/user` - Get current user
- `GET /api/logout` - User logout

### Credit Management
- `POST /api/credit-requests` - Create credit purchase request
- `GET /api/credit-requests/:id` - Get specific request
- `PUT /api/credit-requests/:id` - Update request status (admin)

### Transactions
- `GET /api/transactions` - Get user transactions
- `POST /api/redeem` - Redeem credits

### Admin
- `GET /api/admin/stats` - Admin dashboard statistics
- `GET /api/admin/credit-requests` - All credit requests
- `GET /api/admin/redemptions` - All redemptions

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
Ensure all environment variables are configured in your production environment.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@yourcompany.com or open an issue on GitHub.