# Troubleshooting

## "GET https://collabr18x.com/login 404" and CORS errors

You’re hitting **two different problems** at once.

---

### 1. GET https://collabr18x.com/login 404

**Meaning:** The host for **collabr18x.com** is returning 404 for `/login` instead of your app.

**Fix:** The site must be served as an SPA: **every path** (e.g. `/login`, `/register`, `/dashboard`) should serve the same `index.html` so the client router can handle the route.

- **GitHub Pages (custom domain):** The workflow should copy `index.html` to `404.html` so unknown paths fall back to the SPA. Confirm the “Deploy static content to Pages” workflow runs and that the built site includes `404.html`.
- **Render static site:** In the static site service, enable “Rewrite all requests to index.html” or equivalent so all paths serve `index.html`.
- **Other hosts:** Configure the server so all (or all non-file) requests return `index.html`.

Until this is fixed, visiting `https://collabr18x.com/login` directly will keep returning 404.

---

### 2. CORS + "GET /api/auth/user 404" from collabr18x-api.onrender.com

**Meaning:** The browser gets a **404** from `https://collabr18x-api.onrender.com` and **no CORS headers**. So that response is almost certainly **not** from your FastAPI app (our app would send CORS on 404). Something in front of the app (or the wrong service) is returning 404.

**Checks:**

1. **Confirm the API URL**
   - In Render Dashboard, open the **Web Service** that runs the Python/FastAPI app.
   - Copy its URL (e.g. `https://collabr18x-api.onrender.com` or `https://something.onrender.com`).
   - Your frontend **VITE_API_URL** (or equivalent) must be exactly this URL (no trailing slash).

2. **Confirm the app is running**
   - In a browser (or curl), open:  
     **https://collabr18x-api.onrender.com/api/health**  
   - You should see: `{"status":"ok"}` and, from the browser, no CORS error.
   - If you get **404 / 502 / timeout**: the request is not reaching your FastAPI app (wrong URL, service down, or not deployed).

3. **Redeploy the API**
   - In Render: your API service → **Manual Deploy** (or push to the connected branch and wait for deploy).
   - Wait until the deploy is **Live** and try `/api/health` again.

4. **Check Render logs**
   - API service → **Logs**.
   - Visit `https://collabr18x.com`, try to log in, then check if **OPTIONS** and **GET /api/auth/user** (and **POST /api/auth/login**) appear in the logs.
   - If **nothing** appears for those requests, traffic to `/api/*` is not reaching this service (wrong host or routing).

**Summary:** Fix the SPA so `https://collabr18x.com/login` serves `index.html`, and make sure the API URL is correct, the API service is deployed and healthy, and requests to `/api/health` and `/api/auth/*` hit that service and show up in its logs.
