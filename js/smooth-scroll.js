    // ===== Плавный скролл всего сайта (компенсация "дёрганого" колеса мыши) =====
    // У колеса мыши скролл дискретный — прыжками примерно по 100px за щелчок
    // (в отличие от трекпада, где дельта непрерывная и уже плавная). Поэтому
    // сглаживать нужно не только визуальный эффект поверх скролла, а сам скролл
    // страницы: перехватываем wheel, копим "целевую" позицию и каждый кадр
    // плавно ("лерпом") подтягиваем к ней реальную позицию через scrollTo —
    // получаем мягкий разгон/торможение независимо от резкости самого колеса.
    (function () {
      // На тач-устройствах (телефоны, планшеты) не трогаем скролл вообще:
      // у них и так есть нативный плавный инерционный скролл, а постоянные
      // вызовы window.scrollTo() из RAF-цикла ниже конфликтуют с этой
      // инерцией и ломают/дёргают скролл при свайпах. Этот хак нужен только
      // для компенсации дискретного скролла колесом мыши на десктопе.
      const isTouchDevice =
        window.matchMedia('(pointer: coarse)').matches ||
        ('ontouchstart' in window) ||
        navigator.maxTouchPoints > 0;
      if (isTouchDevice) return;

      const html = document.documentElement;
      let current = window.scrollY;
      let target = window.scrollY;
      const ease = 0.09; // чем меньше — тем плавнее (инертнее)

      function getMaxScroll() {
        return Math.max(0, html.scrollHeight - window.innerHeight);
      }

      function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
      }

      // Колесо мыши / трекпад — гасим нативный резкий скролл, копим свою цель
      window.addEventListener('wheel', function (e) {
        e.preventDefault();
        // Пока открыто боковое меню, скролл страницы должен быть полностью
        // заблокирован (см. js/side-menu-toggle.js) — просто игнорируем ввод.
        if (window.__menuOpen) return;
        target = clamp(target + e.deltaY, 0, getMaxScroll());
      }, { passive: false });

      // Клавиатура — тоже через нашу плавную систему, чтобы поведение было единым
      window.addEventListener('keydown', function (e) {
        if (window.__menuOpen) return;
        const step = window.innerHeight * 0.85;
        let handled = true;
        switch (e.key) {
          case 'ArrowDown':
            target = clamp(target + 80, 0, getMaxScroll());
            break;
          case 'ArrowUp':
            target = clamp(target - 80, 0, getMaxScroll());
            break;
          case 'PageDown':
          case ' ':
            target = clamp(target + step, 0, getMaxScroll());
            break;
          case 'PageUp':
            target = clamp(target - step, 0, getMaxScroll());
            break;
          case 'Home':
            target = 0;
            break;
          case 'End':
            target = getMaxScroll();
            break;
          default:
            handled = false;
        }
        if (handled) e.preventDefault();
      }, { passive: false });

      // Если реальная позиция скролла заметно разошлась с тем, что мы сами
      // только что выставили (перетаскивание ползунка скроллбара, тач-скролл
      // на мобильном и т.п.) — считаем это "внешним" скроллом и синхронизируем
      // цель. Сравнение по допуску вместо флага — событие scroll после нашего
      // же scrollTo() приходит асинхронно, поэтому флаг ненадёжен.
      let isAnimating = false;

      window.addEventListener('scroll', function () {
        // scrollTo() from our RAF also fires a scroll event. Do not treat that
        // internal update as an external scrollbar/touch change, otherwise
        // current/target get reset every frame and the scroll can visibly jump.
        if (isAnimating) return;
        if (Math.abs(window.scrollY - current) > 2) {
          current = window.scrollY;
          target = window.scrollY;
        }
      }, { passive: true });

      window.addEventListener('resize', function () {
        target = clamp(target, 0, getMaxScroll());
      });

      function raf() {
        current += (target - current) * ease;
        if (Math.abs(target - current) < 0.05) {
          current = target;
        }

        isAnimating = true;
        window.scrollTo(0, current);
        // Let the browser deliver the scroll event before considering
        // subsequent user-driven scrolling as external input.
        requestAnimationFrame(() => {
          isAnimating = false;
        });

        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);
    })();
