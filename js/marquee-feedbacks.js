    // ===== Лента(ы) отзывов (Feedbacks): движение привязано к скроллу =====
    // Та же логика, что и в Animated element: отсчёт от момента появления
    // КАЖДОЙ ленты в зоне видимости (а не от начала страницы), безопасное
    // зацикливание (контент продублирован дважды, сдвиг всегда "влево").
    // Направление вправо у 1-й и 3-й ленты — через CSS-зеркалирование
    // (.feedback-marquee--mirror), сама логика движения не меняется.
    (function () {
      const wraps = document.querySelectorAll('.feedback-marquee');
      if (!wraps.length) return;

      const SPEED = 0.4;
      const EASE = 0.08;

      function wrapToNegativeRange(value, loop) {
        let r = value % loop;
        if (r > 0) r -= loop;
        return r;
      }

      wraps.forEach((wrap) => {
        const track = wrap.querySelector('.feedback-marquee-track');
        if (!track) return;

        let referenceScrollY = wrap.getBoundingClientRect().top + window.scrollY - window.innerHeight;

        function updateReference() {
          referenceScrollY = wrap.getBoundingClientRect().top + window.scrollY - window.innerHeight;
        }
        window.addEventListener('resize', updateReference);
        window.addEventListener('load', updateReference);
        // Шрифт Satoshi часто дозагружается уже после отрисовки страницы
        // (font-display: swap) и чуть меняет высоту текста выше по странице
        // (заголовки, бейджи и т.д.) — из-за этого точка отсчёта для этой
        // ленты может оказаться неверной, и анимация начинает "отставать"
        // от реального скролла. Пересчитываем ещё раз, когда шрифт точно готов.
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(updateReference);
        }
        // Подстраховка для "холодного" первого запуска: на тяжёлой странице
        // (WebGL-фон в Hero, шрифты, другие скрипты) финальная раскладка
        // иногда устаканивается уже ПОСЛЕ события load и fonts.ready —
        // например, из-за пересчёта высоты соседних sticky-обёрток в
        // scroll-recalc.js, который может отработать чуть позже. Если точка
        // отсчёта в этот момент промахнулась, лента "замирает" навсегда
        // (после обновления страницы всё уже закешировано и грузится
        // синхронно, поэтому там бага не видно). Досчитываем ещё пару раз
        // с задержкой — это подчищает даже такой поздний сдвиг раскладки.
        setTimeout(updateReference, 1000);
        setTimeout(updateReference, 2500);

        let target = 0;
        let displayed = 0;
        let lastApplied = null;

        function loopWidth() {
          return (track.scrollWidth / 2) || 1;
        }

        function tick() {
          const relativeScroll = Math.max(0, window.scrollY - referenceScrollY);
          target = -relativeScroll * SPEED;

          displayed += (target - displayed) * EASE;

          const applied = wrapToNegativeRange(displayed, loopWidth());

          if (applied !== lastApplied) {
            track.style.transform = `translate3d(${applied.toFixed(2)}px, 0, 0)`;
            lastApplied = applied;
          }

          requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
      });
    })();
