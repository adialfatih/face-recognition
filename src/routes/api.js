const express = require('express');
const router = express.Router();
const { pool } = require('../db');


const THRESH = parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.55');


router.get('/faces', async (req, res) => {
    // Return all embeddings as { nrp, descriptor }

    const [rows] = await pool.query('SELECT nrp, descriptor FROM face_embeddings');
    res.json(rows.map(r => ({ nrp: r.nrp, descriptor: JSON.parse(r.descriptor) })));
});


router.post('/faces', async (req, res) => {
    const { nrp, descriptor } = req.body; // descriptor: number[] length 128
    if (!nrp || !descriptor || !Array.isArray(descriptor)) return res.status(400).json({ error: 'Invalid payload' });


    // Ensure karyawan exists
    const [k] = await pool.query('SELECT nrp FROM karyawan WHERE nrp=?', [nrp]);
    if (k.length === 0) return res.status(400).json({ error: 'NRP tidak ditemukan di data karyawan' });
    // Block if already recorded (sesuai requirement)
    const [f] = await pool.query('SELECT id FROM face_embeddings WHERE nrp=? LIMIT 1', [nrp]);
    if (f.length > 0) return res.status(409).json({ error: 'Embedding sudah ada untuk NRP ini' });

    // Upsert by replacing previous embedding for simplicity
    await pool.query('DELETE FROM face_embeddings WHERE nrp=?', [nrp]);
    await pool.query('INSERT INTO face_embeddings (nrp, descriptor) VALUES (?, ?)', [nrp, JSON.stringify(descriptor)]);
    res.json({ ok: true });
});


router.post('/absen', async (req, res) => {
    // { nrp, shift }
    const { nrp, shift } = req.body;
    if (!nrp) return res.status(400).json({ error: 'nrp required' });

    const now = new Date();
    const tanggal = now.toISOString().slice(0, 10);
    const waktu = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace('T', ' ');
    const [exist] = await pool.query(
        'SELECT id FROM absensi WHERE nrp=? AND tanggal=? AND shift=? LIMIT 1',
        [nrp, tanggal, shift || '1']
    );
    if (exist.length) return res.status(409).json({ error: 'SUDAH_ABSEN', tanggal: tanggal, shift: shift || '1' });


    await pool.query('INSERT INTO absensi (nrp, tanggal, waktu, shift) VALUES (?, ?, ?, ?)', [nrp, tanggal, waktu, shift || '1']);
    res.json({ ok: true, tanggal, waktu });
});
router.get('/karyawan/:nrp', async (req, res) => {
    const { nrp } = req.params;
    const [rows] = await pool.query('SELECT * FROM karyawan WHERE nrp=?', [nrp]);
    res.json(rows[0] || null);
});


router.get('/karyawan', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM karyawan ORDER BY created_at DESC');
    res.json(rows);
});


router.get('/config', (req, res) => {
    res.json({ threshold: THRESH });
});
router.get('/check-nrp', async (req, res) => {
    const { nrp } = req.query;
    if (!nrp) return res.status(400).json({ error: 'nrp required' });
    const [k] = await pool.query('SELECT nrp, nama, jabatan FROM karyawan WHERE nrp=?', [nrp]);
    if (k.length === 0) return res.json({ exists: false, hasFace: false });
    const [f] = await pool.query('SELECT id FROM face_embeddings WHERE nrp=? LIMIT 1', [nrp]);
    res.json({ exists: true, hasFace: f.length > 0, employee: k[0] });
});



module.exports = router;