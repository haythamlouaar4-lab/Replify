import { Router } from "express";
import { db } from "@workspace/db";
import { otpCodesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();
const isDev = process.env.NODE_ENV !== "production";

function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post("/auth/request-otp", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email?.includes("@")) {
    res.status(400).json({ success: false, error: "Invalid email" });
    return;
  }

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db
    .insert(otpCodesTable)
    .values({ email: email.toLowerCase(), code, expiresAt })
    .onConflictDoNothing();

  await db
    .delete(otpCodesTable)
    .where(eq(otpCodesTable.email, email.toLowerCase()));

  await db
    .insert(otpCodesTable)
    .values({ email: email.toLowerCase(), code, expiresAt });

  if (isDev) {
    req.log.info({ email, code }, "OTP code (dev mode)");
    res.json({ success: true, devCode: code });
    return;
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "VipGoPay <no-reply@vipgopay.dz>",
          to: [email],
          subject: "رمز التحقق الخاص بك — VipGoPay",
          html: `<div dir="rtl" style="font-family:sans-serif;text-align:right;padding:20px"><h2>🎮 VipGoPay</h2><p>رمز التحقق الخاص بك:</p><h1 style="letter-spacing:10px;color:#06d6f5">${code}</h1><p style="color:#999">صالح لمدة 10 دقائق.</p></div>`,
        }),
      });
      if (!r.ok) {
        const err = await r.json() as { error?: { message?: string } };
        res.json({ success: false, error: err.error?.message ?? `HTTP ${r.status}` });
        return;
      }
    } catch (err) {
      res.json({ success: false, error: err instanceof Error ? err.message : "Email send failed" });
      return;
    }
  } else {
    req.log.warn({ email }, "No RESEND_API_KEY set, OTP not sent");
  }

  res.json({ success: true });
});

router.post("/auth/verify-otp", async (req, res) => {
  const { email, code } = req.body as { email?: string; code?: string };
  if (!email || !code) {
    res.status(400).json({ success: false, error: "email and code are required" });
    return;
  }

  const [row] = await db
    .select()
    .from(otpCodesTable)
    .where(eq(otpCodesTable.email, email.toLowerCase()))
    .limit(1);

  if (!row) {
    res.json({ success: false, error: "No OTP found for this email" });
    return;
  }

  if (new Date() > row.expiresAt) {
    await db.delete(otpCodesTable).where(eq(otpCodesTable.email, email.toLowerCase()));
    res.json({ success: false, error: "OTP expired" });
    return;
  }

  if (row.code !== code.trim()) {
    res.json({ success: false, error: "Invalid OTP code" });
    return;
  }

  await db.delete(otpCodesTable).where(eq(otpCodesTable.email, email.toLowerCase()));
  res.json({ success: true });
});

export default router;
