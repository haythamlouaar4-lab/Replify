import { pgTable, text, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  cust: jsonb("cust").notNull().$type<{ name: string; phone: string; wilaya: string; commune: string }>(),
  product: text("product").notNull(),
  productId: text("product_id").notNull().default("0"),
  price: doublePrecision("price").notNull().default(0),
  status: text("status").notNull().default("pending"),
  time: text("time").notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable);
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
