# SmartBin

Application de suivi intelligent des déchets avec monitoring IoT, prédictions IA et tableau de bord temps réel.

## Stack technique

- **Backend :** Laravel 12
- **Frontend :** React 19 + Inertia.js + TypeScript
- **CSS :** Tailwind CSS v4
- **Base de données :** SQLite / MySQL
- **Assets :** Vite 7

## Prérequis

- PHP 8.3+
- Composer
- Node.js 20+
- npm

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/Musakibara/SmartBin.git
cd SmartBin

# Installer les dépendances PHP
composer install

# Installer les dépendances JavaScript
npm install

# Copier le fichier d'environnement
cp .env.example .env
php artisan key:generate

# Lancer les migrations
php artisan migrate

# Compiler les assets (dev)
npm run dev

# Lancer le serveur Laravel
php artisan serve
```

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | Compilation production |
| `php artisan serve` | Serveur Laravel |
| `composer test` | Tests PHPUnit |

## Structure

```
resources/js/
├── Components/       # Composants réutilisables
├── Layouts/          # Layouts (AppLayout, GuestLayout)
├── Pages/            # Pages Inertia
│   ├── Auth/         # Login, SignUp
│   └── Dashboard/    # Tableau de bord principal
└── data/             # Données mock
```
