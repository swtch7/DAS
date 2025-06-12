import {
  users,
  transactions,
  creditPurchaseRequests,
  passwordResetTokens,
  type User,
  type UpsertUser,
  type Transaction,
  type InsertTransaction,
  type CreditPurchaseRequest,
  type InsertCreditPurchaseRequest,
  type PasswordResetToken,
  type InsertPasswordResetToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations - required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserCredits(userId: string, credits: number): Promise<void>;
  
  // Manual auth operations
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  
  // Credit purchase operations
  createCreditPurchaseRequest(request: InsertCreditPurchaseRequest): Promise<CreditPurchaseRequest>;
  updateCreditPurchaseRequest(id: number, updates: Partial<CreditPurchaseRequest>): Promise<CreditPurchaseRequest>;
  getPendingCreditRequests(): Promise<CreditPurchaseRequest[]>;
  getCreditRequestById(id: number): Promise<CreditPurchaseRequest | undefined>;
  
  // Password reset operations
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserCredits(userId: string, credits: number): Promise<void> {
    await db
      .update(users)
      .set({ credits, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [result] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return result;
  }

  async getUserTransactions(userId: string, limit = 10): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async createCreditPurchaseRequest(request: InsertCreditPurchaseRequest): Promise<CreditPurchaseRequest> {
    const [result] = await db
      .insert(creditPurchaseRequests)
      .values(request)
      .returning();
    return result;
  }

  async updateCreditPurchaseRequest(id: number, updates: Partial<CreditPurchaseRequest>): Promise<CreditPurchaseRequest> {
    const [result] = await db
      .update(creditPurchaseRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(creditPurchaseRequests.id, id))
      .returning();
    return result;
  }

  async getPendingCreditRequests(): Promise<CreditPurchaseRequest[]> {
    return await db
      .select()
      .from(creditPurchaseRequests)
      .where(eq(creditPurchaseRequests.status, "pending"));
  }

  async getCreditRequestById(id: number): Promise<CreditPurchaseRequest | undefined> {
    const [request] = await db
      .select()
      .from(creditPurchaseRequests)
      .where(eq(creditPurchaseRequests.id, id));
    return request;
  }

  // Manual auth operations
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Password reset operations
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db
      .insert(passwordResetTokens)
      .values(tokenData)
      .returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
