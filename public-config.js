/*
 * Configuration publique d'Atelier N°.
 * Ces valeurs ne sont PAS des secrets : elles sont visibles dans le navigateur.
 * Remplace les chaînes vides par les liens publics officiels de la boutique.
 */
window.ATELIER_PUBLIC_CONFIG = Object.freeze({
  // Clé publishable publique : ne jamais y placer une clé secret/service_role.
  supabaseUrl: "https://mdafofdfznufdwscvroq.supabase.co",
  supabasePublishableKey: "sb_publishable_11bcDyC21WlB9kz1OaXsNw_qMoi_ykZ",
  social: Object.freeze({
    whatsapp: "",
    instagram: "",
    tiktok: ""
  }),
  // Numéro international au format chiffres uniquement, sans + ni espaces.
  // Exemple de format : 2217XXXXXXXX. Laisser vide tant qu'il n'est pas confirmé.
  whatsappNumber: "221771234567"
});
