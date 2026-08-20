    // ===== Кнопки Hire / Contacts: confetti "боковые пушки" при наведении =====
    (function () {
      if (!window.confetti || typeof window.confetti.create !== 'function') return;

      // Создаём собственный canvas на весь экран и свой инстанс confetti
      // с useWorker: false — в песочнице превью Web Worker из Blob URL
      // часто блокируется политикой безопасности, и эффект молча не запускается.
      const confettiCanvas = document.createElement('canvas');
      confettiCanvas.style.position = 'fixed';
      confettiCanvas.style.top = '0';
      confettiCanvas.style.left = '0';
      confettiCanvas.style.width = '100%';
      confettiCanvas.style.height = '100%';
      confettiCanvas.style.pointerEvents = 'none';
      confettiCanvas.style.zIndex = '9999';
      document.body.appendChild(confettiCanvas);

      const myConfetti = window.confetti.create(confettiCanvas, {
        resize: true,
        useWorker: false
      });

      let isFiring = false;

      function fireSideCannons() {
        if (isFiring) return;
        isFiring = true;

        // Вылет строго с самого низа экрана
        const originY = 1;

        const duration = 1200; // мс
        const end = Date.now() + duration;
        const colors = ['#55f5f7', '#8965e0', '#21d4fd', '#ffffff'];

        (function frame() {
          myConfetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            startVelocity: 56,
            origin: { x: 0, y: originY },
            colors: colors
          });
          myConfetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            startVelocity: 56,
            origin: { x: 1, y: originY },
            colors: colors
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          } else {
            isFiring = false;
          }
        })();
      }

      const heroButtons = document.querySelectorAll('.hero-btn');
      heroButtons.forEach((btn) => {
        btn.addEventListener('mouseenter', fireSideCannons);
      });
    })();
