    // ===== Динамический пересчёт скролл-обёрток вокруг #project =====
    // На мобильном #about-me тоже теперь растёт по контенту (а не жёстко
    // 100vh), поэтому её обёртка ".sticky-stack" (эффект "About me наезжает
    // на Hero") по той же причине, что и у Projects, нуждается в таком же
    // рантайм-пересчёте — иначе при высоте About me больше 100vh эффекту
    // не хватит места и он "оборвётся" раньше времени.
    (function () {
      const aboutMe = document.getElementById('about-me');
      const stack = document.querySelector('.sticky-stack');
      if (!aboutMe || !stack) return;

      function recalc() {
        const aboutHeight = aboutMe.getBoundingClientRect().height;
        // hero (100vh, sticky) + about-me (её реальная высота, обычный поток)
        stack.style.height = `calc(100vh + ${aboutHeight}px)`;
      }

      recalc();
      window.addEventListener('resize', recalc);
      window.addEventListener('load', recalc);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          recalc();
          window.dispatchEvent(new Event('resize'));
        });
      }

      // Аккордеон (Process / Clients / Industries / Expertise / Services)
      // меняет реальную высоту #about-me плавно, через CSS-transition
      // (grid-template-rows, 0.65s) — а не мгновенно. Пересчитываем сразу
      // по клику (для мгновенной реакции) и ещё раз по завершении
      // transition (transitionend) — так обёртка всегда соответствует
      // актуальной высоте, без "прыжков" и рассинхрона.
      const accToggles = document.querySelectorAll('[data-acc-toggle]');
      accToggles.forEach((btn) => {
        btn.addEventListener('click', recalc);
      });

      const accBodies = document.querySelectorAll('.acc-body');
      accBodies.forEach((body) => {
        body.addEventListener('transitionend', (e) => {
          if (e.propertyName === 'grid-template-rows') recalc();
        });
      });
    })();

    // Секция #project теперь растёт по контенту (кейс-блок), поэтому её
    // высота больше не фиксированные 100vh. Обёртки, которые реализуют
    // эффект "прилипания/наезда" (feedbacks -> project и project -> final-cta),
    // были рассчитаны под условие "project = 100vh". Чтобы эффект остался
    // математически верным при любой фактической высоте project, измеряем
    // её в рантайме и пересчитываем high обёрток.
    (function () {
      const project = document.getElementById('project');
      const stackProject = document.querySelector('.sticky-stack-project');
      const ctaStack = document.querySelector('.cta-reveal-stack');
      if (!project || !stackProject || !ctaStack) return;

      function recalc() {
        const projectHeight = project.getBoundingClientRect().height;
        // feedbacks (100vh, sticky) + project (свою высоту, обычный поток)
        stackProject.style.height = `calc(100vh + ${projectHeight}px)`;
        // final-cta "залезает" под project (margin-top = -высота project),
        // а высота обёртки даёт ровно столько же скролла, сколько нужно
        // project'у, чтобы полностью уехать (плюс 100vh на удержание final-cta)
        ctaStack.style.marginTop = `-${projectHeight}px`;
        ctaStack.style.height = `calc(100vh + ${projectHeight}px)`;
      }

      recalc();
      window.addEventListener('resize', recalc);
      // Пересчёт после полной загрузки шрифтов/изображений (лого и т.п.),
      // так как это может изменить фактическую высоту project
      window.addEventListener('load', recalc);
      // Шрифт Satoshi обычно дозагружается ПОСЛЕ события load (font-display: swap),
      // из-за чего тексты (заголовки, бейджи) меняют размер уже после первого
      // recalc() — это сбивает высоту project и, как следствие, логику наведения
      // навбара на светлые секции. Пересчитываем ещё раз, когда шрифт точно готов,
      // и дополнительно дёргаем 'resize', чтобы скрипт цвета навбара тоже обновился.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          recalc();
          window.dispatchEvent(new Event('resize'));
        });
      }
    })();
