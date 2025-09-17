(async function () {
    const nrp = (window.__NRP__ || '').trim();
    if (!nrp) { window.location.href = '/rekam-wajah'; return; }


    await FaceCommon.loadModels();
    const video = document.getElementById('video');
    const canvas = document.getElementById('overlay');
    const ctx = canvas.getContext('2d');
    const btnStart = document.getElementById('btnStart');
    const btnSave = document.getElementById('btnSave');
    const info = document.getElementById('info');


    let samples = []; let running = false; let ready = false;


    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize);


    try {
        await FaceCommon.startCamera(video);
        setTimeout(resize, 50);
        ready = true;
    } catch (e) { console.error(e); Swal.fire('Kamera gagal', 'Izinkan kamera atau gunakan HTTPS', 'error'); }


    btnStart.onclick = () => { samples = []; running = true; info.textContent = 'Merekam 10 sampel...'; };


    btnSave.onclick = async () => {
        try {
            if (samples.length < 5) return Swal.fire('Kurang sampel', 'Ambil minimal 5 sampel', 'warning');
            const avg = FaceCommon.average(samples);
            const r = await fetch('/api/faces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nrp, descriptor: avg }) });
            if (r.status === 409) { return Swal.fire('Sudah ada', 'NRP ini sudah memiliki embedding', 'info'); }
            const j = await r.json();
            if (j.ok) { Swal.fire('Tersimpan', 'Embedding wajah berhasil disimpan', 'success').then(() => window.location.href = '/karyawan'); }
            else { Swal.fire('Gagal', JSON.stringify(j), 'error'); }
        } catch (e) { console.error(e); Swal.fire('Gagal', 'Tidak dapat menyimpan', 'error'); }
    };
    async function loop() {
        requestAnimationFrame(loop);
        if (!ready) return; ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!running) return;
        try {
            const det = await FaceCommon.describeFace(video);
            if (det && det.detection) {
                FaceCommon.drawFancyBox(ctx, det.detection.box, true);
                samples.push(det.descriptor);
                info.textContent = `Sampel: ${samples.length}/10`;
                if (samples.length >= 10) { running = false; btnSave.disabled = false; info.textContent = 'Selesai. Klik Simpan.'; }
            } else {
                info.textContent = 'Wajah tidak terdeteksi...';
            }
        } catch (e) { console.error(e); }
    }
    loop();
})();