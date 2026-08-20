    // ===== Бегущие строки (Animated element): движение привязано к скроллу =====
    // Позиция строк зависит не от абсолютного scrollY страницы (иначе к моменту,
    // когда секция становится видна, лента уже случайно сдвинута на непредсказуемую
    // величину, накопленную с самого начала сайта), а от скролла ОТНОСИТЕЛЬНО
    // появления этой секции в зоне видимости — пока она не видна, смещение 0
    // (то есть виден самый первый текст), и оно растёт только пока пользователь
    // реально скроллит саму секцию. Сглаживание (lerp) — тот же принцип, что и
    // переход Hero -> About me.
    (function () {
      const stack = document.querySelector('.marquee-stack');
      const topTrack = document.querySelector('.marquee-track:not(.marquee-track--reverse)');
      const bottomTrack = document.querySelector('.marquee-track--reverse');
      if (!stack || !topTrack || !bottomTrack) return;

      const SPEED = 0.4;  // px движения строки на px скролла
      const EASE = 0.08;  // чем меньше — тем плавнее (инертнее)

      // Точка отсчёта: скролл, при котором секция только начинает появляться
      // снизу экрана (её верх ещё на нижней границе вьюпорта)
      let referenceScrollY = stack.getBoundingClientRect().top + window.scrollY - window.innerHeight;

      function updateReference() {
        referenceScrollY = stack.getBoundingClientRect().top + window.scrollY - window.innerHeight;
      }
      window.addEventListener('resize', updateReference);
      window.addEventListener('load', updateReference);
      // Шрифт Satoshi часто дозагружается уже после отрисовки страницы
      // (font-display: swap) и чуть меняет высоту текста выше по странице —
      // из-за этого точка отсчёта может оказаться неверной. Пересчитываем
      // ещё раз, когда шрифт точно готов.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(updateReference);
      }
      // Подстраховка для "холодного" первого запуска: на тяжёлой странице
      // (WebGL-фон в Hero и другие скрипты) финальная раскладка иногда
      // устаканивается уже ПОСЛЕ load и fonts.ready — тогда точка отсчёта
      // промахивается и лента "замирает" навсегда (после обновления
      // страницы всё уже закешировано и грузится синхронно, поэтому там
      // бага не видно). Досчитываем ещё пару раз с задержкой.
      setTimeout(updateReference, 1000);
      setTimeout(updateReference, 2500);

      let topTarget = 0;
      let bottomTarget = 0;
      let topDisplayed = 0;
      let bottomDisplayed = 0;
      let lastTopApplied = null;
      let lastBottomApplied = null;

      function loopWidth(el) {
        // Контент продублирован дважды подряд — половина ширины трека
        // это ровно один полный повтор, по которому зацикливаем движение
        return (el.scrollWidth / 2) || 1;
      }

      // Всегда приводим смещение к диапазону (-loop, 0] — независимо от знака
      // накопленного значения. Раскладка трека — это две одинаковые копии
      // подряд, поэтому сдвиг ВЛЕВО на любую величину в этом диапазоне всегда
      // показывает корректный, непрерывный контент (для обоих направлений
      // движения — и "вперёд", и "назад")
      function wrapToNegativeRange(value, loop) {
        let r = value % loop;
        if (r > 0) r -= loop;
        return r;
      }

      function tick() {
        // Скролл относительно точки появления секции — до этой точки 0,
        // после — растёт вместе с реальным скроллом
        const relativeScroll = Math.max(0, window.scrollY - referenceScrollY);

        // Обе ленты используют ОДНУ и ту же (безопасную, всегда отрицательную)
        // формулу движения — противоположное визуальное направление нижней
        // ленты достигается зеркалированием через CSS (scaleX), а не сменой
        // знака здесь (положительное смещение при такой раскладке контента
        // всегда проваливается в дальний конец цикла вместо начала)
        const target = -relativeScroll * SPEED;
        topTarget = target;
        bottomTarget = target;

        topDisplayed += (topTarget - topDisplayed) * EASE;
        bottomDisplayed += (bottomTarget - bottomDisplayed) * EASE;

        const topApplied = wrapToNegativeRange(topDisplayed, loopWidth(topTrack));
        const bottomApplied = wrapToNegativeRange(bottomDisplayed, loopWidth(bottomTrack));

        if (topApplied !== lastTopApplied) {
          topTrack.style.transform = `translate3d(${topApplied.toFixed(2)}px, 0, 0)`;
          lastTopApplied = topApplied;
        }
        if (bottomApplied !== lastBottomApplied) {
          bottomTrack.style.transform = `translate3d(${bottomApplied.toFixed(2)}px, 0, 0)`;
          lastBottomApplied = bottomApplied;
        }

        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    })();
