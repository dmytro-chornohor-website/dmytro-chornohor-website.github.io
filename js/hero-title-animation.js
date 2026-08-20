    // ===== HERO TITLE: посимвольная blur-анимация появления =====
    (function () {
      const titleEl = document.getElementById('hero-title');
      if (!titleEl || !window.gsap) return;

      const firstText = titleEl.textContent; // "I\u2019m glad we met."
      const secondText = "Let\u2019s build this out!";

      function splitToChars(el, text) {
        el.innerHTML = '';
        const words = text.split(' ');
        words.forEach((word, wordIndex) => {
          // Буквы одного слова оборачиваем в "неразрывный" контейнер —
          // так браузер не сможет перенести строку посреди слова
          const wordWrap = document.createElement('span');
          wordWrap.className = 'word';
          word.split('').forEach((char) => {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = char;
            wordWrap.appendChild(span);
          });
          el.appendChild(wordWrap);

          // Обычный (разрывный) пробел между словами — именно здесь
          // браузеру разрешено переносить строку
          if (wordIndex < words.length - 1) {
            const spaceSpan = document.createElement('span');
            spaceSpan.className = 'char';
            spaceSpan.textContent = ' ';
            el.appendChild(spaceSpan);
          }
        });
        return el.querySelectorAll('span.char');
      }

      // Анимация появления текста (в 3 раза медленнее исходной: 0.3s -> 0.9s, stagger 0.015 -> 0.045)
      function animateIn(chars, onComplete) {
        gsap.set(chars, { opacity: 0, y: 10, filter: 'blur(8px)' });
        gsap.to(chars, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.9,
          ease: 'power2.out',
          stagger: 0.045,
          clearProps: 'filter',
          onComplete: onComplete
        });
      }

      // Анимация исчезновения текста перед сменой
      function animateOut(chars, onComplete) {
        gsap.to(chars, {
          opacity: 0,
          y: -10,
          filter: 'blur(8px)',
          duration: 0.9,
          ease: 'power2.in',
          stagger: 0.03,
          onComplete: onComplete
        });
      }

      const firstChars = splitToChars(titleEl, firstText);

      // Сразу прячем буквы, чтобы текст не "мелькал" видимым во время задержки
      gsap.set(firstChars, { opacity: 0, y: 10, filter: 'blur(8px)' });

      // Старт анимации — через 1 секунду после загрузки страницы
      setTimeout(() => {
        animateIn(firstChars, () => {
          // Текст остаётся неизменным 10 секунд, затем меняется на новый — уже навсегда
          setTimeout(() => {
            const currentChars = titleEl.querySelectorAll('span.char');
            animateOut(currentChars, () => {
              const secondChars = splitToChars(titleEl, secondText);
              animateIn(secondChars);
            });
          }, 10000);
        });
      }, 1000);
    })();
