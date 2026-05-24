import { Router } from "express";

const router = Router();

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

router.post("/chat", async (req, res) => {
  const { model = "gemini-2.5-flash", messages = [], storeConfig, productsList, customerInfo } = req.body as {
    model?: string;
    messages: { role: string; content: string }[];
    storeConfig?: Record<string, unknown>;
    productsList?: { id: number; name: string; price: number; stock: number; cond?: string; specs?: string }[];
    customerInfo?: { name: string; phone: string; wilaya: string; commune: string };
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "Gemini API key not configured on server" });
    return;
  }

  const productsText = productsList && productsList.length > 0
    ? productsList.map(p => `- ${p.name}: ${p.price} DZD, stock: ${p.stock}${p.stock === 0 ? ' (نافد)' : ''}${p.specs ? `, ${p.specs}` : ''}`).join("\n")
    : "لا توجد منتجات متاحة حالياً";

  const systemPrompt = [
    `أنت مساعد مبيعات ذكي لمتجر "${(storeConfig as Record<string,string> | undefined)?.shopName ?? 'VipGoPay'}" للألعاب الجزائري.`,
    `تتحدث بالدارجة الجزائرية وتساعد الزبائن.`,
    customerInfo ? `الزبون الحالي: ${customerInfo.name}، هاتف: ${customerInfo.phone}، الولاية: ${customerInfo.wilaya}${customerInfo.commune ? ' / ' + customerInfo.commune : ''}.` : '',
    `منتجات المتجر:\n${productsText}`,
    `التوصيل: مكتب ${(storeConfig as Record<string,string> | undefined)?.officeDesk ?? '400'} DZD، منزل ${(storeConfig as Record<string,string> | undefined)?.officeHome ?? '600'} DZD.`,
    (storeConfig as Record<string,string> | undefined)?.extra ? `تعليمات إضافية: ${(storeConfig as Record<string,string>).extra}` : '',
    `عندما يريد الزبون طلب منتج وهو متوفر، أضف في نهاية ردك هذا الكود بالضبط (لا تشرحه): %%JSON {"order":true,"productId":<id_number>} %%`,
    `إذا المنتج نافد أو ما طلبش بوضوح، ما تضيفش الكود.`,
  ].filter(Boolean).join("\n");

  const geminiMessages = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: geminiMessages,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      req.log.error({ status: response.status, body: errText }, "Gemini API error");
      res.status(502).json({ error: `Gemini error: ${response.status}` });
      return;
    }

    const data = await response.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "واش تحب تعرف؟";
    res.json({ reply });
  } catch (err) {
    req.log.error({ err }, "Chat error");
    res.status(500).json({ error: "Chat service unavailable" });
  }
});

export default router;
