    // ===== Навбар: реакция на светлые секции (About me и Project) =====
    // 1) Кнопка меню меняет тему на тёмную, пока под навбаром светлая
    //    карточка (About me ИЛИ Project) — иначе на белом фоне её не видно.
    // 2) Плашки статистики физически "выталкиваются" вверх секцией About me —
    //    движутся 1:1 со скроллом (та же скорость, с которой About me
    //    наезжает), пропадая за верхним краем экрана. При скролле назад
    //    тем же способом "вытягиваются" обратно вниз.
    (function () {
      const navbar = document.querySelector('.navbar');
      const navStats = document.querySelector('.nav-stats');
      const heroEl = document.getElementById('hero');
      const aboutMe = document.getElementById('about-me');
      const project = document.getElementById('project');
      const stackProject = document.querySelector('.sticky-stack-project');
      if (!navbar || (!aboutMe && !project)) return;

      function overlapsLight(el, navRect) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top <= navRect.bottom && rect.bottom >= 0;
      }

      function update() {
        const navRect = navbar.getBoundingClientRect();
        const aboutRect = aboutMe ? aboutMe.getBoundingClientRect() : null;

        // Кнопка меню: "Second", пока навбар над About me или Project.
        // При возврате конкретно на Hero — снова "First". А вот дальше,
        // после Projects (финальная секция и т.п.), навбар уже не находится
        // ни над Hero, ни над About me/Project — в этом случае состояние
        // просто не трогаем, оно остаётся таким, каким было последний раз
        // (то есть "Second" до самого конца страницы).
        const onLight = overlapsLight(aboutMe, navRect) || overlapsLight(project, navRect);
        const onHero = overlapsLight(heroEl, navRect);
        if (onLight) {
          navbar.classList.add('on-light');
        } else if (onHero) {
          navbar.classList.remove('on-light');
        }

        // Навбар теперь всегда остаётся на экране, включая последнюю секцию —
        // отдельный класс скрытия больше не используется.

        // Статы — выталкиваем вверх ровно настолько, насколько About me
        // "наехала" на зону навбара снизу (1:1 со скроллом, без сглаживания)
        if (navStats && aboutRect) {
          const push = navRect.bottom - aboutRect.top;
          const offset = push > 0 ? push : 0;
          navStats.style.transform = `translateY(-${offset}px)`;
        }
      }

      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
    })();
