import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTransactionSchema, insertCreditPurchaseRequestSchema } from "@shared/schema";
import { z } from "zod";
import { google } from "googleapis";
import twilio from "twilio";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

// Google Sheets setup
const sheets = google.sheets('v4');
const SPREADSHEET_ID = '1O7AJcTCfXrV63hy2yXwOjdx2I730bf4xB21Z88M9vv4';

// Twilio setup
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_TOKEN
);

// Helper function to authenticate with Google Sheets
async function getAuthenticatedSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: 'hc-sheets-service@n8ntest-461313.iam.gserviceaccount.com',
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  google.options({ auth });
  return sheets.spreadsheets;
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
  } catch (error) {
    console.error('Failed to send SMS:', error);
  }
}

// Helper function to generate game credentials
function generateGameCredentials(userId: string) {
  const username = `user_${userId.substring(0, 8)}_${Date.now()}`;
  const password = Math.random().toString(36).slice(-12);
  return { username, password };
}

// Setup local authentication strategy
function setupLocalAuth(app: Express) {
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !user.passwordHash) {
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));
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

  app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
    res.json({ success: true, user: { ...req.user, passwordHash: undefined } });
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
  app.patch('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { phone, location } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.upsertUser({
        ...user,
        phone,
        location,
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Generate and send game credentials
  app.post('/api/user/game-credentials', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.gameUsername) {
        const credentials = generateGameCredentials(userId);
        await storage.upsertUser({
          ...user,
          gameUsername: credentials.username,
          gamePassword: credentials.password,
        });
        
        // Send welcome SMS
        if (user.phone) {
          const message = `Welcome to DAS Gaming! Your game credentials have been created. Access the game at: https://www.goldendragoncity.com/`;
          await sendSMS(user.phone, message);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error generating game credentials:", error);
      res.status(500).json({ message: "Failed to generate credentials" });
    }
  });

  // Get user transactions
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
        
        await sheetsClient.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: 'A:J',
          valueInputOption: 'RAW',
          requestBody: {
            values,
          },
        });
        
        // Update request with sheet row ID
        await storage.updateCreditPurchaseRequest(request.id, {
          sheetRowId: `${request.id}`,
        });
        
      } catch (sheetsError) {
        console.error("Error adding to Google Sheets:", sheetsError);
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
      const userId = req.user.claims.sub;
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

  const httpServer = createServer(app);
  return httpServer;
}
