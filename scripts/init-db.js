require('dotenv').config();
const { pool } = require('../src/db');


(async () => {
    const ddl = `
CREATE TABLE IF NOT EXISTS karyawan (
nrp VARCHAR(32) PRIMARY KEY,
nama VARCHAR(100) NOT NULL,
jenis_kelamin ENUM('L','P') DEFAULT 'L',
departemen VARCHAR(100),
divisi VARCHAR(100),
jabatan VARCHAR(100),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS face_embeddings (
id BIGINT AUTO_INCREMENT PRIMARY KEY,
nrp VARCHAR(32) NOT NULL,
descriptor JSON NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
INDEX(nrp),
CONSTRAINT fk_face_nrp FOREIGN KEY (nrp) REFERENCES karyawan(nrp) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE IF NOT EXISTS absensi (
id BIGINT AUTO_INCREMENT PRIMARY KEY,
nrp VARCHAR(32) NOT NULL,
tanggal DATE NOT NULL,
waktu DATETIME NOT NULL,
shift VARCHAR(20) DEFAULT '1',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
INDEX(nrp),
CONSTRAINT fk_absensi_nrp FOREIGN KEY (nrp) REFERENCES karyawan(nrp) ON DELETE CASCADE ON UPDATE CASCADE
);`;


    try {
        const conn = await pool.getConnection();
        try {
            for (const stmt of ddl.split(';')) {
                const sql = stmt.trim();
                if (sql) await conn.query(sql);
            }
            console.log('Database tables ensured.');
        } finally {
            conn.release();
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();