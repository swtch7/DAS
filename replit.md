# replit.md

## Overview

DAS (Digital Asset System) is a gaming-inspired financial management platform that transforms personal finance into an engaging, interactive experience. The application provides a comprehensive credit management system with real-time USD conversion, transaction tracking, and seamless integration with gaming platforms, specifically Golden Dragon City. The system features robust authentication, admin management capabilities, and automated notification systems.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern development patterns
- **Vite** as the build tool for fast development and optimized production builds
- **TailwindCSS** with custom gaming-themed styling and shadcn/ui components
- **TanStack Query** for efficient data fetching, caching, and synchronization
- **Wouter** for lightweight client-side routing
- **Radix UI** components providing accessible, customizable UI primitives

### Backend Architecture
- **Node.js** with Express.js as the web framework
- **TypeScript** for consistent type safety across the entire application
- **Passport.js** for authentication with support for both OAuth (Google) and local strategies
- **Session-based authentication** with PostgreSQL session storage
- **RESTful API** design with comprehensive error handling

### Database Architecture
- **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations
- **Database schema** includes users, transactions, credit purchase requests, password reset tokens, and session management
- **Structured relationships** between users and their financial activities with proper indexing

## Key Components

### Authentication System
- **Dual authentication strategy**: Google OAuth for quick access and manual registration for user control
- **Session management** with secure HTTP-only cookies and configurable expiration
- **Password reset functionality** with time-limited tokens and email delivery
- **Admin authentication** with separate login flow and elevated permissions

### Credit Management System
- **Real-time credit tracking** with USD conversion and balance management
- **Purchase request workflow** with admin approval process and status tracking
- **Redemption system** with CashApp integration and automated processing
- **Transaction history** with detailed logging and status updates

### Gaming Integration
- **Direct game access** with credential management for Golden Dragon City
- **Seamless transitions** between financial management and gaming platforms
- **Game-specific features** including leaderboards and achievement tracking

### Admin Dashboard
- **Comprehensive management interface** for processing credit requests and monitoring user activity
- **Real-time statistics** including user metrics, transaction volumes, and system health
- **Bulk operations** for efficient administration of multiple requests
- **Audit trails** for all administrative actions and system changes

### Notification System
- **SMS notifications** via Twilio for critical updates and transaction confirmations
- **Email notifications** using Nodemailer for detailed communications and receipts
- **Real-time updates** through the web interface with toast notifications
- **Multi-channel communication** ensuring users receive important information

## Data Flow

1. **User Registration/Login**: Users authenticate via Google OAuth or manual registration, creating secure sessions
2. **Credit Purchase**: Users request credits through predefined packages or custom amounts, triggering admin notification
3. **Admin Processing**: Administrators review requests, generate payment links, and track completion status
4. **Credit Application**: Upon payment confirmation, credits are added to user accounts with transaction logging
5. **Gaming Integration**: Users access games with automatic credential transfer and session management
6. **Credit Redemption**: Users request cash redemptions, which are processed through admin review and external payment systems

## External Dependencies

### Authentication Services
- **Google OAuth**: Provides secure, frictionless authentication for users
- **Session Storage**: PostgreSQL-based session management for security and scalability

### Payment Processing
- **Payment link generation**: Admin-generated secure payment URLs for credit purchases
- **CashApp integration**: For processing credit redemptions and cash transfers

### Communication Services
- **Twilio SMS**: Real-time SMS notifications for critical updates and confirmations
- **Nodemailer**: Email delivery system for detailed communications and receipts
- **Google Sheets API**: Integration for data logging and administrative reporting

### Development Tools
- **Replit-specific integrations**: Development environment optimizations and deployment tools
- **Asset management**: File upload and storage for user-generated content

## Deployment Strategy

### Development Environment
- **Replit-optimized**: Configured for seamless development with hot reloading and debugging
- **Environment variables**: Comprehensive configuration management for all external services
- **Database provisioning**: Automatic PostgreSQL setup with migration support

### Production Deployment
- **Autoscale deployment**: Configured for automatic scaling based on demand
- **Build optimization**: Vite-based build process with code splitting and asset optimization
- **Security hardening**: Production-ready security configurations and HTTPS enforcement

### Database Management
- **Migration system**: Drizzle-based schema management with version control
- **Backup strategies**: Regular database backups with point-in-time recovery
- **Performance monitoring**: Query optimization and index management

## Changelog

```
Changelog:
- June 16, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```