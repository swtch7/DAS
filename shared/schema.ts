import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  decimal,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  location: varchar("location"),
  credits: integer("credits").default(0),
  gameUsername: varchar("game_username"),
  gamePassword: varchar("game_password"),
  // Manual account fields
  username: varchar("username").unique(),
  passwordHash: varchar("password_hash"),
  authType: varchar("auth_type").default("google"), // 'google' or 'manual'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Credit transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type").notNull(), // 'purchase', 'redemption', 'game_play'
  amount: integer("amount").notNull(), // credits
  usdValue: decimal("usd_value", { precision: 10, scale: 2 }),
  status: varchar("status").default("pending"), // 'pending', 'completed', 'failed'
  description: text("description"),
  adminUrl: varchar("admin_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Credit purchase requests table
export const creditPurchaseRequests = pgTable("credit_purchase_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  creditsRequested: integer("credits_requested").notNull(),
  usdAmount: decimal("usd_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").default("pending"), // 'pending', 'payment_link_sent', 'completed'
  cashappLink: text("cashapp_link"),
  adminUrl: varchar("admin_url"),
  sheetRowId: varchar("sheet_row_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertCreditPurchaseRequestSchema = createInsertSchema(creditPurchaseRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  usdAmount: z.coerce.string().or(z.number().transform(String)),
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type CreditPurchaseRequest = typeof creditPurchaseRequests.$inferSelect;
export type InsertCreditPurchaseRequest = z.infer<typeof insertCreditPurchaseRequestSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
