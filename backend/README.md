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

# 5. Run the server
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. View the interactive docs at `http://localhost:8000/docs`.

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
| POST | `/users` | Register user with device_id |
| GET | `/users/{user_id}` | Get user by UUID |
| GET | `/users/device/{device_id}` | Get user by device ID |
| GET | `/users` | List all users (paginated) |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/reports` | Create report with location + optional image |
| GET | `/reports/{report_id}` | Get report with user info |
| GET | `/reports` | List reports (filter by user_id) |
| GET | `/users/{user_id}/reports` | Get all reports for a user |

### Image Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze-image` | Analyze image with Gemini |
| POST | `/analyze-image-with-context` | Analyze image with additional context |

## Virtual Environment

To activate the venv:
- Windows: `.\venv\Scripts\activate`
- macOS/Linux: `source venv/bin/activate`
