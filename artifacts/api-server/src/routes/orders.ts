import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/orders", async (_req, res) => {
  const rows = await db.select().from(ordersTable).orderBy(desc(ordersTable.time));
  res.json(rows);
});

router.post("/orders", async (req, res) => {
  const body = req.body as {
    id: string; cust: { name: string; phone: string; wilaya: string; commune: string };
    product: string; productId: number | string; price: number; status: string; time: string;
  };
  const [row] = await db
    .insert(ordersTable)
    .values({
      id: body.id,
      cust: body.cust,
      product: body.product,
      productId: String(body.productId ?? 0),
      price: Number(body.price ?? 0),
      status: body.status ?? "pending",
      time: body.time ?? new Date().toLocaleString(),
    })
    .onConflictDoUpdate({
      target: ordersTable.id,
      set: {
        status: body.status,
        cust: body.cust,
        product: body.product,
        price: Number(body.price ?? 0),
      },
    })
    .returning();
  res.status(201).json(row);
});

router.patch("/orders/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: string };
  const [row] = await db
    .update(ordersTable)
    .set({ status })
    .where(eq(ordersTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

export default router;
