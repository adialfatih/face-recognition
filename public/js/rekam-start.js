(function () {
    const nrpEl = document.getElementById('nrp');
    const btn = document.getElementById('btnCheck');
    const status = document.getElementById('status');


    btn.addEventListener('click', async () => {
        const nrp = (nrpEl.value || '').trim();
        if (!nrp) return Swal.fire('NRP kosong', 'Masukkan NRP terlebih dahulu', 'warning');
        try {
            const res = await fetch(`/api/check-nrp?nrp=${encodeURIComponent(nrp)}`);
            const data = await res.json();
            if (!data.exists) {
                return Swal.fire('NRP tidak ditemukan', 'Pastikan NRP ada di Data Karyawan', 'error');
            }
            if (data.hasFace) {
                return Swal.fire('Sudah rekam wajah', `${data.employee.nrp} — ${data.employee.nama} sudah memiliki data wajah.`, 'info');
            }
            // ok → lanjut ke halaman capture
            window.location.href = `/rekam-wajah/capture?nrp=${encodeURIComponent(nrp)}`;
        } catch (e) {
            console.error(e);
            Swal.fire('Gagal', 'Tidak dapat memeriksa NRP', 'error');
        }
    });
})();