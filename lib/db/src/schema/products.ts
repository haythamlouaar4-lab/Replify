import { pgTable, serial, text, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cat: text("cat").notNull().default(""),
  price: doublePrecision("price").notNull(),
  stock: integer("stock").notNull().default(0),
  cond: text("cond").notNull().default(""),
  specs: text("specs").notNull().default(""),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
