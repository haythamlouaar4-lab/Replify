import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/products", async (req, res) => {
  const rows = await db.select().from(productsTable).orderBy(productsTable.id);
  res.json(rows);
});

router.post("/products", async (req, res) => {
  const { name, cat = "", price, stock = 0, cond = "", specs = "" } = req.body as {
    name: string; cat?: string; price: number; stock?: number; cond?: string; specs?: string;
  };
  if (!name || price == null) {
    res.status(400).json({ error: "name and price are required" });
    return;
  }
  const [row] = await db.insert(productsTable).values({ name, cat, price: Number(price), stock: Number(stock), cond, specs }).returning();
  res.status(201).json(row);
});

router.get("/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.put("/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, cat = "", price, stock = 0, cond = "", specs = "" } = req.body as {
    name: string; cat?: string; price: number; stock?: number; cond?: string; specs?: string;
  };
  const [row] = await db.update(productsTable).set({ name, cat, price: Number(price), stock: Number(stock), cond, specs }).where(eq(productsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.status(204).send();
});

router.patch("/products/:id/stock", async (req, res) => {
  const id = Number(req.params.id);
  const { stock } = req.body as { stock: number };
  const [row] = await db.update(productsTable).set({ stock: Math.max(0, Number(stock)) }).where(eq(productsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

export default router;
