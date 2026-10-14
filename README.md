# Atelier N° — boutique

Site vitrine e-commerce statique avec fonctions serveur Vercel.

## Changements de cette branche

- Chat Sora relié à Claude via `/api/chat`; la clé API reste côté serveur.
- Commande simplifiée dans un formulaire unique, avec ticket/référence, choix de paiement à la livraison/sur place ou paiement à finaliser par WhatsApp, et enregistrement via `/api/orders` dans Supabase.
- Formulaire de contact relié à `/api/tickets`, qui renvoie une référence de ticket.
- Configuration des liens sociaux dans `public-config.js`.
- Espace propriétaire dans `admin.html` : gestion des produits, commandes, statuts de paiement déclarés et tickets support, protégé côté serveur par `ADMIN_ACCESS_CODE`.
- Catalogue produits public lu depuis Supabase via `/api/products`; les écritures passent par `/api/admin`.
- Tables Supabase décrites dans `supabase/schema.sql`.

## Configuration Vercel

Dans **Project → Settings → Environment Variables**, ajoute les variables suivantes (ne les écris jamais dans `index.html`, `public-config.js`, ni dans Git) :

- `ANTHROPIC_API_KEY` : clé API Claude privée.
- `SUPABASE_URL` : URL du projet Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` : clé serveur privée Supabase. Ne jamais la publier.
- `ADMIN_ACCESS_CODE` : code privé d'accès propriétaire. Le définir comme variable **Sensitive** dans Vercel pour Production et Preview.
- Facultatif : `CLAUDE_MODEL` pour remplacer le modèle par défaut défini dans `api/chat.js`.

Après ajout/modification des variables, redéploie le projet Vercel.

## Base de données Supabase

1. Ouvre le SQL Editor du projet Supabase.
2. Exécute le contenu de `supabase/schema.sql`.
3. Garde la sécurité RLS activée et ne crée aucune policy publique sur `orders` ou `support_tickets`.
4. Ajoute `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` et `ADMIN_ACCESS_CODE` aux variables d'environnement Vercel uniquement. Pour `ADMIN_ACCESS_CODE`, utilise la valeur choisie par le propriétaire, coche le type Sensitive et cible Production et Preview. Ne mets jamais le code dans le HTML ou Git.
5. Après avoir ajouté ou modifié les variables, redéploie le projet Vercel.

Les prix envoyés par le navigateur sont des estimations non vérifiées. Les demandes ne confirment ni le stock, ni le montant final, ni un paiement. Avant d'intégrer un paiement, le prix doit être recalculé à partir d'un catalogue serveur fiable.

## Réseaux sociaux

Modifie `public-config.js` avec les URL publiques complètes HTTPS de WhatsApp, Instagram et TikTok. Le numéro WhatsApp, s'il est utilisé pour les commandes, doit être au format international composé uniquement de chiffres (ex. format Sénégal : `2217XXXXXXXX`, à remplacer par le vrai numéro).

Ces paramètres sont publics par conception. Ne mets aucun mot de passe, jeton ni clé API dans ce fichier.

## Fonctions et limites actuelles

- Claude répond en flux via `/api/chat`.
- Le panier soumet une demande à `/api/orders`, puis peut ouvrir WhatsApp si le numéro est configuré.
- Le formulaire de contact crée un ticket via `/api/tickets`.
- Le paiement Wave/Orange Money automatique, la livraison réelle, les notifications et le suivi client automatisé ne sont pas encore connectés. Le choix « payer maintenant » ouvre WhatsApp au 77 123 45 67, sans marquer le paiement comme réussi.
- L'espace propriétaire se trouve dans `admin.html` et utilise le code côté serveur. Le code n'est jamais intégré au JavaScript public. Change-le dans les variables Vercel, puis redéploie.

## Déploiement

Vercel détecte les fonctions Node.js dans `api/`. Le fichier `vercel.json` configure leur durée d'exécution. Teste le site et les endpoints après avoir configuré les variables et la base.
