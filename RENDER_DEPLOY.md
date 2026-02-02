# Deploy CollabR18X on Render

Use this guide to deploy the **FastAPI backend** (and optionally the **frontend static site**) on [Render](https://render.com).

**If you see "Publish directory dist/public does not exist!"** – the Static Site build didn’t create that folder. Set **Build command** to `npm install && npm run build` and **Publish directory** to `dist/public` in the Render Static Site settings.

---

## 1. Deploy the backend (Blueprint)

1. **Push your repo to GitHub** (including `render.yaml` and the latest `app/` code).

2. **Go to [Render Dashboard](https://dashboard.render.com)** → sign in with GitHub.

3. **New → Blueprint**
   - Connect the GitHub repo that contains `render.yaml`.
   - Render will read `render.yaml` and create:
     - A **PostgreSQL** database (`collabr18x-db`)
     - A **Web Service** (`collabr18x-api`) that runs `python run.py`
   - Confirm and create the resources.

4. **Wait for the first deploy** to finish (Build → Deploy). The API URL will be:
   ```text
   https://collabr18x-api.onrender.com
   ```
   (or whatever name you gave the service; check the service’s “Dashboard” URL.)

5. **Optional: run migrations**
   - In the **Web Service** → **Shell** tab, run:
     ```bash
     alembic upgrade head
     ```
   - Or add a **Pre-Deploy Command** in the Render service settings: `alembic upgrade head` (and ensure `requirements.txt` includes `alembic`).

---

## 2. Point the frontend at the backend (required for registration/login)

**Registration and login will fail with 404 or "endpoint not found" until the frontend is built with your backend URL.**  
Your frontend must call this Render API URL. Set **`VITE_API_URL`** at **build time** to the backend URL (no trailing slash), e.g. `https://collabr18x-api.onrender.com`.

### If the frontend is built on GitHub Actions (e.g. for GitHub Pages)

1. **GitHub repo** → **Settings** → **Secrets and variables** → **Actions**.
2. **Variables** tab → **New repository variable**:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://collabr18x-api.onrender.com`  
     (replace with your actual Render Web Service URL from step 1.)
3. In your workflow (e.g. `.github/workflows/static.yml`), pass it into the build:
   ```yaml
   env:
     VITE_API_URL: ${{ vars.VITE_API_URL }}
   ```
   so the `npm run build` (or `vite build`) step runs with `VITE_API_URL` set.
4. Re-run the workflow (or push a commit) so the site rebuilds with the new API URL.

### If you build the frontend locally or elsewhere

Set `VITE_API_URL` in the environment when you run the build, e.g.:

```bash
VITE_API_URL=https://collabr18x-api.onrender.com npm run build
```

---

## 3. CORS (already set in code)

The backend in `app/main.py` already allows:

- `https://collabr18x.com`
- `https://www.collabr18x.com`
- `https://collabr18x.github.io`
- `https://collabr18x.github.io/CollabR18X`
- `http://localhost:5173` / `http://127.0.0.1:5173`

If you use a different frontend origin (e.g. another Render static site or custom domain), add it to the `allowed_origins` list in `app/main.py` and redeploy.

---

## 4. Manual setup (without Blueprint)

If you prefer not to use `render.yaml`:

1. **New → Web Service**
   - Connect your GitHub repo.
   - **Runtime:** Python.
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `python run.py`
   - **Plan:** Free (or paid).

2. **New → PostgreSQL** (or add from the same project)
   - Create a database (e.g. free plan).
   - In the Web Service → **Environment**, add:
     - **Key:** `DATABASE_URL`  
       **Value:** use “Internal Database URL” from the PostgreSQL service (Render will show it).
     - **Key:** `SESSION_SECRET`  
       **Value:** a long random string (e.g. from `openssl rand -base64 32`).
     - **Key:** `NODE_ENV`  
       **Value:** `production`

3. **Note:** Render gives PostgreSQL URLs as `postgres://...`. The app converts these to `postgresql://` in `app/config.py`, so no extra step is needed.

4. Use the Web Service URL (e.g. `https://collabr18x-api.onrender.com`) as `VITE_API_URL` when building the frontend, as in section 2.

---

## 5. Static site: "Publish directory dist/public does not exist"

If your **Render Static Site** fails with that message, the build didn’t create `dist/public`. Fix it in the dashboard:

1. Open your **Static Site** service on Render.
2. **Settings** → **Build & Deploy**.
3. Set **Build command** to: `npm install && npm run build`
4. Set **Publish directory** to: `dist/public`
5. Save and trigger a **Manual Deploy**.

The `render.yaml` Blueprint now includes an optional static site (`collabr18x-web`) with these values, so new Blueprint deploys will work. For an existing static site, update the settings above.

---

## 6. Free tier notes

- **Free Web Service** spins down after ~15 minutes of no traffic; the first request after that can take 30–60 seconds (cold start).
- **Free PostgreSQL** is sufficient for development/small usage; upgrade if you need more.

---

## Quick checklist

- [ ] Backend deployed on Render (Blueprint or manual).
- [ ] `VITE_API_URL` set to `https://<your-service>.onrender.com` and used in the frontend build.
- [ ] Frontend rebuilt and redeployed (e.g. GitHub Actions) after setting `VITE_API_URL`.
- [ ] CORS in `app/main.py` includes your frontend origin(s).

After that, login and registration from the site should hit the Render API and work.
