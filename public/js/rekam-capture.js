// public/js/rekam-capture.js
function drawProgressArc(ctx, box, fraction, color) {
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2, r = Math.max(box.width, box.height) / 2 + 20;
    const f = Math.max(0, Math.min(1, fraction));
    ctx.save(); ctx.lineWidth = 6; ctx.strokeStyle = color; ctx.shadowBlur = 18; ctx.shadowColor = color;
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * f)); ctx.stroke(); ctx.restore();
}
function drawScanLines(ctx, box, color) {
    const t = (performance.now() / 140) % 1, gap = 10;
    ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = .7;
    for (let y = box.y + (t * gap); y < box.y + box.height; y += gap) { ctx.beginPath(); ctx.moveTo(box.x, y); ctx.lineTo(box.x + box.width, y); ctx.stroke(); }
    ctx.restore();
}

(async function () {
    const nrp = (window.__NRP__ || '').trim();
    if (!nrp) { window.location.href = '/rekam-wajah'; return; }

    const video = document.getElementById('video');
    const canvas = document.getElementById('overlay');
    const ctx = canvas.getContext('2d');

    const btnStart = document.getElementById('btnStart');
    const btnSave = document.getElementById('btnSave');
    const infoEl = document.getElementById('info');
    const recDot = document.getElementById('recDot');

    // --- State ---
    let samples = [];
    let running = false;
    let ready = false;
    const TARGET = 10;
    const SAMPLE_INTERVAL = 250; // ms (jangan terlalu cepat biar progres terasa)
    let lastSampleTs = 0;

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize);

    // --- Pasang handler DULU supaya klik tetap hidup walau init async error ---
    btnStart.onclick = () => {
        samples = [];
        running = true;
        btnStart.disabled = true;
        btnSave.style.display = 'none';
        btnSave.disabled = true;
        recDot.classList.remove('ok');
        recDot.classList.add('pulse');
        infoEl.textContent = `Merekam ${TARGET} sampel (0/${TARGET})`;
        console.log('[rekam] start');
    };

    btnSave.onclick = async () => {
        try {
            if (samples.length < 5) return Swal.fire('Kurang sampel', 'Ambil minimal 5 sampel', 'warning');
            const avg = FaceCommon.average(samples);
            const r = await fetch('/api/faces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nrp, descriptor: avg })
            });
            if (r.status === 409) { return Swal.fire('Sudah ada', 'NRP ini sudah memiliki embedding', 'info'); }
            const j = await r.json();
            if (j.ok) Swal.fire('Tersimpan', 'Embedding wajah berhasil disimpan', 'success').then(() => window.location.href = '/karyawan');
            else Swal.fire('Gagal', JSON.stringify(j), 'error');
        } catch (e) { console.error(e); Swal.fire('Gagal', 'Tidak dapat menyimpan', 'error'); }
    };

    // --- Init models + camera (robust) ---
    try {
        await FaceCommon.loadModels();
    } catch (e) {
        console.error('[rekam] loadModels error', e);
        Swal.fire('Model gagal dimuat', 'Periksa /public/models', 'error');
    }
    try {
        await FaceCommon.startCamera(video);
        setTimeout(resize, 50);
        ready = true;
        infoEl.textContent = 'Siap merekam. Klik "Mulai Rekam".';
    } catch (e) {
        console.error('[rekam] startCamera error', e);
        Swal.fire('Kamera gagal', 'Izinkan kamera atau gunakan HTTPS / Cloudflare Tunnel', 'error');
    }

    // --- Gambar ring progres mengitari wajah ---
    function drawProgressArc(ctx, box, fraction, color) {
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        const r = Math.max(box.width, box.height) / 2 + 20;
        const clamped = Math.max(0, Math.min(1, fraction));
        ctx.save();
        ctx.lineWidth = 6;
        ctx.strokeStyle = color;
        ctx.shadowBlur = 18;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * clamped));
        ctx.stroke();
        ctx.restore();
    }

    // --- Garis scanning (biar “keren” merekam) ---
    function drawScanLines(ctx, box, color) {
        const speed = 140; // ms per shift
        const t = (performance.now() / speed) % 1;
        const gap = 10;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.7;
        for (let y = box.y + (t * gap); y < box.y + box.height; y += gap) {
            ctx.beginPath();
            ctx.moveTo(box.x, y);
            ctx.lineTo(box.x + box.width, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    async function detectOnce() {
        // Bungkus deteksi biar error tidak memutus loop
        try {
            return await FaceCommon
                .describeFace(video); // { detection, descriptor } | null
        } catch (e) {
            console.warn('[rekam] detect error', e);
            return null;
        }
    }

    async function loop() {
        requestAnimationFrame(loop);
        if (!ready) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const det = await detectOnce();
        if (!det || !det.detection) {
            if (running) infoEl.textContent = `Arahkan wajah ke kamera… (${samples.length}/${TARGET})`;
            return;
        }

        const box = det.detection.box;

        if (running) {
            // Merah saat merekam
            FaceCommon.drawFancyBox(ctx, box, false);
            drawScanLines(ctx, box, 'rgba(220, 38, 38, 0.85)');
            drawProgressArc(ctx, box, samples.length / TARGET, 'rgba(220, 38, 38, 0.95)');

            // Throttle sampling biar progres terasa (dan tidak terlalu sering)
            const now = performance.now();
            if (now - lastSampleTs >= SAMPLE_INTERVAL) {
                samples.push(det.descriptor);
                lastSampleTs = now;
                infoEl.textContent = `Merekam sampel: ${samples.length}/${TARGET}`;
            }

            // Selesai
            if (samples.length >= TARGET) {
                running = false;
                FaceCommon.drawFancyBox(ctx, box, true);
                drawScanLines(ctx, box, 'rgba(16, 163, 74, 0.85)');
                drawProgressArc(ctx, box, 1, 'rgba(16, 163, 74, 0.95)');
                recDot.classList.remove('pulse');
                recDot.classList.add('ok');
                infoEl.textContent = `Selesai: ${TARGET}/${TARGET}. Silakan klik "Simpan".`;
                btnSave.style.display = 'inline-block';
                btnSave.disabled = false;
                btnStart.disabled = false; // kalau mau rekam ulang
            }
        } else if (samples.length >= TARGET) {
            // Setelah selesai: tampilkan hijau jika wajah masih terlihat
            FaceCommon.drawFancyBox(ctx, box, true);
            drawScanLines(ctx, box, 'rgba(16, 163, 74, 0.85)');
            drawProgressArc(ctx, box, 1, 'rgba(16, 163, 74, 0.95)');
        }
    }
    loop();
})();
