import { pgTable, serial, text, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const storeSettingsTable = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  shopName: text("shop_name").notNull().default("VipGoPay"),
  shopType: text("shop_type").notNull().default("Gaming"),
  location: text("location").notNull().default("الجزائر"),
  hours: text("hours").notNull().default("9:00-22:00"),
  officeDesk: text("office_desk").notNull().default("400"),
  officeHome: text("office_home").notNull().default("600"),
  extra: text("extra").notNull().default(""),
  model: text("model").notNull().default("gemini-2.5-flash"),
  email: text("email").notNull().default(""),
  muteNotif: boolean("mute_notif").notNull().default(false),
  wilayaRates: jsonb("wilaya_rates").notNull().default([]).$type<{ wilaya: string; office: string; home: string }[]>(),
});

export const insertStoreSettingsSchema = createInsertSchema(storeSettingsTable).omit({ id: true });
export type InsertStoreSettings = z.infer<typeof insertStoreSettingsSchema>;
export type StoreSettings = typeof storeSettingsTable.$inferSelect;
