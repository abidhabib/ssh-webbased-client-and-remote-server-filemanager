import {
  mysqlTable,
  serial,
  varchar,
  text,
  timestamp,
  int,
} from "drizzle-orm/mysql-core";

// Activity logs table
export const activityLogs = mysqlTable("activity_logs", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 50 }).notNull(),
  path: varchar("path", { length: 2000 }).notNull(),
  details: text("details"),
  ip: varchar("ip", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),
  status: varchar("status", { length: 20 }).notNull().default("success"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Favorite folders
export const favorites = mysqlTable("favorites", {
  id: serial("id").primaryKey(),
  path: varchar("path", { length: 2000 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Recent files/folders accessed
export const recentFiles = mysqlTable("recent_files", {
  id: serial("id").primaryKey(),
  path: varchar("path", { length: 2000 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  accessedAt: timestamp("accessed_at").notNull().defaultNow(),
});

// User settings
export const settings = mysqlTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Server connections
export const connections = mysqlTable("connections", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  host: varchar("host", { length: 255 }).notNull(),
  port: int("port").notNull().default(22),
  username: varchar("username", { length: 255 }).notNull(),
  // Password is NOT stored - user enters it each time
  protocol: varchar("protocol", { length: 10 }).notNull().default("sftp"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
