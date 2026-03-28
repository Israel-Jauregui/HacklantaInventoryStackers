# Backend API

FastAPI backend for image analysis with Google Gemini, user management, and location-based reports.

## Quick Start

```bash
cd backend

# 1. Start PostgreSQL
docker-compose up -d

# 2. Copy and configure environment
cp .env.example .env
# Edit .env with your actual GEMINI_API_KEY

# 3. Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# or
.\venv\Scripts\activate   # Windows

# 4. Install dependencies
pip install -r requirements.txt

# 5. Run database migrations
python -m alembic upgrade head

# 6. Run the server
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. View the interactive docs at `http://localhost:8000/docs`.

## Database Migrations (Alembic)

This project uses [Alembic](https://alembic.sqlalchemy.org/) for database schema migrations.

### Running Migrations

```bash
# Apply all pending migrations
python -m alembic upgrade head

# Check current migration version
python -m alembic current

# View migration history
python -m alembic history
```

### Creating New Migrations

```bash
# Auto-generate migration from model changes
python -m alembic revision --autogenerate -m "description of changes"

# Create empty migration (for manual SQL)
python -m alembic revision -m "description of changes"
```

### Rolling Back Migrations

```bash
# Rollback one migration
python -m alembic downgrade -1

# Rollback to specific revision
python -m alembic downgrade <revision_id>

# Rollback all migrations
python -m alembic downgrade base
```

### Migration Files

Migration files are stored in `alembic/versions/`. Each file contains:
- `upgrade()` - Apply the migration
- `downgrade()` - Revert the migration

## Docker Commands

```bash
# Start PostgreSQL container
docker-compose up -d

# Check container status
docker-compose ps

# View database logs
docker-compose logs -f db

# Stop containers
docker-compose down

# Stop and remove all data (destructive)
docker-compose down -v
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key for image analysis |
| `POSTGRES_USER` | PostgreSQL username (default: `inventory_user`) |
| `POSTGRES_PASSWORD` | PostgreSQL password (default: `inventory_pass`) |
| `POSTGRES_DB` | Database name (default: `inventory_db`) |
| `DATABASE_URL` | Full database connection URL |

## API Endpoints

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users` | Register user with device_id and username |
| GET | `/users/{user_id}` | Get user by UUID |
| GET | `/users/device/{device_id}` | Get user by device ID |
| GET | `/users` | List all users (paginated) |
| PATCH | `/users/{user_id}` | Update user profile |
| POST | `/users/{user_id}/profile-picture` | Upload profile picture |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/reports` | Create report with location, severity, and optional image |
| GET | `/reports/{report_id}` | Get report with user info |
| GET | `/reports` | List reports (filter by user_id, status, min_severity) |
| GET | `/users/{user_id}/reports` | Get all reports for a user |
| PATCH | `/reports/{report_id}/status` | Update report status (open/fixed) |

### Image Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze-image` | Analyze image with Gemini |
| POST | `/analyze-image-with-context` | Analyze image with additional context |

### Static Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/uploads/{filename}` | Serve uploaded images |

## Virtual Environment

To activate the venv:
- Windows: `.\venv\Scripts\activate`
- macOS/Linux: `source venv/bin/activate`
