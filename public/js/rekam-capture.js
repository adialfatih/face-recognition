// public/js/rekam-capture.js — drop-in, minimal & bandel
(async function () {
    const nrp = (window.__NRP__ || '').trim();
    if (!nrp) { window.location.href = '/rekam-wajah'; return; }

    const video = document.getElementById('video');
    const canvas = document.getElementById('overlay');
    const ctx = canvas.getContext('2d');

    const btnStart = document.getElementById('btnStart');
    const btnSave = document.getElementById('btnSave');
    const infoEl = document.getElementById('info');


    // === State
    const TARGET = 10;
    const SAMPLE_INTERVAL = 300;
    let lastSampleTs = 0;
    let samples = [];
    let running = false;
    let ready = false;

    // === Full-viewport canvas (tanpa tergantung CSS luar)
    let dpr = window.devicePixelRatio || 1;
    function resize() {
        const w = Math.max(window.innerWidth, document.documentElement.clientWidth || 0);
        const h = Math.max(window.innerHeight, document.documentElement.clientHeight || 0);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        console.log('resize canvas ->', { cw: canvas.width, ch: canvas.height, w, h, dpr });
    }
    window.addEventListener('resize', resize);

    // === Map box (koordinat video) -> canvas saat object-fit: cover
    function toCanvasBox(box) {
        const vw = video.videoWidth, vh = video.videoHeight;
        const cw = canvas.width, ch = canvas.height;
        if (!vw || !vh || !cw || !ch) return null;
        const s = Math.max(cw / vw, ch / vh);  // cover scale
        const dw = vw * s, dh = vh * s;
        const ox = (dw - cw) / 2, oy = (dh - ch) / 2; // crop offset
        return {
            x: box.x * s - ox,
            y: box.y * s - oy,
            width: box.width * s,
            height: box.height * s
        };
    }

    // === Gambar
    function drawProgressArc(box, frac, color) {
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        const r = Math.max(box.width, box.height) / 2 + 18;
        const f = Math.max(0, Math.min(1, frac));
        ctx.save();
        ctx.lineWidth = 6;
        ctx.strokeStyle = color;
        ctx.shadowBlur = 18;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * f));
        ctx.stroke();
        ctx.restore();
    }
    function drawScanLines(box, color) {
        const speed = 140, t = (performance.now() / speed) % 1, gap = 10;
        ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = 0.7;
        for (let y = box.y + (t * gap); y < box.y + box.height; y += gap) {
            ctx.beginPath(); ctx.moveTo(box.x, y); ctx.lineTo(box.x + box.width, y); ctx.stroke();
        }
        ctx.restore();
    }
    function drawBox(box, ok) {
        ctx.save();
        ctx.lineWidth = 4;
        ctx.strokeStyle = ok ? 'rgba(16,163,74,0.9)' : 'rgba(220,38,38,0.9)';
        // sudut membulat
        const r = 16, x = box.x, y = box.y, w = box.width, h = box.height;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
        else {
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
        }
        ctx.stroke();
        // dash anim
        ctx.setLineDash([12, 8]);
        ctx.lineDashOffset = (performance.now() / 20) % 20;
        ctx.strokeStyle = ok ? 'rgba(134,239,172,0.9)' : 'rgba(252,165,165,0.9)';
        ctx.stroke();
        ctx.restore();
    }

    // === Handler
    btnStart.onclick = () => {
        samples = [];
        running = true;
        btnStart.disabled = true;
        btnSave.style.display = 'none';
        btnSave.disabled = true;
        infoEl.textContent = `Merekam ${TARGET} sampel (0/${TARGET})`;
        console.log('klik start');
    };

    btnSave.onclick = async () => {
        try {
            if (samples.length < 5) return Swal.fire('Kurang sampel', 'Ambil minimal 5 sampel', 'warning');
            const avg = (function average(v) { const n = v.length, out = new Float32Array(128); for (const a of v) for (let i = 0; i < 128; i++) out[i] += a[i]; for (let i = 0; i < 128; i++) out[i] /= n; return Array.from(out); })(samples);
            const r = await fetch('/api/faces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nrp, descriptor: avg }) });
            if (r.status === 409) return Swal.fire('Sudah ada', 'NRP ini sudah memiliki embedding', 'info');
            const j = await r.json();
            if (j.ok) Swal.fire('Tersimpan', 'Embedding wajah berhasil disimpan', 'success').then(() => window.location.href = '/karyawan');
            else Swal.fire('Gagal', JSON.stringify(j), 'error');
        } catch (e) { console.log('save error', e); Swal.fire('Gagal', 'Tidak dapat menyimpan', 'error'); }
    };

    // === Init
    try { await FaceCommon.loadModels(); console.log('models loaded'); } catch (e) { console.log('loadModels error', e); }
    try {
        await FaceCommon.startCamera(video);
        setTimeout(() => {
            // paksa video benar-benar full viewport
            video.style.width = '100vw';
            video.style.height = CSS && CSS.supports && CSS.supports('height', '100svh') ? '100svh' : '100vh';
            resize();
            console.log('camera ready', { vw: video.videoWidth, vh: video.videoHeight, cw: canvas.width, ch: canvas.height });
            ready = true;
            infoEl.textContent = 'Siap merekam. Klik "Mulai Rekam".';
        }, 50);
    } catch (e) {
        console.log('startCamera error', e);
        Swal.fire('Kamera gagal', 'Gunakan HTTPS (tunnel) & izinkan kamera', 'error');
    }

    // === Loop
    async function loop() {
        requestAnimationFrame(loop);
        if (!ready) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // tunggu dimensi video siap
        if (!video.videoWidth || !video.videoHeight) return;

        let det = null;
        try {
            det = await FaceCommon.describeFace(video);
        } catch (e) {
            // jangan putus loop
            return;
        }
        if (!det || !det.detection) return;

        const raw = det.detection.box;
        const box = toCanvasBox(raw);
        if (!box) return;
        if (!window.__overlayDrawnOnce) { console.log('overlay draw ok', box); window.__overlayDrawnOnce = true; }

        if (running) {
            drawBox(box, false);
            drawScanLines(box, 'rgba(220,38,38,0.85)');
            drawProgressArc(box, samples.length / TARGET, 'rgba(220,38,38,0.95)');

            const now = performance.now();
            if (now - lastSampleTs >= SAMPLE_INTERVAL) {
                samples.push(det.descriptor);
                lastSampleTs = now;
                infoEl.textContent = `Merekam sampel: ${samples.length}/${TARGET}`;
            }

            if (samples.length >= TARGET) {
                running = false;
                drawBox(box, true);
                drawScanLines(box, 'rgba(16,163,74,0.85)');
                drawProgressArc(box, 1, 'rgba(16,163,74,0.95)');
                infoEl.textContent = `Selesai: ${TARGET}/${TARGET}. Silakan klik "Simpan".`;
                btnSave.style.display = 'inline-block';
                btnSave.disabled = false;
                btnStart.disabled = false;
                console.log('finish', samples.length);
            }
        } else if (samples.length >= TARGET) {
            drawBox(box, true);
            drawScanLines(box, 'rgba(16,163,74,0.85)');
            drawProgressArc(box, 1, 'rgba(16,163,74,0.95)');
        }
    }
    loop();
})();
