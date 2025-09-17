(function () {
    const drawer = document.getElementById('drawer');
    const btn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeDrawer');
    const backdrop = document.getElementById('drawerBackdrop');

    function open() {
        drawer.classList.add('open');
        backdrop.hidden = false;
        requestAnimationFrame(() => backdrop.classList.add('show'));
        btn?.setAttribute('aria-expanded', 'true');
        drawer.setAttribute('aria-hidden', 'false');
    }
    function close() {
        drawer.classList.remove('open');
        backdrop.classList.remove('show');
        btn?.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
        setTimeout(() => { if (!backdrop.classList.contains('show')) backdrop.hidden = true; }, 250);
    }

    btn && btn.addEventListener('click', () => drawer.classList.contains('open') ? close() : open());
    closeBtn && closeBtn.addEventListener('click', close);
    backdrop && backdrop.addEventListener('click', close);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) close(); });
})();
