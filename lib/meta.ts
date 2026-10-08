import crypto from "node:crypto";

export function verifyMetaSignature(rawBody: string, signature: string | null) {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !signature) return false;
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  return Buffer.byteLength(expected) === Buffer.byteLength(signature) && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function sendWhatsAppText(to: string, body: string) {
  const version = process.env.META_GRAPH_VERSION || "v23.0";
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneId || !token) throw new Error("WhatsApp credentials are missing");
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { preview_url: false, body } })
  });
  if (!response.ok) throw new Error(`WhatsApp API error: ${await response.text()}`);
  return response.json();
}

export async function sendInstagramText(to: string, body: string) {
  const version = process.env.META_GRAPH_VERSION || "v23.0";
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accountId || !token) throw new Error("Instagram credentials are missing");
  const response = await fetch(`https://graph.facebook.com/${version}/${accountId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: to }, message: { text: body } })
  });
  if (!response.ok) throw new Error(`Instagram API error: ${await response.text()}`);
  return response.json();
}
