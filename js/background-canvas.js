    // ===== SITE BACKGROUND: инициализация глобальной анимации (на весь сайт) =====
    (function () {
      function randomColors(count) {
        return new Array(count)
          .fill(0)
          .map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
      }

      const canvas = document.getElementById('site-canvas');
      let app = null;

      // Небольшая задержка, чтобы canvas успел получить финальные размеры
      // (иначе бывает ошибка "Computed radius is NaN")
      setTimeout(() => {
        if (!canvas || !window.TubesCursor) return;
        app = window.TubesCursor(canvas, {
          tubes: {
            colors: ["#5e72e4", "#8965e0", "#f5365c"],
            lights: {
              intensity: 200,
              colors: ["#21d4fd", "#b721ff", "#f4d03f", "#11cdef"]
            }
          }
        });
      }, 100);

      // Клик в любом месте сайта — меняем цвета анимации
      document.addEventListener('click', () => {
        if (app) {
          app.tubes.setColors(randomColors(3));
          app.tubes.setLightsColors(randomColors(4));
        }
      });
    })();
