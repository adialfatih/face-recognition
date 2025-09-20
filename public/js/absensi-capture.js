(async function () {
    const TYPE = (window.__TYPE__ || '').trim();
    if (!TYPE) { window.location.href = '/absensi'; return; }


    await FaceCommon.loadModels();
    const video = document.getElementById('video');
    const canvas = document.getElementById('overlay');
    const ctx = canvas.getContext('2d');
    const badge = document.getElementById('badge');
    const shiftLabel = document.getElementById('shiftLabel');
    shiftLabel.textContent = TYPE;


    let ready = false; let saved = false;


    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize);


    try {
        await FaceCommon.startCamera(video);
        setTimeout(resize, 50);
        ready = true; badge.textContent = 'Mulai deteksi...';
    } catch (e) { console.error(e); Swal.fire('Kamera gagal', 'Izinkan kamera atau gunakan HTTPS', 'error'); }


    const faces = await (await fetch('/api/faces')).json();
    const db = faces.reduce((m, f) => (m[f.nrp] = f.descriptor, m), {});
    const THRESH = (await (await fetch('/api/config')).json()).threshold;
    const empList = await (await fetch('/api/karyawan')).json().catch(() => []);
    const NAMES = empList.reduce((m, e) => (m[e.nrp] = e.nama, m), {});

    async function loop() {
        requestAnimationFrame(loop);
        if (!ready) return; ctx.clearRect(0, 0, canvas.width, canvas.height);
        try {
            const det = await FaceCommon.describeFace(video);
            if (det && det.detection) {
                // match
                let best = { nrp: null, dist: 999 };
                for (const [nrp, desc] of Object.entries(db)) {
                    const d = FaceCommon.euclidean(det.descriptor, desc);
                    if (d < best.dist) best = { nrp, dist: d };
                }
                const ok = best.dist < THRESH;
                FaceCommon.drawFancyBox(ctx, det.detection.box, ok);
                if (ok && !saved) {
                    badge.className = 'fs-badge ok';
                    const nama = (NAMES[best.nrp] || best.nrp).toUpperCase();
                    badge.textContent = `${nama}`;
                    //badge.textContent = `Menyimpan: ${best.nrp} (jarak ${best.dist.toFixed(3)})`;
                    saved = true;
                    try {
                        const r = await fetch('/api/absen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nrp: best.nrp, shift: TYPE }) });
                        if (r.status === 409) {
                            const j = await r.json();
                            //Swal.fire('Sudah absen', `${best.nrp} sudah absen untuk ${j.shift} (${j.tanggal})`, 'info');
                        } else {
                            const j = await r.json();
                            if (j.ok) Swal.fire('Berhasil', `${best.nrp} absen ${TYPE}`, 'success');
                            else Swal.fire('Gagal', JSON.stringify(j), 'error');
                        }
                    } catch (e) { console.error(e); Swal.fire('Gagal', 'Tidak dapat menyimpan absensi', 'error'); }
                    setTimeout(() => saved = false, 2500);
                } else if (!ok) {
                    badge.className = 'fs-badge err';
                    badge.textContent = 'Wajah tidak dikenali';
                }
            } else {
                badge.className = 'fs-badge';
                badge.textContent = 'Mencari wajah...';
            }
        } catch (e) { console.error(e); }
    }
    loop();
})();
