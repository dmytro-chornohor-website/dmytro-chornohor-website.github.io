    (function () {
      const tracks = [
        { src: 'audio/track-0.mp3', title: 'Lofi Beats', artist: 'MondaMusic' },
        { src: 'audio/track-1.mp3', title: 'Lofi', artist: 'APALONBeats' },
        { src: 'audio/track-2.mp3', title: 'Lofi Beats', artist: 'APALONBeats' },
        { src: 'audio/track-3.mp3', title: 'LoFi Relax', artist: 'Kulakovka' },
        { src: 'audio/track-4.mp3', title: 'LoFi', artist: 'APALONBeats' },
      ];

      const audio = document.getElementById('musicAudio');
      const artistEl = document.getElementById('musicArtist');
      const titleEl = document.getElementById('musicTitle');
      const progressEl = document.getElementById('musicProgress');
      const progressFillEl = document.getElementById('musicProgressFill');
      const timeCurrentEl = document.getElementById('musicTimeCurrent');
      const timeRemainingEl = document.getElementById('musicTimeRemaining');
      const playBtn = document.getElementById('musicPlayBtn');
      const prevBtn = document.getElementById('musicPrevBtn');
      const nextBtn = document.getElementById('musicNextBtn');
      if (!audio || !playBtn) return;

      const iconPlay = playBtn.querySelector('.icon-play');
      const iconPause = playBtn.querySelector('.icon-pause');

      // ===== Сохранение позиции между страницами =====
      // Плеер общий для всех страниц сайта, но каждая страница — это
      // отдельная перезагрузка документа (обычные ссылки, не SPA), поэтому
      // сам аудио-элемент каждый раз создаётся заново. Чтобы музыка звучала
      // "без остановки" при переходах, запоминаем в localStorage трек,
      // текущее время и играл ли плеер — и на новой странице продолжаем
      // ровно с той же секунды.
      const STORAGE_KEY = 'musicPlayerState';

      function saveState() {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            index: currentIndex,
            time: audio.currentTime || 0,
            playing: !audio.paused,
          }));
        } catch (e) {}
      }

      function loadState() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          return raw ? JSON.parse(raw) : null;
        } catch (e) {
          return null;
        }
      }

      const savedState = loadState();

      let currentIndex = savedState ? savedState.index : 0;
      // По умолчанию (первый визит) плеер сразу пытается заиграть сам;
      // если пользователь до этого сам поставил на паузу — уважаем это
      // на следующих страницах тоже.
      let wantsPlaying = savedState ? !!savedState.playing : true;

      function formatTime(seconds) {
        if (!isFinite(seconds) || seconds < 0) seconds = 0;
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
      }

      function loadTrack(index, autoplay, resumeTime) {
        currentIndex = (index + tracks.length) % tracks.length;
        const track = tracks[currentIndex];
        audio.src = track.src;
        artistEl.textContent = track.artist;
        titleEl.textContent = track.title;
        progressFillEl.style.width = '0%';
        timeCurrentEl.textContent = '0:00';
        timeRemainingEl.textContent = '-0:00';

        if (resumeTime) {
          const applyResume = () => {
            if (isFinite(audio.duration) && resumeTime < audio.duration) {
              audio.currentTime = resumeTime;
            }
          };
          audio.addEventListener('loadedmetadata', applyResume, { once: true });
        }

        if (autoplay) {
          // Автоплей со звуком браузеры блокируют, пока пользователь ни разу
          // не взаимодействовал со страницей. Если play() отклонён, ставим
          // обработчик первого клика/тапа/нажатия клавиши где угодно на
          // странице, который повторит попытку — тогда музыка начнётся сразу
          // по первому взаимодействию, а не только по клику на саму кнопку.
          audio.play().catch(() => {
            armFirstInteractionAutoplay();
          });
        }
      }

      function armFirstInteractionAutoplay() {
        const tryPlay = () => {
          if (wantsPlaying && audio.paused) {
            audio.play().catch(() => {});
          }
          document.removeEventListener('click', tryPlay);
          document.removeEventListener('touchstart', tryPlay);
          document.removeEventListener('keydown', tryPlay);
        };
        document.addEventListener('click', tryPlay);
        document.addEventListener('touchstart', tryPlay);
        document.addEventListener('keydown', tryPlay);
      }

      function updatePlayIcon(isPlaying) {
        iconPlay.style.display = isPlaying ? 'none' : 'block';
        iconPause.style.display = isPlaying ? 'block' : 'none';
        playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
      }

      function togglePlay() {
        wantsPlaying = audio.paused;
        if (audio.paused) {
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
        saveState();
      }

      function seekByClientX(clientX) {
        const rect = progressEl.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        if (isFinite(audio.duration)) {
          audio.currentTime = ratio * audio.duration;
          saveState();
        }
      }

      audio.addEventListener('play', () => updatePlayIcon(true));
      audio.addEventListener('pause', () => updatePlayIcon(false));

      audio.addEventListener('timeupdate', () => {
        if (!isFinite(audio.duration) || audio.duration === 0) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        progressFillEl.style.width = pct + '%';
        timeCurrentEl.textContent = formatTime(audio.currentTime);
        timeRemainingEl.textContent = '-' + formatTime(audio.duration - audio.currentTime);
        saveState();
      });

      audio.addEventListener('ended', () => {
        loadTrack(currentIndex + 1, true);
      });

      playBtn.addEventListener('click', togglePlay);
      prevBtn.addEventListener('click', () => loadTrack(currentIndex - 1, !audio.paused || wantsPlaying));
      nextBtn.addEventListener('click', () => loadTrack(currentIndex + 1, !audio.paused || wantsPlaying));

      // Клик в любое место прогресс-бара — перемотка
      progressEl.addEventListener('click', (e) => seekByClientX(e.clientX));

      // Сохраняем состояние перед уходом со страницы (переход по ссылке,
      // закрытие вкладки и т.д.) — на случай, если событие timeupdate
      // не успело сработать прямо перед этим.
      window.addEventListener('pagehide', saveState);
      window.addEventListener('beforeunload', saveState);

      audio.volume = 0.75;
      loadTrack(currentIndex, wantsPlaying, savedState ? savedState.time : 0);
    })();
