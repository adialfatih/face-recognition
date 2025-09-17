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
                const kar = await (await fetch(`/api/karyawan/${best.nrp}`)).json();
                const title = kar ? `${kar.nrp} — ${kar.nama}` : best.nrp;
                const jab = kar ? (kar.jabatan || '') : '';
                badge.className = 'badge ok';
                badge.textContent = `✔ ${title}`;
                info.textContent = `${jab ? `Jabatan: ${jab} — ` : ''}Jarak: ${best.dist.toFixed(3)}`;
            } else {
                badge.className = 'badge err';
                badge.textContent = '✖ Tidak dikenali';
                info.textContent = '';
            }
        } else {
            badge.className = 'badge';
            badge.textContent = 'Menunggu wajah...';
            info.textContent = '';
        }
    }
    loop();
})();