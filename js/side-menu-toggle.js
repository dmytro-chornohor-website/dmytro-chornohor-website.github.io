    (function () {
      const menuBtn = document.getElementById('navMenuBtn');
      const closeBtn = document.getElementById('sideMenuClose');
      const overlay = document.getElementById('menuOverlay');
      const sideMenu = document.getElementById('sideMenu');

      function openMenu() {
        overlay.classList.add('active');
        sideMenu.classList.add('active');
        // overflow:hidden ставим и на <html>, и на <body> — в некоторых
        // браузерах именно html является корневым скролл-контейнером,
        // одного body недостаточно, чтобы реально заблокировать скролл.
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        // Кастомный плавный скролл сайта (js/smooth-scroll.js) перехватывает
        // колесо мыши в обход обычного overflow:hidden — сообщаем ему через
        // этот флаг, что скролл сейчас нужно полностью игнорировать.
        window.__menuOpen = true;
      }

      function closeMenu() {
        overlay.classList.remove('active');
        sideMenu.classList.remove('active');
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        window.__menuOpen = false;
      }

      if (menuBtn) menuBtn.addEventListener('click', openMenu);
      if (closeBtn) closeBtn.addEventListener('click', closeMenu);
      // Клик за пределами меню (по затемнённой области) тоже закрывает меню
      if (overlay) overlay.addEventListener('click', closeMenu);
    })();
