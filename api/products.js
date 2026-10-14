module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(503).json({ error: "Catalogue non configuré." });
  try {
    const response = await fetch(url.replace(/\/$/, "") + "/rest/v1/products?select=id,name,category,price,description,image,tag&published=eq.true&order=created_at.desc", {
      headers: { apikey: key, Authorization: "Bearer " + key }
    });
    if (!response.ok) throw new Error("Catalogue indisponible.");
    const data = await response.json();
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    console.error("Products endpoint error:", error?.message || error);
    return res.status(502).json({ error: "Catalogue temporairement indisponible." });
  }
};
