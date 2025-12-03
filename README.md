# Ghost Terminal (Honeypot)

Educational SSH honeypot for capturing login attempts and studying attacker behavior.

## What this repository contains

- `ghost.py` - A basic SSH server (honeypot) using `paramiko`. Accepts any credentials and logs them.
- `gen_key.py` - Helper to generate a `server.key` RSA host key.
- `.gitignore` - excludes `server.key` and `.venv`.

## Important: API keys and privacy

This project may optionally integrate with Google Generative AI (Gemini) to provide more realistic terminal responses. **Do not hardcode API keys** in source files.

- To enable AI mode, set an environment variable named `GENAI_API_KEY` (or `GOOGLE_API_KEY`) in your environment. The code reads the key from the environment and will fall back to a safe echo-only mode if none is provided.

Example (PowerShell):

```powershell
$env:GENAI_API_KEY = "your_api_key_here"
python ghost.py
```

## Quick start

1. Create a Python virtual environment and install dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
# If no requirements file, at minimum: pip install paramiko
```

2. Generate an RSA host key (if you don't have one):

```powershell
python gen_key.py
```

3. Run the honeypot:

```powershell
python ghost.py
```

4. Connect to it (from another terminal):

```powershell
ssh root@localhost -p 2222
```

## Security and ethics

- This tool is for educational and research purposes only. Do not deploy it in production or on networks where you do not have authorization.
- Never commit private keys or API keys to source control. The `.gitignore` prevents `server.key` from being committed.

## License

Educational use only. Modify and use at your own risk.
