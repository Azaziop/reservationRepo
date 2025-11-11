# 🐳 Docker Setup Guide - ReservaSalle

This project uses **Laravel Sail** for local development with Docker. All team members can run the exact same environment regardless of OS.

## Prerequisites

### Required
- **Docker Desktop** (with WSL 2 backend on Windows)
  - [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
  - Windows: Enable WSL 2 during installation
  - Mac/Linux: Standard installation

- **Git** — to clone the repository
- **WSL 2** (Windows only) — Docker Desktop installs it
- **At least 4GB RAM** available for Docker

### Recommended
- **Visual Studio Code** with Docker extension
- **Node.js 18+** (optional, can run inside container)

## Quick Start (5 minutes)

### 1️⃣ Clone & Setup

```bash
# Clone the repo
git clone https://github.com/Azaziop/reservationRepo.git
cd reservationRepo

# Copy environment file
cp .env.example .env
```

### 2️⃣ Start Docker Containers

**On Windows (PowerShell) — Open WSL first:**
```powershell
wsl
```

**Then (Mac/Linux/WSL):**
```bash
# Start all containers (MySQL, PHP, Vite)
./vendor/bin/sail up -d

# Verify containers are running
./vendor/bin/sail ps
```

### 3️⃣ Setup Database

```bash
# Run migrations and seed data
./vendor/bin/sail artisan migrate --seed
```

### 4️⃣ Start Development Servers

**Terminal 1 — Vite dev server (frontend hot-reload):**
```bash
./vendor/bin/sail npm install   # first time only
./vendor/bin/sail npm run dev
```

**Terminal 2 — Laravel backend (in new shell):**
```bash
./vendor/bin/sail artisan serve --host=0.0.0.0
```

### 5️⃣ Open Your Browser

Visit: **http://localhost:8000** or **http://localhost**

---

## Detailed Walkthrough

### For Windows Users

1. **Install Docker Desktop**
   - Download: https://www.docker.com/products/docker-desktop
   - During installation: ✓ Check "Use WSL 2 instead of Hyper-V"
   - Restart your computer

2. **Enable WSL 2 Integration in Docker**
   - Open Docker Desktop → Settings
   - Resources → WSL Integration
   - Enable for your Ubuntu distro
   - Click Apply & Restart

3. **Open WSL Shell**
   - Press `Win + R` → type `wsl` → Enter
   - Or open Terminal/PowerShell and run `wsl`

4. **Clone & Setup (in WSL)**
   ```bash
   cd /mnt/c/projects  # or any location you prefer
   git clone https://github.com/Azaziop/reservationRepo.git
   cd reservationRepo
   cp .env.example .env
   ```

5. **Start Containers**
   ```bash
   ./vendor/bin/sail up -d
   ./vendor/bin/sail artisan migrate --seed
   ```

6. **Run Dev Servers** (open 2 WSL terminals)
   ```bash
   # Terminal 1
   ./vendor/bin/sail npm run dev
   
   # Terminal 2
   ./vendor/bin/sail artisan serve --host=0.0.0.0
   ```

7. **Visit** http://localhost:8000

---

### For Mac/Linux Users

1. **Install Docker Desktop**
   - Mac: https://docs.docker.com/desktop/install/mac-install/
   - Linux: https://docs.docker.com/desktop/install/linux-install/

2. **Clone & Setup**
   ```bash
   git clone https://github.com/Azaziop/reservationRepo.git
   cd reservationRepo
   cp .env.example .env
   ```

3. **Start Containers**
   ```bash
   ./vendor/bin/sail up -d
   ./vendor/bin/sail artisan migrate --seed
   ```

4. **Run Dev Servers** (open 2 terminals)
   ```bash
   # Terminal 1
   ./vendor/bin/sail npm run dev
   
   # Terminal 2
   ./vendor/bin/sail artisan serve --host=0.0.0.0
   ```

5. **Visit** http://localhost:8000

---

## Essential Sail Commands

```bash
# Start containers in background
./vendor/bin/sail up -d

# Stop containers
./vendor/bin/sail down

# View logs
./vendor/bin/sail logs -f

# Run artisan commands
./vendor/bin/sail artisan migrate
./vendor/bin/sail artisan tinker
./vendor/bin/sail artisan test

# Run npm commands
./vendor/bin/sail npm install
./vendor/bin/sail npm run dev
./vendor/bin/sail npm run build

# Access MySQL CLI
./vendor/bin/sail mysql

# Restart containers
./vendor/bin/sail restart

# Rebuild containers (if docker files changed)
./vendor/bin/sail build --no-cache
```

---

## Troubleshooting

### ❌ "Docker is not running"
- Start Docker Desktop (Windows/Mac) or Docker daemon (Linux)
- Verify: `docker version`

### ❌ Containers won't start
```bash
# Stop and remove all
./vendor/bin/sail down -v

# Rebuild and start fresh
./vendor/bin/sail build --no-cache
./vendor/bin/sail up -d
```

### ❌ Migrations fail
```bash
# Check database connection
./vendor/bin/sail artisan tinker
# Inside tinker:
DB::connection()->getPdo()  # should not error

# Reset database
./vendor/bin/sail artisan migrate:reset
./vendor/bin/sail artisan migrate --seed
```

### ❌ Port already in use (e.g., 80 or 5173)
Edit `.env`:
```
APP_PORT=8001          # Change from 80
VITE_PORT=5174         # Change from 5173
```

Then restart:
```bash
./vendor/bin/sail restart
```

### ❌ File permissions error on Windows
- Ensure Docker Desktop has access to your drive (Settings → Resources → File Sharing)
- Consider moving project out of OneDrive to `C:\projects\` or similar

### ❌ WSL 2 not installed (Windows)
```powershell
# Run as Administrator
wsl --install
```

Restart computer and retry.

---

## Project Structure

```
reservationRepo/
├── app/                  # Laravel app code
├── resources/js/         # React components
├── database/
│   ├── migrations/       # Database migrations
│   └── seeders/          # Seed data
├── compose.yaml          # Docker Compose config
├── .env                  # Environment variables
├── .env.example          # Template (don't edit)
└── vendor/laravel/sail/  # Sail scaffolding
```

---

## Services & Ports

| Service | Port | URL | Credentials |
|---------|------|-----|-------------|
| Laravel | 80 (8000 if :serve) | http://localhost | - |
| Vite | 5173 | http://localhost:5173 | - |
| MySQL | 3306 | localhost:3306 | User: sail / Pass: password |
| Redis | 6379 | localhost:6379 | - |

---

## Environment Variables

Key `.env` settings for Docker:

```bash
APP_NAME=Laravel
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=mysql              # Docker service name
DB_PORT=3306
DB_DATABASE=reservation_db
DB_USERNAME=sail
DB_PASSWORD=password

APP_PORT=80                # Change if port conflicts
VITE_PORT=5173             # Change if port conflicts
```

For production, use a `.env.production` file with appropriate values.

---

## Tips for Team Development

✅ **Use Sail for everything** — `./vendor/bin/sail artisan`, `./vendor/bin/sail npm`  
✅ **Commit `.env.example`** — Don't commit `.env` (added to `.gitignore`)  
✅ **Share database snapshots** — Use `./vendor/bin/sail mysql-dump` for sharing state  
✅ **Keep Docker images updated** — Run `./vendor/bin/sail build --no-cache` periodically  
✅ **Use `.gitignore`** — Ensure `vendor/`, `node_modules/`, `.env` are ignored  

---

## Next Steps

- Read [Laravel Sail Docs](https://laravel.com/docs/11/sail)
- Read [Inertia.js Docs](https://inertiajs.com/) (frontend framework)
- Read [React Docs](https://react.dev/)
- Check `README.md` for project-specific info

---

## Questions?

If you hit issues:
1. Check logs: `./vendor/bin/sail logs -f`
2. Restart containers: `./vendor/bin/sail restart`
3. Post in team Slack/Discord with:
   - OS (Windows/Mac/Linux)
   - Error message (full output)
   - `docker version` output
   - Steps you took

---

**Happy coding! 🚀**
