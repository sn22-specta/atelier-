const crypto = require("crypto");

function reply(res, status, data) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  return res.status(status).json(data);
}

function validCode(received, expected) {
  if (typeof received !== "string" || typeof expected !== "string" || !expected) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function supabase(path, method = "GET", body) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase non configuré.");
  const response = await fetch(url.replace(/\/$/, "") + "/rest/v1/" + path, {
    method,
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      Prefer: method === "GET" ? "return=representation" : "return=representation"
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const text = await response.text();
  if (!response.ok) {
    console.error("Admin database request failed:", response.status, text.slice(0, 250));
    throw new Error("Opération de base de données impossible.");
  }
  return text ? JSON.parse(text) : [];
}

module.exports = async function handler(req, res) {
  if (!["GET", "POST", "DELETE"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST, DELETE");
    return reply(res, 405, { error: "Méthode non autorisée." });
  }
  const expected = process.env.ADMIN_ACCESS_CODE;
  if (!expected) return reply(res, 503, { error: "Accès propriétaire non configuré sur Vercel." });
  const authorization = req.headers.authorization || "";
  const received = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!validCode(received, expected)) return reply(res, 401, { error: "Code d'accès invalide." });

  try {
    if (req.method === "GET") {
      const resource = String(req.query?.resource || "products");
      if (resource === "products") {
        const data = await supabase("products?select=*&order=created_at.desc");
        return reply(res, 200, { ok: true, data });
      }
      if (resource === "orders") {
        const data = await supabase("orders?select=*&order=created_at.desc&limit=200");
        return reply(res, 200, { ok: true, data });
      }
      if (resource === "tickets") {
        const data = await supabase("support_tickets?select=*&order=created_at.desc&limit=200");
        return reply(res, 200, { ok: true, data });
      }
      return reply(res, 400, { error: "Section inconnue." });
    }

    const body = req.body || {};
    if (body.action === "save_product") {
      const p = body.product || {};
      const name = typeof p.name === "string" ? p.name.trim().slice(0, 120) : "";
      const category = typeof p.category === "string" ? p.category.trim().slice(0, 60) : "Maison";
      const description = typeof p.description === "string" ? p.description.trim().slice(0, 500) : "";
      const image = typeof p.image === "string" ? p.image.trim().slice(0, 1500) : "";
      const tag = typeof p.tag === "string" ? p.tag.trim().slice(0, 50) : "";
      const price = Number(p.price);
      if (!name || !category || !Number.isFinite(price) || price < 0 || price > 1000000000) {
        return reply(res, 400, { error: "Nom, catégorie et prix valide sont obligatoires." });
      }
      if (image && !/^https:\/\//i.test(image)) return reply(res, 400, { error: "L'image doit utiliser une adresse HTTPS." });
      const record = { name, category, description, image, tag, price, published: p.published !== false, updated_at: new Date().toISOString() };
      const id = Number(p.id);
      const data = Number.isSafeInteger(id) && id > 0
        ? await supabase("products?id=eq." + id, "PATCH", record)
        : await supabase("products", "POST", record);
      return reply(res, 200, { ok: true, data: data[0] || null });
    }
    if (body.action === "delete_product") {
      const id = Number(body.id);
      if (!Number.isSafeInteger(id) || id < 1) return reply(res, 400, { error: "Produit invalide." });
      await supabase("products?id=eq." + id, "DELETE");
      return reply(res, 200, { ok: true });
    }
    if (body.action === "update_order") {
      const id = typeof body.id === "string" ? body.id : "";
      const allowed = ["pending_confirmation", "confirmed", "preparing", "shipped", "delivered", "cancelled"];
      if (!id || !allowed.includes(body.status)) return reply(res, 400, { error: "Statut ou commande invalide." });
      await supabase("orders?id=eq." + encodeURIComponent(id), "PATCH", { status: body.status });
      return reply(res, 200, { ok: true });
    }
    if (body.action === "update_payment") {
      const id = typeof body.id === "string" ? body.id : "";
      const allowed = ["unpaid", "pending", "paid", "refunded"];
      if (!id || !allowed.includes(body.payment_status)) return reply(res, 400, { error: "Statut de paiement invalide." });
      await supabase("orders?id=eq." + encodeURIComponent(id), "PATCH", { payment_status: body.payment_status });
      return reply(res, 200, { ok: true });
    }
    if (body.action === "update_ticket") {
      const id = typeof body.id === "string" ? body.id : "";
      const allowed = ["open", "in_progress", "resolved", "closed"];
      if (!id || !allowed.includes(body.status)) return reply(res, 400, { error: "Statut du ticket invalide." });
      await supabase("support_tickets?id=eq." + encodeURIComponent(id), "PATCH", { status: body.status });
      return reply(res, 200, { ok: true });
    }
    return reply(res, 400, { error: "Action inconnue." });
  } catch (error) {
    console.error("Admin endpoint error:", error?.message || error);
    return reply(res, 500, { error: "Erreur serveur. Vérifiez la configuration et réessayez." });
  }
};
