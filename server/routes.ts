import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import { insertTransactionSchema, insertCreditPurchaseRequestSchema, transactions, users } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { z } from "zod";
import { google } from "googleapis";
import twilio from "twilio";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import nodemailer from "nodemailer";
import multer from "multer";
import fs from "fs";
import path from "path";

// Google Sheets setup
const sheets = google.sheets('v4');
const SPREADSHEET_ID = '1O7AJcTCfXrV63hy2yXwOjdx2I730bf4xB21Z88M9vv4';

// Twilio setup
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_TOKEN
);

// Email setup
const emailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Multer setup for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      const error = new Error('Only image files are allowed') as any;
      error.code = 'LIMIT_FILE_TYPE';
      cb(error, false);
    }
  }
});

// Helper function to authenticate with Google Sheets
async function getAuthenticatedSheetsClient() {
  try {
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('Google Service Account private key not found in environment');
    }

    console.log('Private key length:', privateKey.length);
    console.log('Private key starts with:', privateKey.substring(0, 50));

    // Handle different private key formats
    let formattedKey = privateKey;
    
    // If the key contains literal \n characters, replace them
    if (privateKey.includes('\\n')) {
      formattedKey = privateKey.replace(/\\n/g, '\n');
      console.log('Converted escaped newlines to actual newlines');
    }

    // Clean up any leading/trailing whitespace and newlines
    formattedKey = formattedKey.trim();
    
    // Add proper header if missing
    if (!formattedKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
      formattedKey = '-----BEGIN PRIVATE KEY-----\n' + formattedKey;
    }
    
    // Add proper footer if missing
    if (!formattedKey.endsWith('-----END PRIVATE KEY-----')) {
      formattedKey = formattedKey + '\n-----END PRIVATE KEY-----';
    }

    const credentials = {
      type: 'service_account',
      project_id: 'n8ntest-461313',
      private_key_id: '',
      private_key: formattedKey,
      client_email: 'hc-sheets-service@n8ntest-461313.iam.gserviceaccount.com',
      client_id: '',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
    };

    console.log('Creating Google Auth with credentials...');
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    console.log('Google Auth created successfully');
    
    return google.sheets({ version: 'v4', auth }).spreadsheets;
  } catch (error) {
    console.error('Error in getAuthenticatedSheetsClient:', error);
    throw error;
  }
}

// Helper function to send email
async function sendEmail(to: string, subject: string, html: string) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email would be sent:', { to, subject });
      return;
    }

    await emailTransporter.sendMail({
      from: `"DAS Gaming" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

// Helper function to send SMS
async function sendSMS(to: string, message: string) {
  if (!process.env.TWILIO_PHONE_NUMBER) {
    console.log('SMS would be sent:', { to, message });
    return;
  }
  
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    console.log('SMS sent successfully to:', to);
  } catch (error) {
    console.error('Failed to send SMS to', to, '- Error:', error instanceof Error ? error.message : String(error));
    // For testing purposes, log the message that would have been sent
    console.log('🔗 PASSWORD RESET LINK (SMS failed):', message);
  }
}

// Helper function to generate game credentials based on DAS user info
function generateGameCredentials(user: any) {
  // Use DAS username if available, otherwise create one from email/name
  let gameUsername = user.username;
  if (!gameUsername) {
    if (user.email) {
      gameUsername = user.email.split('@')[0];
    } else if (user.firstName && user.lastName) {
      gameUsername = `${user.firstName.toLowerCase()}.${user.lastName.toLowerCase()}`;
    } else {
      gameUsername = `user_${user.id.substring(0, 8)}`;
    }
  }
  
  // Use a consistent password based on user ID for auto-login
  const password = `DAS_${user.id.substring(0, 8)}_Game`;
  return { username: gameUsername, password };
}

// Setup local authentication strategy
function setupLocalAuth(app: Express) {
  passport.use(new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        console.log('Authenticating user:', email);
        // Check if it's an email or username
        let user;
        if (email.includes('@')) {
          user = await storage.getUserByEmail(email);
        } else {
          user = await storage.getUserByUsername(email);
        }
        
        console.log('User found:', user ? 'yes' : 'no');
        
        if (!user || !user.passwordHash) {
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        const isValid = await bcrypt.compare(password, user.passwordHash);
        console.log('Password valid:', isValid);
        
        if (!isValid) {
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        return done(null, user);
      } catch (error) {
        console.error('Auth strategy error:', error);
        return done(error);
      }
    }
  ));
  
  // Configure passport serialization for sessions
  passport.serializeUser((user: any, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log('Deserializing user:', id);
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      console.error('Deserialization error:', error);
      done(error);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);
  setupLocalAuth(app);

  // Manual auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName, username } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);
      
      // Create user
      const user = await storage.createUser({
        id: nanoid(),
        email,
        firstName,
        lastName,
        username,
        passwordHash,
        authType: 'manual',
        credits: 0,
      });
      
      // Log in the user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed after registration" });
        }
        res.json({ success: true, user: { ...user, passwordHash: undefined } });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      console.log('Login attempt:', req.body);
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Direct authentication without passport for now
      let user;
      if (email.includes('@')) {
        user = await storage.getUserByEmail(email);
      } else {
        user = await storage.getUserByUsername(email);
      }
      
      console.log('User found:', user ? 'yes' : 'no');
      
      if (!user || !user.passwordHash) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      const isValid = await bcrypt.compare(password, user.passwordHash);
      console.log('Password valid:', isValid);
      
      if (!isValid) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      // Update last login time
      await storage.updateUserLastLogin(user.id);
      
      // Manual session creation
      req.logIn(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ message: "Login failed" });
        }
        console.log('Login successful for user:', user.username || user.email);
        res.json({ success: true, user: { ...user, passwordHash: undefined } });
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  // Auth routes (works for both Google and manual auth)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      let userId: string;
      
      // Check if this is Google auth (has claims) or manual auth (direct user object)
      if (req.user.claims) {
        userId = req.user.claims.sub;
      } else {
        userId = req.user.id;
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ ...user, passwordHash: undefined });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile
  app.patch('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      let userId: string;
      
      // Check if this is Google auth (has claims) or manual auth (direct user object)
      if (req.user.claims) {
        userId = req.user.claims.sub;
      } else {
        userId = req.user.id;
      }
      
      console.log('Profile update request:', { userId, body: req.body });
      
      const { phone, location } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        console.log('User not found:', userId);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log('Current user data:', user);
      console.log('Updating with phone:', phone, 'location:', location);
      
      const updatedUser = await storage.upsertUser({
        ...user,
        phone,
        location,
        updatedAt: new Date(),
      });
      
      console.log('Updated user result:', updatedUser);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Generate and send game credentials
  app.post('/api/user/game-credentials', isAuthenticated, async (req: any, res) => {
    try {
      let userId: string;
      
      // Check if this is Google auth (has claims) or manual auth (direct user object)
      if (req.user.claims) {
        userId = req.user.claims.sub;
      } else {
        userId = req.user.id;
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.gameUsername) {
        const credentials = generateGameCredentials(user);
        await storage.upsertUser({
          ...user,
          gameUsername: credentials.username,
          gamePassword: credentials.password,
        });
        
        // Send welcome SMS
        if (user.phone) {
          const message = `Welcome to DAS Gaming! Your game credentials: ${credentials.username}/${credentials.password}. Access: https://www.goldendragoncity.com/`;
          await sendSMS(user.phone, message);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error generating game credentials:", error);
      res.status(500).json({ message: "Failed to generate credentials" });
    }
  });

  // Test Google Sheets connection
  app.get('/api/test-sheets', isAuthenticated, async (req, res) => {
    try {
      const sheetsClient = await getAuthenticatedSheetsClient();
      
      // Test reading from the sheet first
      const readResult = await sheetsClient.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'CashApp!A1:J1',
      });
      
      console.log('Sheet read test successful:', readResult.data);
      
      // Test writing a simple row
      const testValues = [
        [
          'TEST',
          'Test User',
          'Test Last',
          'test@example.com',
          '555-0123',
          'Test Location',
          '100',
          '10.00',
          'TEST-LINK',
          new Date().toISOString(),
        ]
      ];
      
      const writeResult = await sheetsClient.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'CashApp!A:J',
        valueInputOption: 'RAW',
        requestBody: {
          values: testValues,
        },
      });
      
      console.log('Sheet write test successful:', writeResult.data);
      
      res.json({ 
        success: true, 
        readResult: readResult.data,
        writeResult: writeResult.data 
      });
      
    } catch (error) {
      console.error("Google Sheets test failed:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : String(error)
      });
    }
  });

  // Get game site auto-login form
  app.get('/api/game-site-login', isAuthenticated, async (req: any, res) => {
    try {
      let userId: string;
      
      // Check if this is Google auth (has claims) or manual auth (direct user object)
      if (req.user.claims) {
        userId = req.user.claims.sub;
      } else {
        userId = req.user.id;
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate credentials if they don't exist
      if (!user.gameUsername) {
        const credentials = generateGameCredentials(user);
        await storage.upsertUser({
          ...user,
          gameUsername: credentials.username,
          gamePassword: credentials.password,
        });
        user.gameUsername = credentials.username;
        user.gamePassword = credentials.password;
      }
      
      // Return HTML form that auto-submits to the game site
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Redirecting to Golden Dragon City...</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              color: white;
            }
            .loader {
              text-align: center;
            }
            .spinner {
              border: 4px solid rgba(255,255,255,0.3);
              border-radius: 50%;
              border-top: 4px solid white;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="loader">
            <div class="spinner"></div>
            <h2>Logging you into Golden Dragon City...</h2>
            <p>Your credentials are being submitted automatically.</p>
          </div>
          
          <form id="gameLoginForm" action="https://www.goldendragoncity.com/login" method="POST" style="display: none;">
            <input type="text" name="username" value="${user.gameUsername}" />
            <input type="password" name="password" value="${user.gamePassword}" />
          </form>
          
          <script>
            // Auto-submit the form after a brief delay
            setTimeout(() => {
              document.getElementById('gameLoginForm').submit();
            }, 2000);
          </script>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
      
    } catch (error) {
      console.error("Error creating game site login:", error);
      res.status(500).json({ message: "Failed to create game login" });
    }
  });

  // Redeem credits
  app.post('/api/redeem-credits', isAuthenticated, async (req: any, res) => {
    try {
      let userId: string;
      
      // Check if this is Google auth (has claims) or manual auth (direct user object)
      if (req.user.claims) {
        userId = req.user.claims.sub;
      } else {
        userId = req.user.id;
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { creditsToRedeem, description } = req.body;
      
      if (!creditsToRedeem || creditsToRedeem <= 0) {
        return res.status(400).json({ message: "Invalid credits amount" });
      }
      
      if ((user.credits || 0) < creditsToRedeem) {
        return res.status(400).json({ message: "Insufficient credits" });
      }

      // Create transaction record
      const transactionData = {
        userId: userId,
        type: 'redeem' as const,
        amount: -creditsToRedeem, // Negative for redemption
        description: description || 'Credit redemption',
        status: 'completed' as const,
      };
      
      const transaction = await storage.createTransaction(transactionData);
      
      // Update user credits
      const newCredits = (user.credits || 0) - creditsToRedeem;
      await storage.updateUserCredits(userId, newCredits);
      
      // Add to Google Sheets
      try {
        const sheetsClient = await getAuthenticatedSheetsClient();
        const values = [
          [
            transaction.id.toString(),
            'REDEEM', // Transaction type
            user.firstName || '',
            user.lastName || '',
            user.email || '',
            user.phone || '',
            user.location || '',
            creditsToRedeem.toString(),
            '0.00', // No USD amount for redemption
            description || 'Credit redemption',
            new Date().toISOString(),
          ]
        ];
        
        console.log('Writing redemption to Google Sheets:', { spreadsheetId: SPREADSHEET_ID, values });
        
        const result = await sheetsClient.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Cashapp!A1',
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: {
            values,
          },
        });
        
        console.log('Google Sheets redemption write successful:', result.data);
        
      } catch (sheetsError) {
        console.error("Error adding redemption to Google Sheets:", sheetsError);
      }
      
      res.json({ 
        success: true, 
        transaction,
        newCredits 
      });
      
    } catch (error) {
      console.error("Error redeeming credits:", error);
      res.status(500).json({ message: "Failed to redeem credits" });
    }
  });

  // Request password reset
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      
      if (!user || user.authType !== 'manual') {
        // Don't reveal if user exists for security
        return res.json({ message: "If an account with that email exists, a reset link has been sent." });
      }

      // Generate reset token
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt,
      });

      // Send SMS with reset link (primary method)
      const resetLink = `${req.protocol}://${req.hostname}/reset-password?token=${token}`;
      
      if (user.phone) {
        const message = `DAS Gaming password reset: ${resetLink} (expires in 1 hour)`;
        await sendSMS(user.phone, message);
      } else {
        // Fallback to email if no phone number
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a1a; color: white; padding: 20px; border-radius: 8px;">
            <h2 style="color: #f39c12; text-align: center;">DAS Gaming - Password Reset</h2>
            <p>You requested a password reset for your DAS Gaming account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #f39c12; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #ccc; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="color: #f39c12; word-break: break-all; font-size: 14px;">${resetLink}</p>
            <p style="color: #ccc; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
          </div>
        `;
        
        await sendEmail(user.email!, "DAS Gaming - Password Reset", emailHtml);
      }

      res.json({ message: "If an account with that email exists, a reset link has been sent." });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Reset password with token
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      // Update user password
      await storage.updateUserPassword(resetToken.userId, passwordHash);
      
      // Mark token as used
      await storage.markTokenAsUsed(token);

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Get user transactions
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      let userId: string;
      
      // Check if this is Google auth (has claims) or manual auth (direct user object)
      if (req.user.claims) {
        userId = req.user.claims.sub;
      } else {
        userId = req.user.id;
      }
      
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Create credit purchase request
  app.post('/api/credit-purchase', isAuthenticated, async (req: any, res) => {
    try {
      let userId: string;
      
      // Check if this is Google auth (has claims) or manual auth (direct user object)
      if (req.user.claims) {
        userId = req.user.claims.sub;
      } else {
        userId = req.user.id;
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const requestData = insertCreditPurchaseRequestSchema.parse({
        userId,
        creditsRequested: req.body.creditsRequested,
        usdAmount: req.body.usdAmount,
      });
      
      const request = await storage.createCreditPurchaseRequest(requestData);
      
      // Add to Google Sheets
      try {
        const sheetsClient = await getAuthenticatedSheetsClient();
        const values = [
          [
            request.id.toString(),
            'BUY', // Transaction type
            user.firstName || '',
            user.lastName || '',
            user.email || '',
            user.phone || '',
            user.location || '',
            request.creditsRequested.toString(),
            request.usdAmount.toString(),
            '', // CashApp Link column (to be filled manually)
            new Date().toISOString(),
          ]
        ];
        
        console.log('Attempting to write to Google Sheets:', { spreadsheetId: SPREADSHEET_ID, values });
        
        const result = await sheetsClient.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Cashapp!A1', // Force start at column A
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: {
            values,
          },
        });
        
        console.log('Google Sheets write successful:', result.data);
        
        // Update request with sheet row ID
        await storage.updateCreditPurchaseRequest(request.id, {
          sheetRowId: `${request.id}`,
        });
        
      } catch (sheetsError) {
        console.error("Error adding to Google Sheets:", sheetsError);
        // Don't fail the request if sheets fails
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error creating credit purchase request:", error);
      res.status(500).json({ message: "Failed to create purchase request" });
    }
  });

  // Process credit redemption
  app.post('/api/credit-redeem', isAuthenticated, async (req: any, res) => {
    try {
      let userId: string;
      
      // Check if this is Google auth (has claims) or manual auth (direct user object)
      if (req.user.claims) {
        userId = req.user.claims.sub;
      } else {
        userId = req.user.id;
      }
      
      const { creditsToRedeem, cashAppUsername } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if ((user.credits || 0) < creditsToRedeem) {
        return res.status(400).json({ message: "Insufficient credits" });
      }
      
      const usdValue = creditsToRedeem * 0.01; // $0.01 per credit
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId,
        type: 'redemption',
        amount: -creditsToRedeem,
        usdValue: usdValue.toString(),
        description: `Credit redemption to ${cashAppUsername}`,
        status: 'pending',
      });
      
      // Update user credits
      await storage.updateUserCredits(userId, (user.credits || 0) - creditsToRedeem);
      
      // Send SMS notification
      if (user.phone) {
        const message = `Your redemption request for ${creditsToRedeem} credits ($${usdValue.toFixed(2)}) has been submitted. You'll receive payment within 24 hours.`;
        await sendSMS(user.phone, message);
      }
      
      res.json({ success: true, transaction });
    } catch (error) {
      console.error("Error processing redemption:", error);
      res.status(500).json({ message: "Failed to process redemption" });
    }
  });

  // Check for updated CashApp links in Google Sheets (webhook endpoint)
  app.post('/api/sheets-webhook', async (req, res) => {
    try {
      // This would be called by a Google Apps Script or external service
      // when CashApp links are added to the sheet
      const { requestId, cashappLink } = req.body;
      
      const request = await storage.getCreditRequestById(requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      // Update request with CashApp link
      await storage.updateCreditPurchaseRequest(requestId, {
        cashappLink,
        status: 'payment_link_sent',
      });
      
      // Get user and send SMS
      const user = await storage.getUser(request.userId);
      if (user && user.phone) {
        const message = `Your payment link is ready: ${cashappLink}. Complete payment to receive your credits.`;
        await sendSMS(user.phone, message);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error processing sheets webhook:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  // Complete credit purchase (called after payment confirmation)
  app.post('/api/complete-purchase/:requestId', async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const request = await storage.getCreditRequestById(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      const user = await storage.getUser(request.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user credits
      const newCredits = (user.credits || 0) + request.creditsRequested;
      await storage.updateUserCredits(request.userId, newCredits);
      
      // Create transaction record
      await storage.createTransaction({
        userId: request.userId,
        type: 'purchase',
        amount: request.creditsRequested,
        usdValue: request.usdAmount.toString(),
        description: 'Credit purchase',
        status: 'completed',
      });
      
      // Update request status
      await storage.updateCreditPurchaseRequest(requestId, {
        status: 'completed',
      });
      
      // Send confirmation SMS
      if (user.phone) {
        const message = `Payment confirmed! ${request.creditsRequested} credits have been added to your account.`;
        await sendSMS(user.phone, message);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing purchase:", error);
      res.status(500).json({ message: "Failed to complete purchase" });
    }
  });

  // Admin Routes
  
  // Get admin statistics
  app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Failed to fetch admin stats' });
    }
  });
  
  // Get all credit purchase requests for admin
  app.get('/api/admin/credit-purchases', isAdmin, async (req, res) => {
    try {
      const requests = await storage.getAllCreditRequests();
      
      // Get user information for each request
      const requestsWithUsers = await Promise.all(
        requests.map(async (request) => {
          const user = await storage.getUser(request.userId);
          return {
            ...request,
            user: user ? { 
              id: user.id, 
              email: user.email, 
              firstName: user.firstName, 
              lastName: user.lastName 
            } : null
          };
        })
      );
      
      res.json(requestsWithUsers);
    } catch (error) {
      console.error("Error fetching admin credit requests:", error);
      res.status(500).json({ message: "Failed to fetch credit requests" });
    }
  });

  // Get all redemption transactions for admin
  app.get('/api/admin/redemptions', isAdmin, async (req, res) => {
    try {
      // Get all redemption transactions
      const redemptions = await storage.getAllRedemptions();
      
      res.json(redemptions);
    } catch (error) {
      console.error("Error fetching admin redemptions:", error);
      res.status(500).json({ message: "Failed to fetch redemptions" });
    }
  });

  // Get all users for admin with comprehensive details
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsersForAdmin();
      res.json(users);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Delete user (admin only)
  app.delete('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      await storage.deleteUser(userId);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Update credit purchase request with admin URL
  app.patch('/api/admin/credit-purchases/:id', isAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { adminUrl } = req.body;
      
      // Get the credit request to find user info
      const creditRequest = await storage.getCreditRequestById(requestId);
      if (!creditRequest) {
        return res.status(404).json({ message: "Credit request not found" });
      }

      // Get user details
      const user = await storage.getUser(creditRequest.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.updateCreditPurchaseRequest(requestId, { adminUrl });
      
      // Send SMS notification if user has phone number
      if (user.phone) {
        try {
          const message = `DAS Gaming: Your credit purchase payment link is ready. Please check your account or contact support.`;
          await sendSMS(user.phone, message);
          console.log(`✅ SMS sent to ${user.phone}: URL sent for credit purchase ${requestId}`);
        } catch (smsError) {
          console.error(`Failed to send SMS to ${user.phone}:`, smsError);
          console.log(`🔗 SMS FAILED - URL sent for credit purchase ${requestId}`);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating credit purchase request:", error);
      res.status(500).json({ message: "Failed to update request" });
    }
  });

  // Confirm payment completion
  app.patch('/api/admin/credit-purchases/:id/confirm', isAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      
      const request = await storage.getCreditRequestById(requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      // Update request status to completed
      await storage.updateCreditPurchaseRequest(requestId, { status: 'completed' });
      
      // Add credits to user account
      const user = await storage.getUser(request.userId);
      if (user) {
        const newCredits = (user.credits || 0) + request.creditsRequested;
        await storage.updateUserCredits(request.userId, newCredits);
        
        // Create transaction record
        await storage.createTransaction({
          userId: request.userId,
          type: 'purchase',
          amount: request.creditsRequested,
          usdValue: request.usdAmount,
          description: `Credit purchase - ${request.creditsRequested} credits`,
          status: 'completed',
        });
        
        // Send SMS confirmation
        if (user.phone) {
          const message = `Payment confirmed! ${request.creditsRequested} credits added to your DAS Gaming account. New balance: ${newCredits} credits.`;
          await sendSMS(user.phone, message);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // Upload photo for credit purchase request
  app.post('/api/admin/credit-purchases/:id/upload-photo', isAdmin, upload.single('photo'), async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ message: "No photo file provided" });
      }
      
      // Get the credit request to verify it exists
      const creditRequest = await storage.getCreditRequestById(requestId);
      if (!creditRequest) {
        return res.status(404).json({ message: "Credit request not found" });
      }
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Generate a unique filename
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `credit-purchase-${requestId}-${Date.now()}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Move the uploaded file to the final location
      fs.renameSync(req.file.path, filePath);
      
      // Update the credit request with photo path (you might want to add a photoPath field to your schema)
      await storage.updateCreditPurchaseRequest(requestId, { 
        photoPath: fileName 
      });
      
      res.json({ 
        success: true, 
        message: "Photo uploaded successfully",
        fileName: fileName 
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      
      // Clean up uploaded file if there was an error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  // Serve uploaded photos for admin viewing
  app.get('/api/admin/photos/:filename', isAdmin, async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(process.cwd(), 'uploads', filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      // Set appropriate content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      const contentType = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      }[ext] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error serving photo:", error);
      res.status(500).json({ message: "Failed to serve photo" });
    }
  });

  // Get specific credit purchase status for tracking
  app.get('/api/credit-purchase/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const purchaseId = parseInt(req.params.id);
      
      const purchase = await storage.getCreditRequestById(purchaseId);
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      
      // Allow access if user owns the purchase OR if user is admin
      const isAdmin = userId === 'admin';
      const isOwner = purchase.userId === userId;
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json({
        id: purchase.id,
        status: purchase.status,
        adminUrl: purchase.adminUrl,
        creditsRequested: purchase.creditsRequested,
        usdAmount: purchase.usdAmount,
        createdAt: purchase.createdAt,
        updatedAt: purchase.updatedAt
      });
    } catch (error) {
      console.error("Error fetching purchase status:", error);
      res.status(500).json({ message: "Failed to fetch purchase status" });
    }
  });

  // Update redemption transaction with admin URL
  app.patch('/api/admin/redemptions/:id', isAdmin, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { adminUrl } = req.body;
      
      // Get transaction to find user info (need to implement this in storage)
      const redemptions = await storage.getAllRedemptions();
      const redemption = redemptions.find(r => r.id === transactionId);
      
      if (!redemption) {
        return res.status(404).json({ message: "Redemption transaction not found" });
      }

      // Get user details
      const user = await storage.getUser(redemption.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.updateTransactionAdminUrl(transactionId, adminUrl);
      
      // Send SMS notification if user has phone number
      if (user.phone) {
        try {
          const message = `DAS Gaming: Your redemption request has been processed. Please check your account or contact support.`;
          await sendSMS(user.phone, message);
          console.log(`✅ SMS sent to ${user.phone}: URL sent for redemption ${transactionId}`);
        } catch (smsError) {
          console.error(`Failed to send SMS to ${user.phone}:`, smsError);
          console.log(`🔗 SMS FAILED - URL sent for redemption ${transactionId}`);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating redemption transaction:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
