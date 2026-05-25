import requests, base64, time, subprocess

shop_id = '57e122bb-fc66-4572-9793-8f9f5b299216'

# Lancer la session sans attendre
try:
    requests.post('http://localhost:3000/session/start', json={'shop_id': shop_id}, timeout=3)
except Exception:
    pass

# Attendre le QR (max 45s)
for i in range(15):
    time.sleep(3)
    try:
        r = requests.post('http://localhost:3000/session/start', json={'shop_id': shop_id}, timeout=5)
        data = r.json()
        status = data.get('status', '')
        print(f'{(i+1)*3}s — status: {status}')
        if data.get('qr'):
            with open('qr_code.png', 'wb') as f:
                f.write(base64.b64decode(data['qr'].split(',')[1]))
            print('QR sauvegarde dans qr_code.png — scanne maintenant !')
            subprocess.Popen(['explorer', 'qr_code.png'])
            break
        if status == 'already_connected':
            print('Deja connecte !')
            break
    except Exception as e:
        print(f'{(i+1)*3}s — attente...')
else:
    print('Timeout — verife que le bridge tourne (node server.js)')
