const express = require('express');
const router = express.Router();
const { pool } = require('../db');


router.get('/', (req, res) => {
    res.render('dashboard');
});


router.get('/karyawan', async (req, res) => {
    const [rows] = await pool.query('SELECT nrp, nama, jenis_kelamin, departemen, divisi, jabatan FROM karyawan ORDER BY created_at DESC LIMIT 200');
    res.render('karyawan', { rows });
});


router.post('/karyawan', async (req, res) => {
    const { nrp, nama, jenis_kelamin, departemen, divisi, jabatan } = req.body;
    if (!nrp || !nama) return res.status(400).send('NRP & Nama wajib');
    await pool.query('INSERT INTO karyawan (nrp, nama, jenis_kelamin, departemen, divisi, jabatan) VALUES (?, ?, ?, ?, ?, ?)', [nrp, nama, jenis_kelamin || 'L', departemen || '', divisi || '', jabatan || '']);
    res.redirect('/karyawan');
});


// router.get('/rekam-wajah', (req, res) => {
//     res.render('rekam');
// });
// Rekam Wajah (step awal, tanpa kamera)
router.get('/rekam-wajah', (req, res) => res.render('rekam-start'));
// Rekam Wajah (kamera fullscreen)
router.get('/rekam-wajah/capture', (req, res) => res.render('rekam-capture', { nrp: req.query.nrp || '' }));

// Absensi (pilih tipe/shift dulu)
router.get('/absensi', (req, res) => res.render('absensi-start'));
// Absensi (kamera fullscreen + auto save)
router.get('/absensi/capture', (req, res) => res.render('absensi-capture', { type: req.query.type || '' }));




router.get('/testing', (req, res) => {
    res.render('testing');
});


module.exports = router;