// public/js/rekam.js
(async function () {
    const video = document.getElementById('video');
    const canvas = document.getElementById('overlay');
    const ctx = canvas.getContext('2d');
    const nrpInput = document.getElementById('nrp');
    const btnStart = document.getElementById('btnStart');
    const btnSave = document.getElementById('btnSave');
    const status = document.getElementById('status');

    // State
    let samples = [];
    let running = false;
    let ready = false; // models + camera ok

    // === Pasang handler DULU ===
    btnStart.onclick = () => {
        samples = [];
        running = true;
        status.textContent = 'Merekam 10 sampel... hadapkan wajah ke kamera.';
        console.log('[rekam] klik rekam');
    };

    btnSave.onclick = async () => {
        try {
            const nrp = (nrpInput.value || '').trim();
            if (!nrp) return alert('Masukkan NRP terlebih dahulu');
            if (samples.length < 5) return alert('Minimal 5 sampel agar akurat');

            const avg = FaceCommon.average(samples);
            const res = await fetch('/api/faces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nrp, descriptor: avg })
            });
            const json = await res.json();
            if (json.ok) {
                status.textContent = 'Embedding tersimpan.';
                samples = [];
                btnSave.disabled = true;
            } else {
                alert(JSON.stringify(json));
            }
        } catch (err) {
            console.error('[rekam] save error', err);
            alert('Gagal menyimpan embedding.');
        }
    };

    function resizeCanvas() {
        canvas.width = video.clientWidth;
        canvas.height = video.clientHeight;
    }

    // === Inisialisasi (aman dgn try/catch) ===
    try {
        await FaceCommon.loadModels();
        await FaceCommon.startCamera(video);
        setTimeout(() => { resizeCanvas(); }, 50);
        window.addEventListener('resize', resizeCanvas);

        ready = true;
        status.textContent = 'Siap merekam. Masukkan NRP lalu klik Mulai Rekam.';
    } catch (err) {
        console.error('[rekam] init error', err);
        status.textContent = 'Gagal memuat model atau kamera. Cek Network (models) & izin kamera.';
        // tetap lanjut loop agar overlay bisa clear & UI hidup
    }

    async function loop() {
        requestAnimationFrame(loop);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!ready || !running) return;

        try {
            const det = await FaceCommon.describeFace(video);
            if (det && det.detection) {
                const box = det.detection.box;
                FaceCommon.drawFancyBox(ctx, box, true);
                samples.push(det.descriptor);
                status.textContent = `Sampel: ${samples.length}/10`;
                if (samples.length >= 10) {
                    running = false;
                    btnSave.disabled = false;
                    status.textContent = 'Selesai. Klik Simpan Embedding.';
                }
            } else {
                status.textContent = 'Wajah tidak terdeteksi...';
            }
        } catch (e) {
            console.error('[rekam] loop error', e);
        }
    }
    loop();
})();
