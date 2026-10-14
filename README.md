# Atelier N° — boutique

Site vitrine e-commerce statique avec fonctions serveur Vercel.

## Changements de cette branche

- Chat Sora relié à Claude via `/api/chat`; la clé API reste côté serveur.
- Demandes de commande via le panier et `/api/orders`, avec référence et statut initial « en attente de confirmation ».
- Formulaire de contact relié à `/api/tickets`, qui renvoie une référence de ticket.
- Configuration des liens sociaux dans `public-config.js`.
- Panneau d'administration local retiré du site public : il n'était pas sécurisé.
- Tables Supabase décrites dans `supabase/schema.sql`.

## Configuration Vercel

Dans **Project → Settings → Environment Variables**, ajoute les variables suivantes (ne les écris jamais dans `index.html`, `public-config.js`, ni dans Git) :

- `ANTHROPIC_API_KEY` : clé API Claude privée.
- `SUPABASE_URL` : URL du projet Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` : clé serveur privée Supabase. Ne jamais la publier.
- Facultatif : `CLAUDE_MODEL` pour remplacer le modèle par défaut défini dans `api/chat.js`.

Après ajout/modification des variables, redéploie le projet Vercel.

## Base de données Supabase

1. Ouvre le SQL Editor du projet Supabase.
2. Exécute le contenu de `supabase/schema.sql`.
3. Garde la sécurité RLS activée et ne crée aucune policy publique sur `orders` ou `support_tickets`.
4. Ajoute `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` aux variables d'environnement Vercel uniquement.

Les prix envoyés par le navigateur sont des estimations non vérifiées. Les demandes ne confirment ni le stock, ni le montant final, ni un paiement. Avant d'intégrer un paiement, le prix doit être recalculé à partir d'un catalogue serveur fiable.

## Réseaux sociaux

Modifie `public-config.js` avec les URL publiques complètes HTTPS de WhatsApp, Instagram et TikTok. Le numéro WhatsApp, s'il est utilisé pour les commandes, doit être au format international composé uniquement de chiffres (ex. format Sénégal : `2217XXXXXXXX`, à remplacer par le vrai numéro).

Ces paramètres sont publics par conception. Ne mets aucun mot de passe, jeton ni clé API dans ce fichier.

## Fonctions et limites actuelles

- Claude répond en flux via `/api/chat`.
- Le panier soumet une demande à `/api/orders`, puis peut ouvrir WhatsApp si le numéro est configuré.
- Le formulaire de contact crée un ticket via `/api/tickets`.
- Le paiement Wave/Orange Money, la livraison réelle, les notifications et le suivi client automatisé ne sont pas encore connectés.
- Le panneau d'administration est désactivé volontairement jusqu'à la mise en place d'une authentification serveur et d'une interface admin protégée.

## Déploiement

Vercel détecte les fonctions Node.js dans `api/`. Le fichier `vercel.json` configure leur durée d'exécution. Teste le site et les endpoints après avoir configuré les variables et la base.
