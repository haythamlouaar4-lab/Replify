import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const otpCodesTable = pgTable("otp_codes", {
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});
