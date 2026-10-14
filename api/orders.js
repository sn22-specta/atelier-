const crypto = require("crypto");

function reply(res, status, data) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(status).json(data);
}

module.exports = async function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Vérification non destructive pour diagnostiquer le déploiement sans exposer de secrets.
  if (req.method === "GET") {
    return reply(res, 200, {
      ok: true,
      endpoint: "orders",
      method: "POST",
      databaseConfigured: Boolean(url && key),
      message: url && key ? "Le point de commande est disponible." : "Les variables Supabase du serveur sont manquantes."
    });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return reply(res, 405, { error: "Méthode non autorisée." });
  }
  if (!url || !key) return reply(res, 503, { error: "La réception des commandes n'est pas encore configurée." });

  const body = req.body || {};
  const customer = body.customer || {};
  const name = typeof customer.name === "string" ? customer.name.trim().slice(0, 100) : "";
  const phone = typeof customer.phone === "string" ? customer.phone.trim().slice(0, 40) : "";
  const city = typeof customer.city === "string" ? customer.city.trim().slice(0, 100) : "";
  const address = typeof customer.address === "string" ? customer.address.trim().slice(0, 300) : "";
  const note = typeof customer.note === "string" ? customer.note.trim().slice(0, 1000) : "";
  const items = Array.isArray(body.items) ? body.items.slice(0, 40) : [];
  const paymentMethod = body.paymentMethod === "now" ? "now" : "delivery";

  if (!name || !phone || !city || !address || !items.length) {
    return reply(res, 400, { error: "Nom, téléphone, ville, adresse et articles sont obligatoires." });
  }

  const normalizedItems = [];
  for (const item of items) {
    const productId = Number(item?.id);
    const quantity = Number(item?.quantity);
    const productName = typeof item?.name === "string" ? item.name.trim().slice(0, 100) : "";
    const price = Number(item?.price);
    if (!Number.isSafeInteger(productId) || !productName || !Number.isInteger(quantity) || quantity < 1 || quantity > 20 || !Number.isFinite(price) || price < 0 || price > 100000000) {
      return reply(res, 400, { error: "Un article de la commande est invalide." });
    }
    normalizedItems.push({ product_id: productId, name: productName, unit_price_claimed: price, quantity });
  }

  // Les prix du navigateur sont enregistrés comme estimations non vérifiées.
  // Ne jamais utiliser ce total pour débiter ou confirmer un paiement.
  const estimatedTotal = normalizedItems.reduce((sum, item) => sum + item.unit_price_claimed * item.quantity, 0);
  const reference = "AT-" + crypto.randomBytes(5).toString("hex").toUpperCase();

  try {
    const response = await fetch(url.replace(/\/$/, "") + "/rest/v1/orders", {
      method: "POST",
      headers: {
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        reference,
        customer_name: name,
        customer_phone: phone,
        delivery_city: city,
        delivery_address: address,
        customer_note: note,
        items: normalizedItems,
        estimated_total: estimatedTotal,
        status: "pending_confirmation",
        payment_method: paymentMethod,
        payment_status: paymentMethod === "now" ? "pending" : "unpaid"
      })
    });
    if (!response.ok) {
      console.error("Order persistence failed:", response.status, (await response.text()).slice(0, 300));
      return reply(res, 502, { error: "Impossible d'enregistrer la demande. Réessayez plus tard." });
    }
    return reply(res, 201, {
      ok: true,
      reference,
      status: "pending_confirmation",
      paymentMethod,
      paymentStatus: paymentMethod === "now" ? "pending" : "unpaid",
      message: "Votre commande est enregistrée. La boutique doit confirmer la disponibilité, le prix final et la livraison. Aucun paiement n'a été automatiquement effectué."
    });
  } catch (error) {
    console.error("Order endpoint error:", error?.message || error);
    return reply(res, 500, { error: "Erreur lors de l'enregistrement de la demande." });
  }
};
