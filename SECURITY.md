# SmartBin — Politique de Sécurité

> Produit gouvernemental — conforme au [Copenhagen Book](https://thecopenhagenbook.com/) et aux recommandations OWASP.

---

## 1. Authentification

### 1.1 Password

| Règle | Valeur |
|---|---|
| Algorithme de hachage | **Argon2id** (via config hashing Laravel) |
| Longueur minimale | 8 caractères |
| Longueur maximale | 256 caractères |
| Validation | Tous les caractères Unicode autorisés (espaces compris) |
| Modification | Demander l'ancien mot de passe avant tout changement |
| Stockage | Salé + hashé (jamais en clair, jamais loggé) |

### 1.2 Rate Limiting (Login)

| Mesure | Valeur |
|---|---|
| Tentatives avant blocage | 10 |
| Durée de blocage IP | 10 minutes |
| Verrouillage progressif | Augmenter la durée à chaque nouveau dépassement |

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
| Driver | `database` (stocké en BD, pas en fichier) |
| Lifetime | 120 minutes (renouvelable) |
| Expire on close | `true` (fermeture navigateur = fin de session) |
| HttpOnly | `true` (inaccessible en JavaScript) |
| SameSite | `Lax` |
| Secure | `true` en production (HTTPS obligatoire) |
| Rotation | Nouvel ID de session à chaque connexion/rôle changé |
| Invalidation | Supprimer TOUTES les sessions de l'utilisateur si promotion ADMIN |

### 1.5 Multi-Factor Authentication (MFA)

| Règle | Détail |
|---|---|
| Qui ? | **Obligatoire** pour ADMIN, optionnel pour AGENT |
| Méthode | TOTP (application authentificatrice : Google Authenticator, Authy, etc.) |
| Algorithme | HMAC-SHA1, code 6 chiffres, intervalle 30s |
| Secret | 160 bits, CSPRNG, stocké en BD (encrypté au repos) |
| Rate limiting | 5 tentatives → blocage 15 minutes |
| Recovery codes | 8 codes à usage unique (40 bits chacun, hashés avec SHA-256) |
| Régénération | Possible si l'utilisateur a accès à son second facteur |

### 1.6 Vérification Email

- Liens de vérification : token unique (64 bytes aléatoires, hashé SHA-256 en BD)
- Expiration : 24 heures
- Single-use : détruit après première utilisation

### 1.7 Password Reset

- Token : 64 bytes CSPRNG, hashé SHA-256
- Expiration : 60 minutes
- Single-use : détruit après utilisation
- Rate limiting : 1 tentative / 60 secondes par email

### 1.8 Open Redirect

Toute redirection après login (paramètre `redirect_to`) doit être validée :

```
Valider que l'URL est relative → pas de domaine externe
Utiliser url()->isValid() sur le paramètre
Ne JAMAIS rediriger vers un domaine non listé dans APP_URL
```

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
| Middleware | `auth:sanctum` sur toutes les routes API |
| Token expiry | 24 heures |
| Refresh token | Rotation automatique |
| Rate limiting | API : 60 req/min ; Auth : 10 req/min |
| CORS | Domaines strictement listés (pas de `*` en production) |
| Headers | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` |

### 4.1 CORS

```php
'allowed_origins' => [env('APP_FRONTEND_URL', 'http://localhost:5173')],
'supports_credentials' => true,
```

En production : liste blanche explicite des origines autorisées. Pas de `Access-Control-Allow-Origin: *`.

---

## 5. Protection des Données

### 5.1 Chiffrement au repos

- Mots de passe : Argon2id (hash, pas encrypté)
- Secrets MFA : encryptés avec `Crypt::encryptString()`
- Données sensibles (email, téléphone) : encryptées si stockées en dehors de la table users

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

## 6. Audit & Logging

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

DB_CONNECTION=mysql
DB_HOST=*** (interne, pas exposé)
DB_PORT=3306
DB_DATABASE=smartbin
DB_USERNAME=smartbin_app
DB_PASSWORD=*** (32+ chars, CSPRNG)

SANCTUM_STATEFUL_DOMAINS=smartbin.cm
SESSION_DOMAIN=.smartbin.cm
```

### 7.2 Headers de sécurité (nginx)

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "0" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'" always;
```

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

## 10. Checklist d'audit

Avant chaque mise en production :

- [ ] `APP_DEBUG=false`
- [ ] `APP_ENV=production`
- [ ] HTTPS fonctionnel (certificat valide)
- [ ] HSTS actif
- [ ] Headers de sécurité présents
- [ ] Rate limiting configuré
- [ ] CSRF actif sur toutes les routes
- [ ] MFA obligatoire pour ADMIN
- [ ] Logs en rotation
- [ ] Backup automatisé
- [ ] `composer audit` — 0 vulnérabilités
- [ ] `npm audit` — 0 vulnérabilités critiques

---

> Document généré le 13/06/2026 — références : [Copenhagen Book](https://thecopenhagenbook.com/), [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)


❌ Pas encore fait
Backend
- ❌ Contrôleurs CRUD : BinController, AlertController, PredictionController, MonitoringController, SensorController
- ❌ Authentification Laravel Breeze/Sanctum : login réel, sessions, tokens API
- ❌ Routes API sécurisées (manque auth pour /api/sensor-readings)
Pages frontend (reliées aux données réelles)
- ❌ Bins (filtres/recherche existent mais données mock)
- ❌ Alerts, Predictions, Sensors, Monitoring, Users, Settings (tous en mock)
Infrastructure
- ❌ Docker / déploiement
- ❌ Tests (Feature/Unit PHPUnit, peut-être frontend)
Arduino (le jour J)
- ❌ Code Arduino à écrire (lecture capteur ultrasons, envoi Serial)
- ❌ Bridge Python à lancer dans un terminal séparé

email:randd981@gmail.com
pwd:admin123