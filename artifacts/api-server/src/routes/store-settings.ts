import { Router } from "express";
import { db } from "@workspace/db";
import { storeSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/store-settings", async (_req, res) => {
  let [row] = await db.select().from(storeSettingsTable).limit(1);
  if (!row) {
    [row] = await db.insert(storeSettingsTable).values({}).returning();
  }
  res.json(row);
});

router.put("/store-settings", async (req, res) => {
  const body = req.body as {
    shopName?: string; shopType?: string; location?: string; hours?: string;
    officeDesk?: string; officeHome?: string; extra?: string; model?: string;
    email?: string; muteNotif?: boolean; wilayaRates?: { wilaya: string; office: string; home: string }[];
  };
  let [existing] = await db.select().from(storeSettingsTable).limit(1);
  if (!existing) {
    [existing] = await db.insert(storeSettingsTable).values({}).returning();
  }
  const [row] = await db
    .update(storeSettingsTable)
    .set({
      shopName: body.shopName ?? existing.shopName,
      shopType: body.shopType ?? existing.shopType,
      location: body.location ?? existing.location,
      hours: body.hours ?? existing.hours,
      officeDesk: body.officeDesk ?? existing.officeDesk,
      officeHome: body.officeHome ?? existing.officeHome,
      extra: body.extra ?? existing.extra,
      model: body.model ?? existing.model,
      email: body.email ?? existing.email,
      muteNotif: body.muteNotif ?? existing.muteNotif,
      wilayaRates: body.wilayaRates ?? existing.wilayaRates,
    })
    .where(eq(storeSettingsTable.id, existing.id))
    .returning();
  res.json(row);
});

export default router;
