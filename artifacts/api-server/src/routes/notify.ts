import { Router } from "express";

const router = Router();

type Order = {
  id: string;
  cust: { name: string; phone: string; wilaya: string; commune: string };
  product: string;
  price: number;
  status: string;
};

type NotifyResult = { channel: string; ok: boolean; error?: string };

async function sendWhatsApp(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string
): Promise<NotifyResult> {
  try {
    const phone = to.replace(/\D/g, "");
    const intlPhone = phone.startsWith("0") ? "213" + phone.slice(1) : phone;
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: intlPhone,
        type: "text",
        text: { body: text },
      }),
    });
    const data = await res.json() as { error?: { message?: string } };
    if (!res.ok) return { channel: "whatsapp", ok: false, error: data.error?.message ?? `HTTP ${res.status}` };
    return { channel: "whatsapp", ok: true };
  } catch (e) {
    return { channel: "whatsapp", ok: false, error: e instanceof Error ? e.message : "Unknown" };
  }
}

async function sendTelegram(botToken: string, chatId: string, text: string): Promise<NotifyResult> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    const data = await res.json() as { ok: boolean; description?: string };
    if (!data.ok) return { channel: "telegram", ok: false, error: data.description };
    return { channel: "telegram", ok: true };
  } catch (e) {
    return { channel: "telegram", ok: false, error: e instanceof Error ? e.message : "Unknown" };
  }
}

async function sendInstagram(accountId: string, accessToken: string, recipientId: string, text: string): Promise<NotifyResult> {
  if (!recipientId) return { channel: "instagram", ok: false, error: "No recipient IGSID configured" };
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${accountId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
    });
    const data = await res.json() as { error?: { message?: string } };
    if (!res.ok) return { channel: "instagram", ok: false, error: data.error?.message ?? `HTTP ${res.status}` };
    return { channel: "instagram", ok: true };
  } catch (e) {
    return { channel: "instagram", ok: false, error: e instanceof Error ? e.message : "Unknown" };
  }
}

async function sendEmail(
  service: string,
  apiKey: string,
  senderEmail: string,
  senderName: string,
  toEmail: string,
  subject: string,
  html: string
): Promise<NotifyResult> {
  try {
    if (service === "resend") {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: `${senderName} <${senderEmail}>`, to: [toEmail], subject, html }),
      });
      const data = await res.json() as { error?: { message?: string } };
      if (!res.ok) return { channel: "email", ok: false, error: data.error?.message ?? `HTTP ${res.status}` };
      return { channel: "email", ok: true };
    }
    return { channel: "email", ok: false, error: `Service '${service}' not implemented` };
  } catch (e) {
    return { channel: "email", ok: false, error: e instanceof Error ? e.message : "Unknown" };
  }
}

router.post("/notify", async (req, res) => {
  const { order, integrations, customerEmail } = req.body as {
    order: Order;
    integrations?: {
      wa?: { phoneNumberId?: string; accessToken?: string; phoneNumber?: string };
      tg?: { botToken?: string; chatId?: string };
      ig?: { accountId?: string; accessToken?: string; recipientId?: string };
      emailSvc?: { service?: string; apiKey?: string; senderEmail?: string; senderName?: string };
    };
    customerEmail?: string | null;
  };

  const msg = `🎮 VipGoPay — طلبية جديدة!\n\nالزبون: ${order.cust.name}\nالهاتف: ${order.cust.phone}\nالولاية: ${order.cust.wilaya}\nالمنتج: ${order.product}\nالسعر: ${order.price} DZD\nالحالة: ✅ مؤكدة\nرقم الطلبية: ${order.id}`;

  const results: NotifyResult[] = [];
  const tasks: Promise<NotifyResult>[] = [];

  const wa = integrations?.wa;
  if (wa?.phoneNumberId?.trim() && wa?.accessToken?.trim() && order.cust.phone) {
    tasks.push(sendWhatsApp(wa.phoneNumberId, wa.accessToken, order.cust.phone, msg));
  }

  const tg = integrations?.tg;
  if (tg?.botToken?.trim() && tg?.chatId?.trim()) {
    tasks.push(sendTelegram(tg.botToken, tg.chatId, msg));
  }

  const ig = integrations?.ig;
  if (ig?.accountId?.trim() && ig?.accessToken?.trim()) {
    tasks.push(sendInstagram(ig.accountId, ig.accessToken, ig.recipientId ?? "", msg));
  }

  const emailSvc = integrations?.emailSvc;
  const toEmail = customerEmail ?? order.cust.name;
  if (emailSvc?.apiKey?.trim() && emailSvc?.senderEmail?.trim() && toEmail?.includes("@")) {
    tasks.push(sendEmail(
      emailSvc.service ?? "resend",
      emailSvc.apiKey,
      emailSvc.senderEmail,
      emailSvc.senderName ?? "VipGoPay",
      toEmail,
      `طلبية جديدة #${order.id}`,
      `<pre style="font-family:sans-serif;white-space:pre-wrap">${msg}</pre>`
    ));
  }

  if (tasks.length === 0) {
    res.json({ results: [], warning: "No integrations configured" });
    return;
  }

  const settled = await Promise.allSettled(tasks);
  for (const s of settled) {
    if (s.status === "fulfilled") results.push(s.value);
    else results.push({ channel: "unknown", ok: false, error: String(s.reason) });
  }

  res.json({ results });
});

export default router;
