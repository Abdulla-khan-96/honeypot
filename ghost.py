import socket
import threading
import paramiko
import sys
import time
import datetime
import google.generativeai as genai

# ==========================================
# 1. CONFIGURATION
# ==========================================
API_KEY = "AIzaSyAE3qpZT9o2iJ1_b8Drbdb0GOm6iSI2GVM"  # <--- PASTE KEY HERE
HOST_KEY_FILE = 'server.key'
PORT = 2222
LOG_FILE = "hacker_logs.txt"

# ==========================================
# 2. LOGGER FUNCTION (The New Part)
# ==========================================
def log_event(message):
    """Writes an event to the log file with a timestamp"""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_msg = f"[{timestamp}] {message}"
    
    # Print to screen
    print(formatted_msg)
    
    # Save to file
    try:
        with open(LOG_FILE, "a") as f:
            f.write(formatted_msg + "\n")
    except Exception as e:
        print(f"[ERROR] Could not write to log file: {e}")

# ==========================================
# 3. AUTO-DETECT AI MODEL
# ==========================================
try:
    log_event("[*] Connecting to Google AI...")
    genai.configure(api_key=API_KEY)
    
    # Auto-Discovery Logic
    available_models = []
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            available_models.append(m.name)
            
    if not available_models:
        log_event("[CRITICAL] No available models found on this API Key!")
        sys.exit(1)

    model_name = next((m for m in available_models if 'flash' in m), None)
    if not model_name:
        model_name = next((m for m in available_models if 'pro' in m), available_models[0])
    
    log_event(f"[+] SUCCESS! Selected Model: {model_name}")
    
    model = genai.GenerativeModel(model_name)
    chat = model.start_chat(history=[
        {"role": "user", "parts": "You are a Ubuntu 22.04 Linux Terminal. I am the user. When I send a command, reply ONLY with the text output. Do not explain anything. Fake a realistic file system. If I type 'pwd', output '/root'."},
        {"role": "model", "parts": "/root"}
    ])
    log_event("[+] AI Brain Connected!")

except Exception as e:
    log_event(f"[CRITICAL] AI Setup Failed: {e}")
    sys.exit(1)

# Load Host Key
try:
    HOST_KEY = paramiko.RSAKey(filename=HOST_KEY_FILE)
except:
    log_event("[CRITICAL] Could not load 'server.key'")
    sys.exit(1)

# ==========================================
# 4. THE SERVER
# ==========================================
class GhostServer(paramiko.ServerInterface):
    def check_auth_password(self, u, p): 
        # LOGGING THE CREDENTIALS
        log_event(f"[!] CREDENTIALS CAPTURED: User='{u}' Password='{p}'")
        return paramiko.AUTH_SUCCESSFUL
    
    def check_channel_request(self, kind, chanid): 
        return paramiko.OPEN_SUCCEEDED
    
    def check_channel_pty_request(self, c, t, w, h, pw, ph, m): 
        return False 
    
    def check_channel_shell_request(self, c): 
        return True

def handle_victim(client, addr):
    log_event(f"[+] Victim Connected from: {addr[0]}")
    try:
        transport = paramiko.Transport(client)
        transport.add_server_key(HOST_KEY)
        transport.local_version = 'SSH-2.0-OpenSSH_8.0' 
        
        server = GhostServer()
        try:
            transport.start_server(server=server)
        except: return

        chan = transport.accept(20)
        if chan is None: return

        chan.send("\r\nWelcome to Ghost Terminal v7 (Forensics Mode)\r\n")
        chan.send("System information as of " + time.strftime("%c") + "\r\n\r\n")
        chan.send("root@ubuntu:~# ")

        while True:
            chan.settimeout(None)
            try:
                data = chan.recv(4096)
                if not data: break
                
                command = data.decode('utf-8', errors='ignore').strip()
                
                if not command:
                    chan.send("\r\nroot@ubuntu:~# ")
                    continue

                # LOGGING THE COMMAND
                log_event(f"[CMD] Victim ({addr[0]}) typed: {command}")
                
                if command == "exit": break

                try:
                    response = chat.send_message(command)
                    output = response.text.replace('\n', '\r\n')
                    chan.send("\r\n" + output + "\r\n")
                except Exception as ai_e:
                    chan.send(f"\r\nbash: error: {ai_e}\r\n")
                
                chan.send("root@ubuntu:~# ")

            except Exception as e:
                break

    except Exception as e:
        log_event(f"[-] Error: {e}")
    finally:
        client.close()

def start_ghost():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(('0.0.0.0', PORT))
    sock.listen(5)
    log_event(f"[*] GHOST TERMINAL ONLINE on Port {PORT}...")
    
    while True:
        c, a = sock.accept()
        threading.Thread(target=handle_victim, args=(c, a)).start()

if __name__ == "__main__":
    start_ghost()