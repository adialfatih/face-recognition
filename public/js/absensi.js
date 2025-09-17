(async function () {
    await FaceCommon.loadModels();
    const video = document.getElementById('video');
    const canvas = document.getElementById('overlay');
    const ctx = canvas.getContext('2d');
    const badge = document.getElementById('badge');
    const info = document.getElementById('info');


    await FaceCommon.startCamera(video);
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);


    const faces = await (await fetch('/api/faces')).json();
    // Map of nrp => descriptor
    const db = faces.reduce((m, f) => (m[f.nrp] = f.descriptor, m), {});
    const THRESH = (await (await fetch('/api/config')).json()).threshold;


    function resizeCanvas() { canvas.width = video.clientWidth; canvas.height = video.clientHeight; }


    async function loop() {
        requestAnimationFrame(loop);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const det = await FaceCommon.describeFace(video);
        if (det && det.detection) {
            const box = det.detection.box;
            // find best match
            let best = { nrp: null, dist: 999 };
            for (const [nrp, desc] of Object.entries(db)) {
                const d = FaceCommon.euclidean(det.descriptor, desc);
                if (d < best.dist) best = { nrp, dist: d };
            }
            const ok = best.dist < THRESH;
            FaceCommon.drawFancyBox(ctx, box, ok);
            if (ok && best.nrp) {
                badge.className = 'badge ok';
                badge.textContent = `✔ Terdeteksi: ${best.nrp} (jarak ${best.dist.toFixed(3)}) — menyimpan...`;
                // debounce: only save once per detect window
                if (!window._saving) {
                    window._saving = true;
                    const kar = await (await fetch(`/api/karyawan/${best.nrp}`)).json();
                    await fetch('/api/absen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nrp: best.nrp, shift: '1' }) });
                    info.textContent = kar ? `${kar.nrp} — ${kar.nama} — ${kar.jabatan}` : best.nrp;
                    setTimeout(() => window._saving = false, 2500);
                }
            } else {
                badge.className = 'badge err';
                badge.textContent = '✖ Wajah tidak dikenali';
            }
        } else {
            badge.className = 'badge';
            badge.textContent = 'Menunggu wajah...';
        }
    }
    loop();
})();