(function () {
    // masukDs7.addEventListener('click', () => {
    //     const t = '7';
    //     if (!t) return Swal.fire('Pilih shift', 'Silakan pilih tipe/shift', 'warning');
    //     window.location.href = `/absensi/capture?type=${encodeURIComponent(t)}`;
    // });
    const masukDs7 = document.getElementById('inGS7');
    const outDs7 = document.getElementById('outGS7');
    const masukDs8 = document.getElementById('inGS8');
    const outDs8 = document.getElementById('outGS8');
    const insif6 = document.getElementById('in6');
    const outsif6 = document.getElementById('out14');
    const insif14 = document.getElementById('in14');
    const outsif14 = document.getElementById('out22');
    const insif22 = document.getElementById('in22');
    const outsif22 = document.getElementById('out6');
    const ijinkeluar = document.getElementById('ijinkeluar');
    const ijinmasuk = document.getElementById('ijinmasuk');
    const inscr = document.getElementById('inscr');
    const outscr = document.getElementById('outscr');
    const indrv = document.getElementById('indrv');
    const outdrv = document.getElementById('outdrv');
    ijinkeluar.addEventListener('click', () => {
        const t = 'ijinkeluar';
        window.location.href = `/absensi/capture?type=${encodeURIComponent(t)}`;
    });
    ijinmasuk.addEventListener('click', () => {
        const t = 'ijinmasuk';
        window.location.href = `/absensi/capture?type=${encodeURIComponent(t)}`;
    });
    inscr.addEventListener('click', () => {
        const t = 'inscr';
        window.location.href = `/absensi/capture?type=${encodeURIComponent(t)}`;
    });
    outscr.addEventListener('click', () => {
        const t = 'outscr';
        window.location.href = `/absensi/capture?type=${encodeURIComponent(t)}`;
    });
    indrv.addEventListener('click', () => {
        const t = 'indrv';
        window.location.href = `/absensi/capture?type=${encodeURIComponent(t)}`;
    });
    outdrv.addEventListener('click', () => {
        const t = 'outdrv';
        window.location.href = `/absensi/capture?type=${encodeURIComponent(t)}`;
    });
    masukDs7.addEventListener('click', () => {
        const t = 'in-7';
        window.location.href = `/absensi/capture?type=${encodeURIComponent(t)}`;
    });
    outDs7.addEventListener('click', () => {
        const t = 'out-15';
        window.location.href = `/absensi/capture?type=${encodeURIComponent(t)}`;
    });
    masukDs8.addEventListener('click', () => {
        const t = 'in-8';
        window.location.href = `/absensi/capture?type=${encodeURIComponent(t)}`;
    });
    outDs8.addEventListener('click', () => {
        const t = 'out-16';
        window.location.href = `/absensi/capture?type=${encodeURIComponent(t)}`;
    });
    insif6.addEventListener('click', () => {
        const t = 'in-sif-6';
        window.location.href = `/absensi/capture?type=${encodeURIComponent(t)}`;
    });
    outsif6.addEventListener('click', () => {
        const t = 'out-sif-14';
        window.location.href = `/absensi/capture?type=${encodeURIComponent(t)}`;
    });
    insif14.addEventListener('click', () => {
        const t = 'in-sif-14';
        window.location.href = `/absensi/capture?type=${encodeURIComponent(t)}`;
    });
    outsif14.addEventListener('click', () => {
        const t = 'out-sif-22';
        window.location.href = `/absensi/capture?type=${encodeURIComponent(t)}`;
    });
    insif22.addEventListener('click', () => {
        const t = 'in-sif-22';
        window.location.href = `/absensi/capture?type=${encodeURIComponent(t)}`;
    });
    outsif22.addEventListener('click', () => {
        const t = 'out-sif-6';
        window.location.href = `/absensi/capture?type=${encodeURIComponent(t)}`;
    });
})();