(function () {
    const sel = document.getElementById('type');
    const btn = document.getElementById('btnGo');
    btn.addEventListener('click', () => {
        const t = sel.value;
        if (!t) return Swal.fire('Pilih shift', 'Silakan pilih tipe/shift', 'warning');
        window.location.href = `/absensi/capture?type=${encodeURIComponent(t)}`;
    });
})();