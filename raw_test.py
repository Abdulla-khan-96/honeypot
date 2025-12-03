import socket
import sys

print("--- STARTING RAW SOCKET TEST ---", flush=True)

try:
    # 1. Setup the socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    # Allow us to reuse the port immediately if it was stuck
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    
    # 2. Bind to Port 2222
    sock.bind(('0.0.0.0', 2222))
    sock.listen(1)
    print("[*] LISTENING on Port 2222... (Waiting for you to SSH)", flush=True)
    
    # 3. Wait for connection
    client, addr = sock.accept()
    print(f"[+] CONNECTION RECEIVED from {addr}", flush=True)
    
    # 4. Read the first thing the client sends
    print("[*] Waiting for data...", flush=True)
    data = client.recv(1024)
    
    print(f"\n[!!!] RAW DATA RECEIVED: {data}\n", flush=True)
    
    client.close()
    sock.close()
    print("--- TEST FINISHED ---", flush=True)

except Exception as e:
    print(f"[ERROR] Something went wrong: {e}", flush=True)