# 🌱 Newsletter — guide d'installation

Newsletter solarpunk pour **DDW 26 — The Purple Show** :
inscription anti-robot **ALTCHA** + backend **Cloudflare Pages** + envoi hebdo via **Gmail**.

```
Visiteur ── clique "Subscribe" (footer)
        └─ modale + widget ALTCHA  ──POST /api/subscribe──►  Cloudflare KV (liste d'abonnés)

Chaque semaine :  toi ── édite newsletter/week.md ── `npm run newsletter`
                       └─ lit les abonnés (/api/export) ─► envoie via Gmail (nodemailer)
```

Aucune donnée chez Google côté inscription, pas de pistage. Tout tient sur le plan **gratuit** de Cloudflare.

---

## Fichiers créés

| Fichier | Rôle |
|---|---|
| `lib/altcha.mjs` | Protocole ALTCHA (défi + vérification + jeton de désinscription) |
| `functions/api/altcha.js` | `GET` — émet un défi signé pour le widget |
| `functions/api/subscribe.js` | `POST` — honeypot + ALTCHA + anti-rejeu → stocke dans KV |
| `functions/api/unsubscribe.js` | `GET` — désinscription en un clic (lien signé) |
| `functions/api/export.js` | `GET` — liste des abonnés (protégée par `ADMIN_TOKEN`) |
| `newsletter.js` + modale dans `show.html` | UI d'inscription (front) |
| `newsletter/send.mjs` | Script d'envoi hebdo (Gmail) |
| `newsletter/template.mjs` | Gabarit HTML de l'e-mail |
| `newsletter/week.md` | **Le contenu que tu édites chaque semaine** |
| `wrangler.toml`, `package.json`, `.env.example`, `.dev.vars.example` | Config |

---

## 1. Prérequis (une seule fois)

```bash
npm install
```

Génère deux secrets et garde-les de côté :

```bash
openssl rand -hex 32   # -> ALTCHA_HMAC_KEY
openssl rand -hex 24   # -> ADMIN_TOKEN
```

> ⚠️ La **même** `ALTCHA_HMAC_KEY` doit être posée à deux endroits : sur Cloudflare
> (secret) **et** dans ton `.env` local (pour signer les liens de désinscription).

---

## 2. Cloudflare — backend

### a) Connexion + base d'abonnés (KV)

```bash
npx wrangler login
npx wrangler kv namespace create NEWSLETTER
```

Copie l'`id` renvoyé dans **`wrangler.toml`** (remplace `REMPLACE_PAR_TON_ID_KV`).

### b) Déployer le site + l'API

```bash
npm run deploy        # = wrangler pages deploy .
```

La 1re fois, Wrangler crée le projet Pages et te donne l'URL
(ex. `https://ddw26.pages.dev`).

### c) Poser les secrets en production

```bash
npx wrangler pages secret put ALTCHA_HMAC_KEY   # colle la clé hex de 64 car.
npx wrangler pages secret put ADMIN_TOKEN       # colle le jeton de 48 car.
```

> Alternative clic-bouton : dashboard Cloudflare → **Workers & Pages → ddw26 →
> Settings → Variables and Secrets**.

✅ À ce stade, l'inscription marche déjà sur le site déployé.

---

## 3. Test en local (optionnel)

```bash
cp .dev.vars.example .dev.vars   # puis colle tes deux secrets dedans
npm run dev                      # http://localhost:8788
```

Le site **et** l'API tournent ensemble. Ouvre la modale « Subscribe », coche
ALTCHA, inscris une adresse de test.

---

## 4. Gmail — l'envoi hebdo

### a) Mot de passe d'application

1. Active la **validation en 2 étapes** sur le compte Gmail.
2. Va sur **https://myaccount.google.com/apppasswords** → crée un mot de passe
   d'application (16 caractères). C'est lui, pas ton mot de passe normal.

### b) Adresse d'expédition (ta question sur le spam 📬)

Gmail n'envoie **que** depuis une adresse qu'il possède. Trois options :

| Option | `From` affiché | Effort |
|---|---|---|
| **A. Gmail dédié au projet** *(recommandé)* | `purpleshow.ddw@gmail.com` | crée un Gmail gratuit, mets-le en `GMAIL_USER` + `NEWSLETTER_FROM` — ton adresse perso reste privée |
| **B. Alias « Send mail as »** | une adresse d'un domaine à toi | Gmail → Paramètres → Comptes → *Envoyer des e-mails en tant que* (à vérifier) |
| C. Ton Gmail perso | `l.germanangue@gmail.com` | zéro effort, mais l'adresse est visible des abonnés |

> ❌ `purpleshow@contact.com` ne marchera pas : ce domaine ne t'appartient pas,
> l'envoi serait rejeté ou classé en spam. Pour une adresse `@tondomaine`, il faut
> posséder le domaine **et** le configurer en alias (option B).

### c) Config locale

```bash
cp .env.example .env
```

Remplis `.env` : `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `NEWSLETTER_FROM`,
`SITE_URL`, `EXPORT_URL`, `ADMIN_TOKEN`, `ALTCHA_HMAC_KEY`.

---

## 5. Envoyer la newsletter (chaque semaine)

```bash
# 1. édite le contenu de la semaine (la 1re ligne "# ..." = objet de l'e-mail)
#    newsletter/week.md   — markdown supporté

# 2. aperçu sans rien envoyer
npm run newsletter -- --dry

# 3. envoi réel
npm run newsletter
```

Le script récupère les abonnés via `/api/export`, génère l'e-mail solarpunk et
envoie un message **personnalisé** à chacun (avec son lien de désinscription).

> **Limites Gmail gratuit** : ~500 destinataires/jour. Large pour démarrer.
> Au-delà, on basculera sur un service d'envoi dédié (Resend, etc.).

---

## Notes anti-robot / vie privée

- **3 barrières** : champ piège (honeypot) + preuve de travail ALTCHA + anti-rejeu (un défi résolu ne sert qu'une fois).
- **Zéro pistage** : ALTCHA est local au navigateur, pas de Google reCAPTCHA.
- **Désinscription** en un clic, lien signé (impossible de désinscrire autrui).
- On ne stocke **que** l'e-mail + la date. Rien d'autre.

## Dépannage rapide

| Symptôme | Piste |
|---|---|
| `captcha_failed` à l'inscription | `ALTCHA_HMAC_KEY` doit être identique entre `/api/altcha` et `/api/subscribe` (c'est le même secret Cloudflare) |
| Le widget ALTCHA ne charge pas | vérifie l'accès réseau au CDN jsdelivr ; en local, lance bien `npm run dev` (pas un simple ouvre-fichier) |
| `npm run newsletter` → 401 | `ADMIN_TOKEN` du `.env` ≠ celui de Cloudflare |
| Mails en spam | utilise l'option A ou B (§4b) et garde un volume raisonnable |
