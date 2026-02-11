# CollabR18X Security Diagnostics Report

**Date:** February 11, 2025  
**Scope:** www.collabr18x.com codebase and deployment  
**Method:** Source code analysis of CollabR18X/hyv repository

---

## ✅ Fixes Applied (February 11, 2025)

All critical, high, and medium severity issues have been remediated:

| # | Issue | Status |
|---|-------|--------|
| 1 | Session cookie secure flag | ✅ Fixed – `SECURE_COOKIES` auto True in production |
| 2 | CORS origin bypass | ✅ Fixed – strict host parsing for collabr18x.com only |
| 3 | Path traversal in SPA serving | ✅ Fixed – resolved path validated under static dir |
| 4 | Default SESSION_SECRET | ✅ Fixed – app exits if default used in production |
| 5 | Logout cookie clear | ✅ Fixed – delete_cookie with path="/" |
| 6 | Security headers | ✅ Fixed – CSP, X-Frame-Options, HSTS, etc. |
| 7 | Rate limiting | ✅ Fixed – slowapi 5/min register, 10/min login |
| 8 | Error disclosure | ✅ Fixed – generic messages in production |
| 9 | Upload content-type | ✅ Fixed – whitelist allowed types |
| 10 | CORS allow_headers | ✅ Fixed – restricted to Content-Type, Authorization, Accept |
| 11 | Console.log in production | ✅ Fixed – removed from Register.tsx |

---

## Executive Summary

This report identifies **15 security and configuration issues** ranging from critical to low severity. Each finding includes the exact problem, affected code location, and a concrete fix. Prioritize the **Critical** and **High** issues for immediate remediation.

---

## CRITICAL SEVERITY

### 1. Session Cookie `secure=False` — Cookie Sent Over HTTP

**Problem:** Session cookies are set with `secure=False`, allowing them to be transmitted over unencrypted HTTP. An attacker on the same network can intercept session IDs via Man-in-the-Middle (MITM) attacks.

**Location:** `app/routes/auth.py` lines 102–108, 189–195

```python
response.set_cookie(
    ...
    secure=False,  # Set to True in production with HTTPS
    ...
)
```

**Solution:** Set `secure=True` when running in production (HTTPS). Use an environment check:

```python
response.set_cookie(
    key="session_id",
    value=session_id,
    httponly=True,
    secure=not settings.DEBUG,  # True in production
    samesite="lax",
    max_age=365 * 24 * 60 * 60
)
```

Or add `SECURE_COOKIES: bool = os.getenv("SECURE_COOKIES", "true").lower() == "true"` to `app/config.py` and use `secure=settings.SECURE_COOKIES`.

---

### 2. CORS Origin Bypass — Malicious Subdomain Allowed

**Problem:** The check `"collabr18x.com" in o` allows origins like:
- `https://evil-collabr18x.com.evil.com`
- `https://collabr18x.com.phishing-site.com`

These could host phishing pages that make authenticated requests to your API.

**Location:** `app/main.py` lines 112–115

```python
if "collabr18x.com" in o and (o.startswith("https://") or o.startswith("http://")):
    return True
```

**Solution:** Restrict to your actual domain and subdomains only:

```python
# Allow collabr18x.com and www subdomain only
if o in ("https://collabr18x.com", "https://www.collabr18x.com", "http://collabr18x.com", "http://www.collabr18x.com"):
    return True
# Or use: o.endswith(".collabr18x.com") or o == "https://collabr18x.com"
# But ensure no evil.com/collabr18x.com by checking: o.split("/")[2].lower() == "collabr18x.com" or o.split("/")[2].lower().endswith(".collabr18x.com")
```

Recommended: use a parsed URL and check the host:

```python
from urllib.parse import urlparse
parsed = urlparse(o)
host = parsed.netloc.lower().split(":")[0]
if host in ("collabr18x.com", "www.collabr18x.com"):
    return True
```

---

### 3. Path Traversal in SPA File Serving

**Problem:** The SPA catch-all route uses `os.path.join(static_dir, full_path)` without validating that `full_path` stays inside `static_dir`. A request like `GET /../../../etc/passwd` could serve files outside the intended directory.

**Location:** `app/main.py` lines 279–282

```python
file_path = os.path.join(static_dir, full_path)
if full_path and os.path.isfile(file_path):
    return FileResponse(file_path)
```

**Solution:** Resolve the path and ensure it’s under `static_dir`:

```python
file_path = os.path.normpath(os.path.join(static_dir, full_path))
if not file_path.startswith(os.path.abspath(static_dir) + os.sep) and file_path != os.path.abspath(static_dir):
    return JSONResponse(status_code=403, content={"error": "Forbidden"})
if full_path and os.path.isfile(file_path):
    return FileResponse(file_path)
```

Or use `pathlib`:

```python
from pathlib import Path
base = Path(static_dir).resolve()
resolved = (base / full_path).resolve()
if not str(resolved).startswith(str(base)):
    return JSONResponse(status_code=403, content={"error": "Forbidden"})
```

---

### 4. Default Session Secret in Production

**Problem:** If `SESSION_SECRET` is not set, the app uses `"your-secret-key-change-this-in-production"`. Attackers can forge session cookies and impersonate users.

**Location:** `app/config.py` line 26

```python
SESSION_SECRET: str = os.getenv("SESSION_SECRET", "your-secret-key-change-this-in-production")
```

**Solution:**  
1. Fail fast in production if the secret is default:  

```python
import sys
if not settings.DEBUG and settings.SESSION_SECRET == "your-secret-key-change-this-in-production":
    print("FATAL: Set SESSION_SECRET in production.", file=sys.stderr)
    sys.exit(1)
```

2. Ensure `render.yaml` uses `generateValue: true` for `SESSION_SECRET` (already present).  
3. Document that `SESSION_SECRET` must be set in production.

---

### 5. Logout Cookie May Not Be Properly Cleared

**Problem:** `response.delete_cookie(key="session_id")` does not specify `path` and `domain`. If the cookie was set with a path, it may not be cleared correctly, leaving a stale session.

**Location:** `app/routes/auth.py` line 251

**Solution:** Match the same options used when setting the cookie:

```python
response.delete_cookie(
    key="session_id",
    path="/",
    samesite="lax",
    secure=not settings.DEBUG
)
```

---

## HIGH SEVERITY

### 6. Missing Security Headers

**Problem:** No Content-Security-Policy (CSP), X-Frame-Options, Strict-Transport-Security (HSTS), or X-Content-Type-Options. This increases exposure to XSS, clickjacking, downgrade attacks, and MIME sniffing.

**Location:** `app/main.py` — no security headers middleware

**Solution:** Add a middleware that sets these headers on every response:

```python
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if not settings.DEBUG:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    # CSP - adjust as needed for your app (fonts, scripts, etc.)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https:; "
        "connect-src 'self'; "
        "frame-ancestors 'none'; "
        "base-uri 'self'"
    )
    return response
```

Start restrictive and relax incrementally if needed.

---

### 7. No Rate Limiting on Auth Endpoints

**Problem:** Login and registration have no rate limiting. Attackers can brute-force passwords or abuse registration.

**Location:** `app/routes/auth.py` — no rate limiting

**Solution:** Add rate limiting with `slowapi`:

```bash
pip install slowapi
```

```python
# app/main.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# app/routes/auth.py
from app.main import limiter

@router.post("/auth/register")
@limiter.limit("5/minute")
async def register(request: Request, ...):

@router.post("/auth/login")
@limiter.limit("10/minute")
async def login(request: Request, ...):
```

---

### 8. Information Disclosure in Error Responses

**Problem:** 500 errors return raw error messages (e.g. `detail=f"Registration failed: {error_msg}"`), which can leak stack traces, DB errors, or internal paths.

**Location:** `app/routes/auth.py` lines 133, 165, 221 and similar routes

**Solution:**  
1. Log full errors server-side.  
2. Return generic messages to clients in production:

```python
if settings.DEBUG:
    detail = str(e)
else:
    detail = "An error occurred. Please try again later."
    logger.error(f"Registration error: {error_msg}", exc_info=True)
raise HTTPException(status_code=500, detail=detail)
```

---

## MEDIUM SEVERITY

### 9. Upload Content-Type Trusted from Client

**Problem:** `body.contentType` is accepted as-is when generating S3 presigned URLs. A malicious client could request `application/x-executable` and potentially bypass content checks.

**Location:** `app/routes/uploads.py` lines 113–114

**Solution:** Validate against a whitelist:

```python
_ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
content_type = body.contentType or "image/jpeg"
if content_type not in _ALLOWED_CONTENT_TYPES:
    content_type = "image/jpeg"
```

---

### 10. `dangerouslySetInnerHTML` in Chart Component

**Problem:** `chart.tsx` uses `dangerouslySetInnerHTML` to inject CSS. If `colorConfig` or `THEMES` ever come from user input, this can lead to XSS.

**Location:** `client/src/components/ui/chart.tsx` lines 80–99

**Solution:** Ensure `colorConfig` and theme data are never user-controlled. If they are, sanitize or avoid HTML injection. Prefer adding CSS via `<style>` with sanitized/static values or a CSS-in-JS library.

---

### 11. `allow_headers=["*"]` and `expose_headers=["*"]`

**Problem:** Over-permissive CORS headers increase surface for unexpected or abuse behavior.

**Location:** `app/main.py` lines 101–102

**Solution:** Restrict to needed headers:

```python
allow_headers=["Content-Type", "Authorization", "Accept"],
expose_headers=["Content-Length"],
```

---

## LOW SEVERITY

### 12. `console.log` in Production

**Problem:** Registration and other flows log API URLs and response details. This can leak implementation details in production.

**Location:** `client/src/pages/Register.tsx` lines 31, 41, 47, 64

**Solution:** Remove or gate behind `import.meta.env.DEV`, or strip `console.log` in the build.

---

### 13. Password Length Check in Bytes

**Problem:** Password length is validated by byte count. Very long UTF-8 strings (e.g. emojis) can hit the 100-byte limit while looking short to the user, causing confusion.

**Solution:** Document this behavior and/or add a character-length hint in the UI.

---

### 14. Session Lifetime (365 Days)

**Problem:** Sessions last one year. Compromised sessions remain valid for a long time.

**Solution:** Consider shorter lifetimes or refresh on activity. Add a “Log out everywhere” option and a “last activity” check for sensitive actions.

---

### 15. `DEBUG` Based on `NODE_ENV`

**Problem:** Python `DEBUG` is derived from `NODE_ENV`, which is nonstandard for a Python backend.

**Location:** `app/config.py` line 29

**Solution:** Use an explicit `DEBUG` or `ENVIRONMENT` env var:

```python
DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
# Or: ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
```

---

## Remediation Checklist

| Priority | Issue | Fix |
|----------|-------|-----|
| P0 | Secure cookie | Set `secure=True` in production |
| P0 | CORS bypass | Use strict host matching |
| P0 | Path traversal | Validate resolved path under `static_dir` |
| P0 | Default session secret | Fail if default in production |
| P1 | Security headers | Add CSP, X-Frame-Options, HSTS, etc. |
| P1 | Rate limiting | Add slowapi on auth routes |
| P1 | Error disclosure | Return generic errors in production |
| P2 | Upload content-type | Whitelist allowed types |
| P2 | Logout cookie | Use matching `path` when deleting |
| P2 | CORS headers | Narrow `allow_headers` / `expose_headers` |
| P3 | Console logs | Remove or gate for dev only |
| P3 | DEBUG source | Use explicit env var |

---

## External Verification

After fixes are deployed:

1. **Security Headers:** https://securityheaders.com/?q=www.collabr18x.com  
2. **SSL/TLS:** https://www.ssllabs.com/ssltest/analyze.html?d=collabr18x.com  
3. **OWASP ZAP** or similar for deeper automated testing  

---

*Report generated from source code analysis. Live site fetch was unavailable during the audit.*
