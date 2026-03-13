    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0); 

    if (window.location.hash) {
      history.replaceState(null, null, window.location.pathname + window.location.search);
    }

    function setCookie(name, value, days) {
      const d = new Date(); 
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
    }

    function getCookie(name) {
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        const [key, val] = cookie.trim().split("=");
        if (key === name) return val;
      }
      return null;
    }

    window.addEventListener("DOMContentLoaded", () => {
      const overlay = document.getElementById("preload-overlay");
      const mainContent = document.getElementById("main-content");
      const profilePic = document.getElementById("profile-pic");
      const glow = document.getElementById("mouse-glow");

      tippy('[data-tippy-content]', { 
        animation: 'shift-away', 
        theme: 'translucent', 
        arrow: false 
      });

      // --- Micro-Sounds (Web Audio API, kein externer Download) ---
      let audioCtx = null;
      const getAudioCtx = () => {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return audioCtx;
      };

      // Synthetischer Klick-Sound (extrem leise, kurzer Sinus-Blip)
      window.playClickSound = () => {
        try {
          const ctx = getAudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
          gain.gain.setValueAtTime(0.06, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.1);
        } catch(e) { /* Audio nicht verfügbar, stille Fehlerbehandlung */ }
      };

      // Synthetischer Erfolgs-Sound (kurzer Chime, 3 aufsteigende Töne)
      window.playWinSound = () => {
        try {
          const ctx = getAudioCtx();
          const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
            gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
            osc.start(ctx.currentTime + i * 0.12);
            osc.stop(ctx.currentTime + i * 0.12 + 0.3);
          });
        } catch(e) { /* Audio nicht verfügbar, stille Fehlerbehandlung */ }
      };

      // Klick-Sound auf alle satisfying Buttons registrieren
      document.querySelectorAll('.btn-satisfying').forEach(btn => {
        btn.addEventListener('click', () => window.playClickSound());
      });

      // --- Background Video laden & Einblenden ---
      const bgVideo = document.getElementById("bg-video");

      let isVideoReady = false;
      const fadeVideoIn = () => { 
        if (isVideoReady) return;
        isVideoReady = true;
        if (bgVideo) bgVideo.classList.add("loaded"); 
        if (overlay) overlay.classList.add("video-loaded");
      };

      if (bgVideo) {
        if (bgVideo.readyState >= 3) {
          fadeVideoIn();
        } else {
          bgVideo.addEventListener("canplay", fadeVideoIn, { once: true });
          bgVideo.addEventListener("playing", fadeVideoIn, { once: true });
          bgVideo.addEventListener("loadeddata", fadeVideoIn, { once: true });
          // Fallback nach 2 Sekunden, damit man nicht in einem Blackscreen feststeckt
          setTimeout(fadeVideoIn, 2000);
        }
      } else {
        fadeVideoIn();
      }

      const revealContent = () => {
        overlay.classList.add("fade-out");
        setTimeout(() => {
          mainContent.classList.add("visible");
          document.body.classList.remove("no-scroll"); 
          document.body.classList.add("glow-active"); 
        }, 400); 
        setTimeout(() => { 
          overlay.remove(); 
        }, 1600); 
      };
      // Intro-Overlay immer anzeigen (Cookie-Check entfernt)
      overlay.addEventListener("click", () => {
        revealContent();
      });

      const observerOptions = { 
        root: null, 
        rootMargin: '0px', 
        threshold: 0.15 
      };

      const observer = new IntersectionObserver((entries, observer) => {
        let staggerDelay = 0; 
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setTimeout(() => { 
              entry.target.classList.add('fade-in'); 
            }, staggerDelay);
            staggerDelay += 150; 
            observer.unobserve(entry.target); 
          }
        });
      }, observerOptions);

      document.querySelectorAll('.project-card').forEach(card => {
        observer.observe(card);
      });

      if (profilePic) {
        profilePic.addEventListener("click", () => {
          profilePic.classList.add("spin-active");
          setTimeout(() => { 
            profilePic.classList.remove("spin-active"); 
          }, 600);
        });
      }

      // --- DUMMY BUTTON WURDE ZUM FAKE-CAPTCHA TRIGGER ---
      
      const triggerBtns = document.querySelectorAll('.dummy-btn'); // "Wer ist Traubenzuckermeister?"
      const captchaOverlay = document.getElementById('captcha-overlay');
      const stage1 = document.getElementById('captcha-stage-1');
      const stage2 = document.getElementById('captcha-stage-2');
      const stage3 = document.getElementById('captcha-stage-3');
      const checkboxBtn = document.getElementById('captcha-checkbox-btn');
      const checkboxBox = document.getElementById('captcha-checkbox-box');
      const cancelBtn = document.getElementById('captcha-cancel-btn');
      const successOverlay = document.getElementById('captcha-success-overlay');
      const successCloseBtn = document.getElementById('captcha-success-close');
      
      let snakeGame = null;

      // Status Reset Funktion
      const resetCaptcha = () => {
        stage1.classList.add('active');
        stage2.classList.remove('active');
        stage3.classList.remove('active');
        checkboxBox.classList.remove('checked');
        if (snakeGame) snakeGame.stop();
      };

      // --- Confetti Spawn Funktion ---
      const spawnConfetti = () => {
        const container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);

        const colors = ['#a881ff', '#ff00aa', '#4caf50', '#ffffff', '#ffc107', '#00bcd4'];
        for (let i = 0; i < 50; i++) {
          const piece = document.createElement('div');
          piece.className = 'confetti-piece';
          piece.style.left = Math.random() * 100 + '%';
          piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
          piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
          piece.style.animationDelay = Math.random() * 1 + 's';
          piece.style.width = (Math.random() * 8 + 5) + 'px';
          piece.style.height = (Math.random() * 8 + 5) + 'px';
          container.appendChild(piece);
        }
        setTimeout(() => container.remove(), 5000);
      };

      // Button Click -> Öffnet CAPTCHA
      triggerBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          
          // Snake.js erst bei Bedarf laden
          if (!window.SnakeCAPTCHA && !document.querySelector('script[src="snake.js"]')) {
            const snakeScript = document.createElement('script');
            snakeScript.src = 'snake.js';
            document.body.appendChild(snakeScript);
          }
          
          // Falls schon gelöst (im SessionStorage gespeichert)
          if (sessionStorage.getItem('tzm_unlocked') === 'true') {
            successOverlay.classList.add('active');
            document.body.classList.add('no-scroll');
            spawnConfetti();
            return;
          }

          resetCaptcha();
          captchaOverlay.classList.add('active');
          document.body.classList.add('no-scroll');
        });
      });

      // Flow: Checkbox geklickt -> Spinner -> Game
      if (checkboxBtn) {
        checkboxBtn.addEventListener('click', () => {
          if (checkboxBox.classList.contains('checked')) return; // Verhindere Doppel-Klick
          
          checkboxBox.classList.add('checked');
          
          // Kurze Pause, dann zum Spinner
          setTimeout(() => {
            stage1.classList.remove('active');
            stage2.classList.add('active');
            
            // Lade-Simulation (Spannung aufbauen, 2-3 Sekunden)
            setTimeout(() => {
              stage2.classList.remove('active');
              stage3.classList.add('active');
              
              // Snake Game Initialisieren und Starten
              if (!snakeGame && window.SnakeCAPTCHA) {
                snakeGame = new window.SnakeCAPTCHA('snake-canvas');
              }
              
              if (snakeGame) {
                // Resize Canvas noch einmal explizit, da es jetzt sichtbar ist
                setTimeout(() => {
                  snakeGame.start(
                    // WIN CALLBACK
                    () => {
                      sessionStorage.setItem('tzm_unlocked', 'true');
                      setTimeout(() => {
                        captchaOverlay.classList.remove('active');
                        successOverlay.classList.add('active');
                        spawnConfetti();
                      }, 500);
                    },
                    // DIE CALLBACK
                    () => {
                      // Nix tun, auto-restart ist im snake.js
                    }
                  );
                }, 50);
              }
            }, 2500); // 2.5s "Verifizierung läuft..."
          }, 600); // 0.6s nach Klick auf Checkbox
        });
      }

      // Abbrechen Button im Snake Modal
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          captchaOverlay.classList.remove('active');
          document.body.classList.remove('no-scroll');
          if (snakeGame) snakeGame.stop();
        });
      }

      // Erfolgs-Modal schließen
      if (successCloseBtn) {
        successCloseBtn.addEventListener('click', () => {
          successOverlay.classList.remove('active');
          document.body.classList.remove('no-scroll');
        });
      }

      // --- AUTO-FORMAT ERKENNUNG (Erweitert) ---
      const imgExtensions = ['webp', 'gif', 'png', 'jpg', 'jpeg'];
      
      // 0. Favicon Scanner (gleiche Logik wie Profilbild!)
      const faviconLink = document.getElementById('dynamic-favicon');
      if (faviconLink) {
        const faviconExtensions = ['ico', 'png', 'webp', 'jpg', 'jpeg', 'gif', 'svg'];
        const tryNextFavicon = (index) => {
          if (index >= faviconExtensions.length) return; // Kein Favicon gefunden → Emoji bleibt
          const testUrl = `favicon.${faviconExtensions[index]}`;
          const img = new Image();
          img.onload = () => { faviconLink.href = testUrl; };
          img.onerror = () => { tryNextFavicon(index + 1); };
          img.src = testUrl;
        };
        tryNextFavicon(0);
      }

      // 1. Profilbild Scanner
      const profilePicImg = document.getElementById('profile-pic-img');
      if (profilePicImg) {
        const tryNextProfile = (index) => {
          if (index >= imgExtensions.length) return;
          const testUrl = `profilbild.${imgExtensions[index]}`;
          const img = new Image();
          img.onload = () => { profilePicImg.src = testUrl; };
          img.onerror = () => { tryNextProfile(index + 1); };
          img.src = testUrl;
        };
        tryNextProfile(0);
      }

      // 2. Kunstwerk Scanner
      const kunstwerkPreview = document.getElementById('kunstwerk-preview');
      const kunstwerkTrigger = document.getElementById('kunstwerk-trigger');
      if (kunstwerkPreview && kunstwerkTrigger) {
        const tryNextKunstwerk = (index) => {
          if (index >= imgExtensions.length) return;
          const testUrl = `Kunstwerk.${imgExtensions[index]}`;
          const img = new Image();
          img.onload = () => {
            kunstwerkPreview.src = testUrl;
            kunstwerkTrigger.setAttribute('data-media-src', testUrl);
          };
          img.onerror = () => { tryNextKunstwerk(index + 1); };
          img.src = testUrl;
        };
        tryNextKunstwerk(0);
      }
      
      // 3. Bild-Meme Scanner
      const memeImgPreview = document.getElementById('meme-bild-preview');
      const memeImgTrigger = document.getElementById('meme-bild-trigger');
      if (memeImgPreview && memeImgTrigger) {
        const tryNextImage = (index) => {
          if (index >= imgExtensions.length) return; 
          const testUrl = `meme-bild.${imgExtensions[index]}`;
          const img = new Image();
          img.onload = () => {
            memeImgPreview.src = testUrl; 
            memeImgTrigger.setAttribute('data-media-src', testUrl); 
          };
          img.onerror = () => { tryNextImage(index + 1); };
          img.src = testUrl;
        };
        tryNextImage(0); 
      }

      // 4. Video-Meme Scanner
      const memeVideoPreview = document.getElementById('meme-video-preview');
      const memeVideoTrigger = document.getElementById('meme-video-trigger');
      const videoExtensions = ['webm', 'mp4', 'mov'];
      if (memeVideoPreview && memeVideoTrigger) {
        const tryNextVideo = (index) => {
          if (index >= videoExtensions.length) return;
          const testUrl = `meme-video.${videoExtensions[index]}`;
          const videoTest = document.createElement('video');
          videoTest.onloadedmetadata = () => {
            memeVideoPreview.src = testUrl; 
            memeVideoTrigger.setAttribute('data-media-src', testUrl); 
          };
          videoTest.onerror = () => { tryNextVideo(index + 1); };
          videoTest.src = testUrl;
        };
        tryNextVideo(0);
      }

      // --- Universelle Kino-Modus Logik ---
      const mediaModal = document.getElementById('video-modal');
      const modalIframe = document.getElementById('modal-iframe');
      const modalVideo = document.getElementById('modal-video');
      const modalImg = document.getElementById('modal-img');
      const modalCloseBtn = document.getElementById('modal-close-btn');
      const modalHintText = document.getElementById('modal-hint-text');
      const modalTriggers = document.querySelectorAll('.media-modal-trigger');

      modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
          e.preventDefault(); 
          const mediaType = trigger.getAttribute('data-media-type');
          const mediaSrc = trigger.getAttribute('data-media-src');
          
          modalIframe.style.display = 'none';
          modalVideo.style.display = 'none';
          modalImg.style.display = 'none';
          modalIframe.src = '';
          modalVideo.src = '';
          modalImg.src = '';

          if (mediaType === 'iframe') {
            modalIframe.style.display = 'block';
            modalIframe.src = mediaSrc;
            modalHintText.innerText = 'Falls das Video nicht abgespielt wird, bitte auf "Auf YouTube ansehen" drücken.';
          } else if (mediaType === 'video') {
            modalVideo.style.display = 'block';
            modalVideo.src = mediaSrc;
            modalHintText.innerText = 'Lehn dich zurück und genieß das Meme!';
          } else if (mediaType === 'image') {
            modalImg.style.display = 'block';
            modalImg.src = mediaSrc;
            modalHintText.innerText = 'Ein absolutes Meisterwerk.';
          }
          
          mediaModal.classList.add('active'); 
          document.body.classList.add('no-scroll'); 
        });
      });

      const closeMediaModal = () => {
        mediaModal.classList.remove('active'); 
        setTimeout(() => {
          modalIframe.src = '';
          modalVideo.src = '';
          modalVideo.pause(); 
          modalImg.src = '';
        }, 500);
        document.body.classList.remove('no-scroll'); 
      };

      modalCloseBtn.addEventListener('click', closeMediaModal);
      mediaModal.addEventListener('click', (e) => {
        if (e.target === mediaModal) { 
          closeMediaModal(); 
        }
      });

      // --- Page Transition: Butterweicher Fade-Out bei internen Links ---
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        
        // Ignoriere: externe Links, neue Tabs, Anchor-Links, Hash-Links, preventDefault'd
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
        if (link.target === '_blank') return;
        if (link.classList.contains('media-modal-trigger')) return;
        if (link.classList.contains('dummy-btn')) return;
        
        // Nur same-origin Links (interne Navigation)
        try {
          const url = new URL(href, window.location.origin);
          if (url.origin !== window.location.origin) return;
        } catch { return; }
        
        // Fade-Out → Navigate
        e.preventDefault();
        document.body.classList.add('page-leaving');
        setTimeout(() => { window.location.href = href; }, 400);
      });

      // --- Performance-optimiertes Mousemove (RAF Throttling) ---
      let glowRAF = null;
      document.addEventListener("mousemove", (e) => {
        if (glowRAF) return; // Skip wenn vorheriger Frame noch nicht gerendert
        glowRAF = requestAnimationFrame(() => {
          glow.style.left = e.clientX + "px";
          glow.style.top = e.clientY + "px";
          glowRAF = null;
        });
      });

      let spotlightRAF = null;
      document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('mousemove', e => {
          if (spotlightRAF) return;
          spotlightRAF = requestAnimationFrame(() => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
            spotlightRAF = null;
          });
        });
      });
    });
