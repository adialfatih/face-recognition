Baseline yang aku kunci (ringkas)

Stack: Node.js + Express + EJS, mysql2 (pool), dotenv, TensorFlow.js (browser), SweetAlert2.

Models: public/models/* (face-api weights).

Views: dashboard, karyawan, rekam-start.ejs, rekam-capture.ejs (fullscreen), absensi-start.ejs, absensi-capture.ejs (fullscreen), testing.ejs.

Routes UI: 2-step flow

Rekam: /rekam-wajah → /rekam-wajah/capture?nrp=...

Absensi: /absensi → /absensi/capture?type=...

API:

GET /api/check-nrp (cek karyawan & status wajah)

POST /api/faces (simpan embedding; 409 jika sudah ada)

POST /api/absen (simpan presensi; 409 jika sudah absen pada (nrp, tanggal, shift))

Public JS: face-common.js, rekam-start.js, rekam-capture.js, absensi-start.js, absensi-capture.js, ui.js (drawer).

CSS: style dasar + fullscreen camera (fit ujung rambut–leher).

```bash 
PORT=3001
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=adicanting
DB_NAME=presensi_db
# FACE MATCH THRESHOLD (0.5-0.6 recommended)
FACE_MATCH_THRESHOLD=0.55
```

