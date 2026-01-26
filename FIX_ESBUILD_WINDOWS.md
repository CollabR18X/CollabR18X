# Fix Esbuild EPERM Error on Windows

## Problem
The esbuild binaries (`esbuild.exe`) are missing from `node_modules`, causing:
- `Error: spawn EPERM` when running `npm run dev`
- Frontend server won't start
- Windows is blocking npm from installing/writing files

## Root Cause
Windows Defender or antivirus is blocking:
1. npm from writing to `.npmrc` and cache
2. esbuild from installing its binaries
3. Node.js from spawning processes

## Solution (Choose One)

### Option 1: Add Windows Defender Exclusion (Recommended)

1. **Open Windows Security**:
   - Press `Win + I` (Settings)
   - Go to **Privacy & Security** > **Windows Security**
   - Click **Open Windows Security**

2. **Add Exclusion**:
   - Click **Virus & threat protection**
   - Under **Virus & threat protection settings**, click **Manage settings**
   - Scroll to **Exclusions** and click **Add or remove exclusions**
   - Click **Add an exclusion** > **Folder**
   - Add: `C:\Users\Brighton\app\CollabR18X\CollabR18X`

3. **Also exclude npm cache** (optional but recommended):
   - Add: `C:\Users\Brighton\AppData\Local\npm-cache`

4. **Restart your terminal** and run:
   ```powershell
   Remove-Item -Recurse -Force node_modules
   npm install
   npm run dev
   ```

### Option 2: Run as Administrator

1. **Close all terminals**
2. **Right-click PowerShell** > **Run as Administrator**
3. **Navigate to project**:
   ```powershell
   cd C:\Users\Brighton\app\CollabR18X\CollabR18X
   ```
4. **Reinstall dependencies**:
   ```powershell
   Remove-Item -Recurse -Force node_modules
   npm install
   npm run dev
   ```

### Option 3: Fix npm Permissions

1. **Check npm config**:
   ```powershell
   npm config get offline
   ```
   If it shows `true`, you need to change it (requires admin or fix permissions on `.npmrc`)

2. **Fix .npmrc permissions**:
   - Right-click `C:\Users\Brighton\.npmrc`
   - Properties > Security
   - Ensure your user has Full Control

3. **Then reinstall**:
   ```powershell
   npm cache clean --force
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

## Verify Fix

After applying a solution, check if binaries exist:
```powershell
Test-Path "node_modules\esbuild\bin\esbuild.exe"
Test-Path "node_modules\vite\node_modules\esbuild\bin\esbuild.exe"
```

Both should return `True`.

## Current Status

- ✅ Backend: Running (check `backend_startup.log`)
- ❌ Frontend: Blocked by missing esbuild binaries
- ❌ npm: Blocked by Windows permissions (EPERM)

## After Fix

Once esbuild binaries are installed:
1. Run `npm run dev` - should start Vite successfully
2. Open http://127.0.0.1:5173 in your browser
3. The error handling we added will show any route 404s
