const crypto = require("crypto");

function reply(res, status, data) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(status).json(data);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return reply(res, 405, { error: "Méthode non autorisée." });
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return reply(res, 503, { error: "Le support n'est pas encore configuré." });

  const body = req.body || {};
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : "";
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";
  const topic = typeof body.topic === "string" ? body.topic.trim().slice(0, 80) : "general";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
  const orderReference = typeof body.orderReference === "string" ? body.orderReference.trim().slice(0, 40) : "";

  if (!name || (!phone && !email) || message.length < 5) {
    return reply(res, 400, { error: "Nom, moyen de contact et message sont obligatoires." });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reply(res, 400, { error: "Adresse e-mail invalide." });
  }

  const reference = "TK-" + crypto.randomBytes(5).toString("hex").toUpperCase();
  try {
    const response = await fetch(url.replace(/\/$/, "") + "/rest/v1/support_tickets", {
      method: "POST",
      headers: {
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        reference, customer_name: name, customer_phone: phone,
        customer_email: email || null, topic, message,
        order_reference: orderReference || null, status: "open"
      })
    });
    if (!response.ok) {
      console.error("Ticket persistence failed:", response.status, (await response.text()).slice(0, 300));
      return reply(res, 502, { error: "Impossible d'enregistrer le ticket. Réessayez plus tard." });
    }
    return reply(res, 201, { ok: true, reference, status: "open", message: "Votre demande de support est enregistrée." });
  } catch (error) {
    console.error("Ticket endpoint error:", error?.message || error);
    return reply(res, 500, { error: "Erreur lors de l'enregistrement du ticket." });
  }
};
