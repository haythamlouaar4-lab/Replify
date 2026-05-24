import { Router } from "express";

const router = Router();

router.post("/webhooks/store", (req, res) => {
  req.log.info({ query: req.query, body: req.body }, "Webhook received");
  res.json({ received: true });
});

router.get("/webhooks/store", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const expected = process.env.WEBHOOK_VERIFY_TOKEN ?? "vipgopay";
  if (mode === "subscribe" && token === expected) {
    res.status(200).send(challenge);
    return;
  }
  res.status(403).json({ error: "Forbidden" });
});

export default router;
