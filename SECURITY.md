# SmartBin — Politique de Sécurité

> Produit gouvernemental — conforme au [Copenhagen Book](https://thecopenhagenbook.com/) et aux recommandations OWASP.

---

## 1. Authentification

### 1.1 Password

| Règle | Valeur |
|---|---|
| Algorithme de hachage | **Bcrypt** (12 rounds) — ✅ Réel |
| Longueur minimale | 8 caractères — ✅ Réel |
| Longueur maximale | 256 caractères — ✅ Réel |
| Validation | Tous les caractères Unicode autorisés — ✅ Réel |
| Modification | Demander l'ancien mot de passe avant tout changement — ✅ Réel |
| Stockage | Salé + hashé (jamais en clair, jamais loggé) — ✅ Réel |
| 🔜 Cible prod | Migrer vers **Argon2id** si possible (nécessite PHP argon2 ext) |

### 1.2 Rate Limiting (Login)

| Mesure | Valeur |
|---|---|
| Tentatives avant blocage | **5** (config réel : `LoginRequest.php:63`) — ✅ Réel |
| Durée de blocage IP | Dynamique via `RateLimiter::availableIn()` — ✅ Réel |
| Verrouillage progressif | Oui (laravel RateLimiter) — ✅ Réel |
| 🔜 Cible prod | Passer à 10 tentatives, ajouter Captcha après 3 échecs |

### 1.3 Messages d'erreur

Toujours vagues et génériques :

```
Login → "Identifiants incorrects"
Password Reset → "Si cet email existe, un lien vous a été envoyé"
```

Jamais : "Cet email n'existe pas" ou "Mot de passe incorrect".

### 1.4 Session

| Propriété | Valeur |
|---|---|
| Driver | `file` (dev) / 🔜 `database` (prod) — ⚠️ Réel: `file` |
| Lifetime | 120 minutes — ✅ Réel |
| Expire on close | `false` (dev) / 🔜 `true` (prod) — ⚠️ Réel: `false` |
| HttpOnly | `true` — ✅ Réel |
| SameSite | `Lax` — ✅ Réel |
| Secure | **Non défini** (`SESSION_SECURE_COOKIE` absent du .env) — ❌ Réel |
| Rotation | Nouvel ID de session à chaque connexion — ✅ Réel |
| Invalidation | Supprimer TOUTES les sessions de l'utilisateur si promotion ADMIN — 🔜 À faire |
| 🔜 Cible prod | `SESSION_DRIVER=database`, `SESSION_SECURE_COOKIE=true`, `SESSION_ENCRYPT=true` |

### 1.5 Multi-Factor Authentication (MFA) 🔜

| Règle | Détail |
|---|---|
| Qui ? | **Obligatoire** pour ADMIN, optionnel pour AGENT |
| Méthode | TOTP (application authentificatrice : Google Authenticator, Authy, etc.) |
| Algorithme | HMAC-SHA1, code 6 chiffres, intervalle 30s |
| Secret | 160 bits, CSPRNG, stocké en BD (encrypté au repos) |
| Rate limiting | 5 tentatives → blocage 15 minutes |
| Recovery codes | 8 codes à usage unique (40 bits chacun, hashés avec SHA-256) |
| Régénération | Possible si l'utilisateur a accès à son second facteur |

> 🔜 **Pas encore implémenté.** Package recommandé : `pragmarx/google2fa-laravel`

### 1.6 Vérification Email

- Liens de vérification : **Signed URLs HMAC** (app key Laravel) — ✅ Réel
- Expiration : Pas d'expiration explicite (standard Laravel) — ⚠️ Réel
- Single-use : Oui (marque `email_verified_at`) — ✅ Réel
- Rate limiting : 6 requêtes/minute — ✅ Réel
- Reset si email changé : Oui (`email_verified_at = null`) — ✅ Réel
- 🔜 Cible prod : Ajouter expiration 24h sur les signed URLs

### 1.7 Password Reset

- Token : **LaravelPasswordBroker** (géré par Laravel) — ✅ Réel
- Expiration : 60 minutes — ✅ Réel
- Single-use : Oui — ✅ Réel
- Rate limiting : 1 tentative / 60 secondes par email — ✅ Réel

### 1.8 Open Redirect

- `redirect()->intended(route('dashboard'))` — fallback hardcodé, pas de paramètre user — ✅ Réel
- Aucun open redirect possible dans l'application — ✅ Réel

---

## 2. Autorisation (RBAC)

### 2.1 Rôles

| Rôle | Actions autorisées |
|---|---|
| `ADMIN` | CRUD toutes les entités, configuration système, rapports, gestion utilisateurs |
| `AGENT` | Lecture seule + résolution alertes, mise à jour statut benne, profil personnel |

### 2.2 Middleware

- `role:ADMIN` sur les routes de création/suppression/modification sensibles
- `role:AGENT,ADMIN` sur les routes de consultation et actions terrain
- Interdire l'accès direct aux routes API non autorisées

### 2.3 Principe du moindre privilège

- Un AGENT ne peut pas : créer/supprimer des utilisateurs, modifier des rôles, accéder aux logs, configurer le système.
- Un ADMIN ne peut pas : se rétrograder lui-même (nécessite 2 ADMIN).

---

## 3. Protection CSRF

### 3.1 Configuration

- Middleware `VerifyCsrfToken` actif sur toutes les routes web (défaut Laravel)
- Cookies session : `HttpOnly` + `SameSite=Lax`

### 3.2 Règles

- Toute requête POST/PUT/DELETE doit inclure un token CSRF valide
- Ne JAMAIS désactiver CSRF sur une route qui modifie des données
- Token CSRF : lié à la session utilisateur, pas single-use (ne pas casser le bouton "retour")

---

## 4. API Security (Sanctum)

| Règle | Valeur |
|---|---|
| Middleware | `auth:sanctum` sur toutes les routes API — ✅ Réel |
| Token expiry | **`null` (jamais)** — ❌ Réel |
| 🔜 Cible prod | `SANCTUM_EXPIRATION=525600` (1 an IoT) |
| Token abilities | **`['*']` (tous accès)** — ❌ Réel |
| 🔜 Cible prod | `createToken('arduino-bridge', ['sensor:create'])` |
| Token prefix | **Vide** — ⚠️ Réel |
| 🔜 Cible prod | `SANCTUM_TOKEN_PREFIX=sbt_` |
| Rate limiting API | **Non configuré** — ❌ Réel |
| 🔜 Cible prod | `RateLimiter::for('api', fn => Limit::perMinute(60))` |
| CORS config | **`config/cors.php` absent** — ❌ Réel |
| 🔜 Cible prod | Publier avec `php artisan config:publish cors` |
| Token storage | SHA-256 hash, 40 chars random (240 bits) — ✅ Réel |

### 4.1 CORS

```php
'allowed_origins' => [env('APP_FRONTEND_URL', 'http://localhost:5173')],
'supports_credentials' => true,
```

En production : liste blanche explicite des origines autorisées. Pas de `Access-Control-Allow-Origin: *`.

---

## 5. Protection des Données

### 5.1 Chiffrement au repos

- Mots de passe : **Bcrypt 12 rounds** (hash, pas encrypté) — ✅ Réel
- 🔜 Cible prod : Migrer vers Argon2id si possible
- 🔜 Chiffrement des données sensibles (email, téléphone) au repos : `Crypt::encryptString()` — 🔜 À faire

### 5.2 Chiffrement en transit

- HTTPS obligatoire en production (HSTS avec `max-age=31536000; includeSubDomains`)
- Certificat TLS 1.3 minimum

### 5.3 Validation des entrées

- Toute entrée utilisateur validée via `FormRequest` Laravel
- Échappement XSS automatique via Blade/Inertia
- Désactiver `APP_DEBUG=true` en production

### 5.4 SQL Injection

- Utiliser exclusivement Eloquent ORM (pas de raw SQL)
- Si raw SQL nécessaire : passer par `DB::raw()` avec bindings paramétrés

---

## 6. Audit & Logging 🔜

### 6.1 Actions auditées

| Action | Logger |
|---|---|
| Connexion / Déconnexion | `auth.login`, `auth.logout` |
| Création utilisateur | `user.created` (qui, quoi, quand) |
| Changement de rôle | `user.role.changed` (ancien → nouveau) |
| Suppression benne | `bin.deleted` (qui, quel bin) |
| Résolution alerte | `alert.resolved` (qui, quelle alerte) |
| Échec authentification | `auth.failed` (email, IP, tentative) |
| MFA activé/désactivé | `mfa.toggled` |
| Changement mot de passe | `password.changed` |

### 6.2 Stockage des logs

- Canal `daily` (rotation journalière, rétention 90 jours)
- Logs exportés vers un système centralisé en production (ELK, Grafana Loki, etc.)
- Jamais de données sensibles (mots de passe, tokens) dans les logs

---

## 7. Configuration Production

### 7.1 .env.production

```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://smartbin.cm

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_EXPIRE_ON_CLOSE=true
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SESSION_HTTP_ONLY=true
SESSION_ENCRYPT=true

DB_CONNECTION=mysql
DB_HOST=*** (interne, pas exposé)
DB_PORT=3306
DB_DATABASE=smartbin
DB_USERNAME=smartbin_app
DB_PASSWORD=*** (32+ chars, CSPRNG)

SANCTUM_STATEFUL_DOMAINS=smartbin.cm
SANCTUM_TOKEN_PREFIX=sbt_
SANCTUM_EXPIRATION=525600

SESSION_DOMAIN=.smartbin.cm
```

### 7.2 Headers de sécurité (nginx) 🔜

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "0" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
# CSP à adapter : autoriser Leaflet (CDN tiles), Recharts, Vite HMR en dev
# add_header Content-Security-Policy "default-src 'self'; ..." always;
```

> 🔜 **Config nginx à écrire au déploiement.** Attention : CSP doit autoriser les tiles OpenStreetMap (`tile.openstreetmap.org`) et les polices Figtree.

---

## 8. Dépendances

| Mesure | Détail |
|---|---|
| Mise à jour | `composer audit` hebdomadaire, `npm audit` hebdomadaire |
| Paquets | Épurer les dépendances inutilisées |
| Version PIN | Verrouiller les versions majeures dans `composer.json` |

---

## 9. Déploiement

- `APP_KEY` générée avec `php artisan key:generate` — jamais commitée
- `.env` jamais versionné (déjà dans `.gitignore`)
- Migrations exécutées en CI/CD avant déploiement
- Feature flags pour désactiver rapidement une fonctionnalité en cas d'incident
- Backup automatisé de la base de données (quotidien, rétention 30 jours)

---

## 10. Checklist de mise en production

Avant chaque mise en production :

### 🔴 Bloquant
- [ ] `config/cors.php` publié et configuré (`allowed_origins`, `supports_credentials=true`)
- [ ] Tokens IoT : abilities restreintes (`sensor:create` au lieu de `['*']`)
- [ ] `SANCTUM_EXPIRATION` défini dans `.env` (> 0)
- [ ] `SANCTUM_TOKEN_PREFIX` défini (ex: `sbt_`) pour secret scanning

### ⚠️ Important
- [ ] `SESSION_SECURE_COOKIE=true` (HTTPS obligatoire)
- [ ] `SESSION_ENCRYPT=true`
- [ ] `APP_DEBUG=false`
- [ ] `APP_ENV=production`
- [ ] `APP_URL=https://...` (HTTPS)
- [ ] Rate limiter API global configuré (`RateLimiter::for('api', ...)`)
- [ ] `SESSION_DRIVER=database` (pas `file`)
- [ ] `SESSION_EXPIRE_ON_CLOSE=true`

### ✅ Vérification
- [ ] HTTPS fonctionnel (certificat valide, HSTS actif)
- [ ] Headers de sécurité nginx présents
- [ ] CSRF actif sur toutes les routes web
- [ ] `SESSION_SAME_SITE=lax`
- [ ] `composer audit` — 0 vulnérabilités
- [ ] `npm audit` — 0 vulnérabilités critiques
- [ ] Logs en rotation (canal `daily`)
- [ ] Backup automatisé DB (quotidien, rétention 30 jours)

### 🔜 Futures itérations
- [ ] MFA obligatoire pour ADMIN
- [ ] Audit logging (actions utilisateur centralisées)
- [ ] Argon2id au lieu de bcrypt
- [ ] Chiffrement données sensibles au repos

---

> Document généré le 24/06/2026 — références : [Copenhagen Book](https://thecopenhagenbook.com/), [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

---

> ⚠️ **Note** : Ce document décrit la cible de sécurité pour la production. Les sections marquées 🔜 sont planifiées mais pas encore implémentées. L'état réel du code est documenté à côté de chaque section.