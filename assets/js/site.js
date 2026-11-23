'use strict';

(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const setMenu = (open) => {
    if (!menuButton || !mobileNav) return;
    menuButton.setAttribute('aria-expanded', String(open));
    mobileNav.hidden = !open;
    menuButton.querySelector('[data-menu-label]').textContent = open ? 'סגירה' : 'תפריט';
  };
  menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  mobileNav?.addEventListener('click', (event) => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 851px)').addEventListener('change', (event) => { if (event.matches) setMenu(false); });

  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const workCards = [...document.querySelectorAll('[data-work-category]')];
  const filterStatus = document.querySelector('[data-filter-status]');
  filterButtons.forEach((button) => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    let shown = 0;
    workCards.forEach((card) => {
      const visible = filter === 'all' || card.dataset.workCategory.split(' ').includes(filter);
      card.hidden = !visible;
      if (visible) shown++;
    });
    if (filterStatus) filterStatus.textContent = `${shown} פרויקטים מוצגים`;
  }));

  const dialog = document.querySelector('.lightbox');
  if (dialog) {
    const image = dialog.querySelector('[data-lightbox-image]');
    const title = dialog.querySelector('[data-lightbox-title]');
    const original = dialog.querySelector('[data-lightbox-original]');
    const counter = dialog.querySelector('[data-lightbox-counter]');
    const previous = dialog.querySelector('[data-lightbox-previous]');
    const next = dialog.querySelector('[data-lightbox-next]');
    const items = [...document.querySelectorAll('[data-lightbox]')];
    let current = 0;
    let opener;
    const showItem = (index) => {
      current = Math.max(0, Math.min(items.length - 1, index));
      const item = items[current];
      image.src = item.dataset.lightbox;
      image.alt = item.dataset.caption;
      title.textContent = item.dataset.caption;
      original.href = item.dataset.lightbox;
      original.setAttribute('aria-label', `פתיחת התמונה: ${item.dataset.caption}`);
      counter.textContent = `תמונה ${current + 1} מתוך ${items.length}`;
      previous.disabled = current === 0;
      next.disabled = current === items.length - 1;
    };
    items.forEach((button, index) => button.addEventListener('click', () => {
      opener = button;
      showItem(index);
      dialog.showModal();
      document.body.classList.add('modal-open');
    }));
    dialog.querySelector('[data-lightbox-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      opener?.focus();
    });
    previous.addEventListener('click', () => showItem(current - 1));
    next.addEventListener('click', () => showItem(current + 1));
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' && !next.disabled) { event.preventDefault(); showItem(current + 1); }
      if (event.key === 'ArrowRight' && !previous.disabled) { event.preventDefault(); showItem(current - 1); }
    });
  }

  const reader = document.querySelector('[data-catalog-reader]');
  if (reader) {
    const catalogs = window.SITE_DATA?.catalogs || [];
    const params = new URLSearchParams(window.location.search);
    const catalog = catalogs.find((item) => item.id === params.get('id'));
    if (!catalog) {
      document.querySelector('[data-reader-invalid]').hidden = false;
      reader.hidden = true;
      document.title = 'בחירת קטלוג | שרוליק שריקי';
      return;
    }
    reader.hidden = false;
    document.querySelector('[data-reader-invalid]').hidden = true;
    document.title = `${catalog.title} — Cohen’s Line | שרוליק שריקי`;
    document.querySelectorAll('[data-catalog-title]').forEach((element) => { element.textContent = catalog.title; });
    document.querySelectorAll('[data-catalog-pdf]').forEach((element) => { element.href = catalog.pdf; });
    const image = document.querySelector('[data-catalog-page]');
    const pageSelect = document.querySelector('[data-page-select]');
    const statuses = document.querySelectorAll('[data-page-status]');
    const previous = [...document.querySelectorAll('[data-page-previous]')];
    const next = [...document.querySelectorAll('[data-page-next]')];
    const initial = Number(params.get('page'));
    let pageNumber = Number.isInteger(initial) && initial > 0 && initial <= catalog.pages ? initial : 1;
    for (let i = 1; i <= catalog.pages; i++) {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = `עמוד ${i} מתוך ${catalog.pages}`;
      pageSelect.appendChild(option);
    }
    const showPage = (requested, updateUrl = true) => {
      pageNumber = Math.max(1, Math.min(catalog.pages, requested));
      image.src = `assets/catalogs/${catalog.id}/page-${pageNumber}.webp`;
      image.alt = `קטלוג ${catalog.title}, Cohen’s Line — עמוד ${pageNumber} מתוך ${catalog.pages}. גרסת PDF עם טקסט זמינה בקישור ההורדה.`;
      pageSelect.value = String(pageNumber);
      statuses.forEach((status) => { status.textContent = `עמוד ${pageNumber} מתוך ${catalog.pages}`; });
      previous.forEach((button) => { button.disabled = pageNumber === 1; });
      next.forEach((button) => { button.disabled = pageNumber === catalog.pages; });
      if (updateUrl && window.location.protocol !== 'file:') {
        const url = new URL(window.location.href);
        url.searchParams.set('page', String(pageNumber));
        window.history.replaceState(null, '', url);
      }
      if (pageNumber < catalog.pages) {
        const preload = new Image();
        preload.src = `assets/catalogs/${catalog.id}/page-${pageNumber + 1}.webp`;
      }
    };
    previous.forEach((button) => button.addEventListener('click', () => showPage(pageNumber - 1)));
    next.forEach((button) => button.addEventListener('click', () => showPage(pageNumber + 1)));
    pageSelect.addEventListener('change', () => showPage(Number(pageSelect.value)));
    document.addEventListener('keydown', (event) => {
      if (['INPUT','TEXTAREA','SELECT','BUTTON','A'].includes(document.activeElement?.tagName)) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); showPage(pageNumber + 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); showPage(pageNumber - 1); }
    });
    image.addEventListener('error', () => { document.querySelector('[data-page-error]').hidden = false; });
    image.addEventListener('load', () => { document.querySelector('[data-page-error]').hidden = true; });
    showPage(pageNumber, false);
  }
})();
