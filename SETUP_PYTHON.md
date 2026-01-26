# Python Setup Instructions

Python is required to run the CollabR18X backend. Follow these steps to install Python:

## Windows Installation

### Option 1: Official Python Installer (Recommended)

1. **Download Python 3.12**:
   - Visit: https://www.python.org/downloads/
   - Download the latest Python 3.12.x installer for Windows

2. **Run the Installer**:
   - ✅ **IMPORTANT**: Check "Add Python to PATH" during installation
   - Click "Install Now"
   - Wait for installation to complete

3. **Verify Installation**:
   ```powershell
   python --version
   # Should show: Python 3.12.x
   
   pip --version
   # Should show: pip version
   ```

### Option 2: Microsoft Store

1. Open Microsoft Store
2. Search for "Python 3.12"
3. Click "Install"
4. Note: May require additional PATH configuration

## After Installation

1. **Close and reopen your terminal** (to refresh PATH)

2. **Verify Python is accessible**:
   ```powershell
   python --version
   ```

3. **Install Python dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```

4. **Run the development server**:
   ```powershell
   python run.py
   ```

## Troubleshooting

### "Python was not found"

- **Solution**: Python is not in your PATH
  - Reinstall Python and check "Add Python to PATH"
  - Or manually add Python to PATH:
    1. Find Python installation (usually `C:\Users\YourName\AppData\Local\Programs\Python\Python312\`)
    2. Add to System PATH environment variable

### "pip is not recognized"

- **Solution**: pip should be installed with Python
  - Try: `python -m pip install -r requirements.txt`

### Still having issues?

- Check if Python is installed: `Get-Command python -ErrorAction SilentlyContinue`
- Try using full path: `C:\Python312\python.exe run.py`
- Or use Python launcher: `py -3.12 run.py` (if available)
