const fs = require('fs');
const path = require('path');
const axios = require('axios');


const FILES = [
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model-shard1',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1'
];


// Source repo (vladmandic/face-api demo weights)
const BASE = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';


(async () => {
    const outDir = path.join(__dirname, '..', 'public', 'models');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    for (const f of FILES) {
        const url = BASE + f;
        const dest = path.join(outDir, f);
        if (fs.existsSync(dest)) { console.log('exists', f); continue; }
        console.log('downloading', f);
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        fs.writeFileSync(dest, res.data);
    }
    console.log('Models downloaded to /public/models');
})();