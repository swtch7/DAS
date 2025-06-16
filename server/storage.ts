import {
  users,
  transactions,
  creditPurchaseRequests,
  passwordResetTokens,
  sessions,
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
import { eq, desc, sql, and } from "drizzle-orm";

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
  getAllCreditRequests(): Promise<CreditPurchaseRequest[]>;
  getCreditRequestById(id: number): Promise<CreditPurchaseRequest | undefined>;
  
  // Password reset operations
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;
  
  // Admin operations
  getAllRedemptions(): Promise<any[]>;
  updateTransactionAdminUrl(transactionId: number, adminUrl: string): Promise<void>;
  getUserStats(): Promise<{ totalUsers: number; recentLogins: any[]; newUsersThisWeek: number; }>;
  updateUserLastLogin(userId: string): Promise<void>;
  getAllUsersForAdmin(): Promise<any[]>;
  deleteUser(userId: string): Promise<void>;
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

  async getAllCreditRequests(): Promise<CreditPurchaseRequest[]> {
    return await db
      .select()
      .from(creditPurchaseRequests)
      .orderBy(desc(creditPurchaseRequests.createdAt));
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

  // Admin operations
  async getAllRedemptions(): Promise<any[]> {
    const redemptions = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        amount: transactions.amount,
        usdValue: transactions.usdValue,
        description: transactions.description,
        status: transactions.status,
        adminUrl: transactions.adminUrl,
        createdAt: transactions.createdAt,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.type, 'redemption'))
      .orderBy(desc(transactions.createdAt));
    
    return redemptions;
  }

  async updateTransactionAdminUrl(transactionId: number, adminUrl: string): Promise<void> {
    await db
      .update(transactions)
      .set({ adminUrl })
      .where(eq(transactions.id, transactionId));
  }

  async getUserStats(): Promise<{ totalUsers: number; recentLogins: any[]; newUsersThisWeek: number; }> {
    const totalUsersResult = await db.select().from(users);
    const totalUsers = totalUsersResult.length;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt
      })
      .from(users)
      .orderBy(desc(users.lastLoginAt));
    
    const recentLogins = allUsers
      .filter(user => user.lastLoginAt != null)
      .slice(0, 10);
    
    const newUsersThisWeek = allUsers
      .filter(user => user.createdAt && user.createdAt >= oneWeekAgo)
      .length;
    
    return {
      totalUsers,
      recentLogins,
      newUsersThisWeek
    };
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getAllUsersForAdmin(): Promise<any[]> {
    // Get all users with their transaction counts and most played game
    const usersWithStats = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        location: users.location,
        credits: users.credits,
        usdBalance: users.usdBalance,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        gameUsername: users.gameUsername,
        gamePassword: users.gamePassword,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // Get transaction stats for each user
    const usersWithTransactionStats = await Promise.all(
      usersWithStats.map(async (user) => {
        // Get total transactions count
        const totalTransactions = await db
          .select({ count: sql<number>`count(*)` })
          .from(transactions)
          .where(eq(transactions.userId, user.id));

        // Get purchase count
        const purchaseCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(transactions)
          .where(and(eq(transactions.userId, user.id), eq(transactions.type, 'purchase')));

        // Get redemption count
        const redemptionCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(transactions)
          .where(and(eq(transactions.userId, user.id), eq(transactions.type, 'redemption')));

        // Get credit purchase requests count
        const creditPurchaseCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(creditPurchaseRequests)
          .where(eq(creditPurchaseRequests.userId, user.id));

        // For now, we'll use a placeholder for most played game
        // This would need to be implemented based on actual game session tracking
        const mostPlayedGame = user.gameUsername ? 'Golden Dragon City' : undefined;
        const gamePlayCount = user.gameUsername ? 1 : 0;

        return {
          ...user,
          totalTransactions: totalTransactions[0]?.count || 0,
          totalPurchases: purchaseCount[0]?.count || 0,
          totalRedemptions: redemptionCount[0]?.count || 0,
          totalCreditRequests: creditPurchaseCount[0]?.count || 0,
          mostPlayedGame,
          gamePlayCount,
          usdBalance: user.usdBalance || '0.00',
        };
      })
    );

    return usersWithTransactionStats;
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete user and all related data (cascading delete)
    await db.transaction(async (tx) => {
      // Delete transactions
      await tx.delete(transactions).where(eq(transactions.userId, userId));
      
      // Delete credit purchase requests
      await tx.delete(creditPurchaseRequests).where(eq(creditPurchaseRequests.userId, userId));
      
      // Delete password reset tokens
      await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
      
      // Delete sessions (sessions table uses sid as primary key, not userId)
      // For now, we'll skip session deletion as it's managed by the session store
      
      // Finally delete the user
      await tx.delete(users).where(eq(users.id, userId));
    });
  }
}

export const storage = new DatabaseStorage();
