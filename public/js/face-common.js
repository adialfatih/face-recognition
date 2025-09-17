// Utility shared by pages: load models, start camera, draw animated boxes, and compare embeddings
const FaceCommon = (() => {
    const state = {
        modelsLoaded: false,
        threshold: 0.55
    };


    async function loadConfig() {
        try {
            const res = await fetch('/api/config');
            const json = await res.json();
            state.threshold = json.threshold || state.threshold;
        } catch { }
    }


    async function loadModels() {
        if (state.modelsLoaded) return;
        await loadConfig();
        const url = '/public/models';
        await faceapi.nets.tinyFaceDetector.loadFromUri(url);
        await faceapi.nets.faceLandmark68Net.loadFromUri(url);
        await faceapi.nets.faceRecognitionNet.loadFromUri(url);
        state.modelsLoaded = true;
    }


    async function startCamera(videoEl) {
        async function attachWith(cons) {
            const stream = await navigator.mediaDevices.getUserMedia(cons);
            videoEl.srcObject = stream;
            videoEl.setAttribute('playsinline', 'true');
            videoEl.muted = true;
            await new Promise((resolve) => {
                let done = false;
                const finish = () => { if (!done) { done = true; resolve(); } };
                const onLoadedMeta = () => { videoEl.removeEventListener('loadedmetadata', onLoadedMeta); finish(); };
                const onCanPlay = () => { videoEl.removeEventListener('canplay', onCanPlay); finish(); };
                videoEl.addEventListener('loadedmetadata', onLoadedMeta, { once: true });
                videoEl.addEventListener('canplay', onCanPlay, { once: true });
                if (videoEl.readyState >= 2) finish();
            });
            try { await videoEl.play(); } catch (e) { console.warn('[camera] play() warn:', e); }
        }

        // 1) coba dengan constraints “ideal”
        try {
            await attachWith({ audio: false, video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
            return;
        } catch (e1) {
            console.warn('[camera] GUM#1 fail', e1);
        }

        // 2) enumerate devices, pakai kamera pertama
        try {
            const devs = await navigator.mediaDevices.enumerateDevices();
            const cams = devs.filter(d => d.kind === 'videoinput');
            if (cams.length) {
                await attachWith({ audio: false, video: { deviceId: { exact: cams[0].deviceId } } });
                return;
            }
        } catch (e2) {
            console.warn('[camera] enumerate fail', e2);
        }

        // 3) fallback paling sederhana
        await attachWith({ audio: false, video: true });
    }


    function drawFancyBox(ctx, box, ok = true) {
        const { x, y, width, height } = box;
        const t = performance.now() / 300; // animate
        const glow = Math.floor((Math.sin(t) + 1) * 60) + 40; // 40..160
        ctx.save();
        ctx.lineWidth = 4;
        ctx.strokeStyle = ok ? `rgba(22,163,74,0.85)` : `rgba(220,38,38,0.85)`;
        ctx.shadowBlur = glow; ctx.shadowColor = ctx.strokeStyle;
        const r = 16;
        roundRect(ctx, x, y, width, height, r);
        ctx.stroke();
        // animated dashed arc
        ctx.setLineDash([12, 8]);
        ctx.lineDashOffset = (performance.now() / 20) % 20;
        ctx.strokeStyle = ok ? `rgba(134,239,172,0.9)` : `rgba(252,165,165,0.9)`;
        ctx.stroke();
        ctx.restore();
    }


    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
    // Compute 128D descriptor for single face using TinyFaceDetector
    async function describeFace(videoEl) {
        const det = await faceapi
            .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor();
        return det; // {detection, descriptor}
    }


    function euclidean(a, b) {
        let s = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; } return Math.sqrt(s);
    }


    function average(vectors) {
        const n = vectors.length; const out = new Float32Array(128);
        for (const v of vectors) for (let i = 0; i < 128; i++) out[i] += v[i];
        for (let i = 0; i < 128; i++) out[i] /= n; return Array.from(out);
    }


    return { state, loadModels, startCamera, drawFancyBox, describeFace, euclidean, average };
})();