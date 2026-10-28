# AlertIQ frontend

React and Vite frontend for the AlertIQ scam-analysis application.

## Run locally

Start the FastAPI backend from `backend` in one terminal:

```powershell
$env:OPENAI_API_KEY = "your-openai-api-key"
$env:OPENAI_MODEL = "gpt-4o-mini"
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API key is optional: without it, analysis uses the local rule-based scorer.
Do not commit or share the key.

Run the backend unit tests from the `backend` directory with:

```powershell
.\venv\Scripts\python.exe -m unittest discover -s tests -v
```

Start the frontend from `frontend/frontend` in another terminal:

```powershell
npm install
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). Vite proxies `/api` and
`/health` requests to `http://127.0.0.1:8000` while developing. For a frontend
served separately from the API, set `VITE_API_URL` to the backend base URL at
build time.

## Deploy to GitHub Pages

The repository includes a GitHub Actions workflow that builds and deploys the
frontend to `https://anshuman642.github.io/AlertIQ/` when changes are pushed to
`main`. In the repository settings, set **Pages → Build and deployment →
Source** to **GitHub Actions**.

GitHub Pages hosts only the static frontend; it does not run the FastAPI
backend. To use login, analysis, and history on the deployed site, deploy the
backend separately, then add a repository Actions variable named `VITE_API_URL`
with its base URL (for example, `https://api.example.com`). The backend is
configured to accept requests from the GitHub Pages site.

## Available flows

- Register and login against the backend API.
- Submit text and/or a URL for analysis.
- Upload a supported image with its visible text description for analysis.
- View user-specific analysis history and dashboard totals.

The backend uses its built-in rule-based risk scorer when `OPENAI_API_KEY` is
not set. To enable OpenAI analysis, set `OPENAI_API_KEY` in the backend
environment; optionally set `OPENAI_MODEL` (defaults to `gpt-4o-mini`) before
starting FastAPI. When enabled, submitted message text, URL, sender email, and
source are sent to OpenAI for analysis. Configure this only if that data
transfer is appropriate for your users. OpenAI request failures are returned
as errors; they do not silently fall back to rule-based results.
