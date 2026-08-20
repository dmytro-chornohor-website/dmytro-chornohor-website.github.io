    // ===== About me: аккордеон (Process / Clients / Industries / Expertise / Services) =====
    (function () {
      const items = document.querySelectorAll('[data-acc]');
      items.forEach((item) => {
        const toggleBtn = item.querySelector('[data-acc-toggle]');
        if (!toggleBtn) return;
        toggleBtn.addEventListener('click', () => {
          const isOpen = item.classList.contains('open');
          // Аккордеон-режим: открываем один пункт — остальные закрываются
          items.forEach((other) => other.classList.remove('open'));
          if (!isOpen) {
            item.classList.add('open');
          }
        });
      });
    })();
