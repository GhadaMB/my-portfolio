  /* ============================================================
       1) Reveal-on-scroll (IntersectionObserver)
       - Adds .in to .reveal elements when in viewport
       - Respects prefers-reduced-motion
    ============================================================ */
      (function () {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          document
            .querySelectorAll(".reveal")
            .forEach((el) => el.classList.add("in"));
          return;
        }
        const io = new IntersectionObserver(
          (entries, obs) => {
            entries.forEach((e) => {
              if (e.isIntersecting) {
                e.target.classList.add("in");
                obs.unobserve(e.target);
              }
            });
          },
          { threshold: 0.15 }
        );
        document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
      })();

      /* ============================================================
       2) Carousel: keyboard + buttons + swipe + adaptive height
       - Never crops (CSS uses object-fit:contain)
       - Auto height based on current slide
       - Arrow keys, buttons, and touch gestures
       - a11y live region announces "Slide X of N"
    ============================================================ */
      (function () {
        const track = document.getElementById("vroomSlides");
        if (!track) return;

        const carousel = document.getElementById("carousel");
        const prevBtn = document.getElementById("prevBtn");
        const nextBtn = document.getElementById("nextBtn");
        const status = document.getElementById("slideStatus");

        const slides = Array.from(track.children);
        const total = slides.length;
        let index = 0;

        // Classify slides based on image natural aspect ratio
        function classifySlides() {
          const images = track.querySelectorAll(".media img");
          let pending = images.length;
          images.forEach((img) => {
            const apply = () => {
              const ar = img.naturalWidth / img.naturalHeight;
              const media = img.closest(".media");
              if (!media) return;
              //media.classList.add(ar >= 0.9 ? "is-landscape" : "is-portrait");
              media.classList.add(ar >= 0.9 ? "is-portrait" : "is-portrait");
              if (--pending === 0) {
                setCarouselHeight();
                updateStatus();
              }
            };
            if (img.complete) apply();
            else img.addEventListener("load", apply, { once: true });
          });
        }

        function setCarouselHeight() {
          const active = slides[index]?.querySelector(".media");
          if (!active) return;
          // use scrollHeight to account for portrait/tall images
          const h = active.scrollHeight;
          carousel.style.height = h + "px";
        }

        function render() {
          track.style.transform = `translateX(-${index * 100}%)`;
          setCarouselHeight();
          updateStatus();
        }

        function updateStatus() {
          if (!status) return;
          status.textContent = `Slide ${index + 1} of ${total}`;
        }

        function next() {
          index = (index + 1) % total;
          render();
        }
        function prev() {
          index = (index - 1 + total) % total;
          render();
        }

        // Buttons
        nextBtn.addEventListener("click", next, { passive: true });
        prevBtn.addEventListener("click", prev, { passive: true });

        // Keyboard
        document.addEventListener("keydown", (e) => {
          if (e.key === "ArrowRight") next();
          if (e.key === "ArrowLeft") prev();
        });

        // Touch / pointer swipe
        let startX = 0,
          currentX = 0,
          isPointer = false;
        const onDown = (x) => {
          isPointer = true;
          startX = currentX = x;
        };
        const onMove = (x) => {
          if (!isPointer) return;
          currentX = x;
          // translate slightly while swiping (visual feedback)
          const dx = currentX - startX;
          track.style.transition = "none";
          track.style.transform = `translateX(calc(-${
            index * 100
          }% + ${dx}px))`;
        };
        const onUp = () => {
          if (!isPointer) return;
          const dx = currentX - startX;
          track.style.transition = ""; // restore
          if (Math.abs(dx) > 60) {
            dx < 0 ? next() : prev();
          } else render();
          isPointer = false;
        };

        // Pointer events (works for mouse + touch)
        track.addEventListener("pointerdown", (e) => onDown(e.clientX));
        track.addEventListener("pointermove", (e) => onMove(e.clientX));
        track.addEventListener("pointerup", onUp);
        track.addEventListener("pointercancel", onUp);
        track.addEventListener("pointerleave", () => {
          if (isPointer) onUp();
        });

        // Resize observer—keep height correct on viewport changes
        let rAF;
        window.addEventListener("resize", () => {
          cancelAnimationFrame(rAF);
          rAF = requestAnimationFrame(setCarouselHeight);
        });

        classifySlides();
        render();

        /* Optional autoplay respecting reduced motion */
        let timer,
          paused = false;
        const prefersReduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        const wrap = track.closest(".carousel-wrap");
        const pause = () => {
          paused = true;
          clearInterval(timer);
        };
        const play = () => {
          paused = false;
          restart();
        };
        wrap.addEventListener("mouseenter", pause);
        wrap.addEventListener("mouseleave", play);
        wrap.addEventListener("focusin", pause);
        wrap.addEventListener("focusout", play);
        function restart() {
          clearInterval(timer);
          if (prefersReduced) return;
          if (!paused) timer = setInterval(next, 5000);
        }
        restart();
      })();

      /* ============================================================
       3) Lightbox: Full-screen image preview with Zoom & Pan
    ============================================================ */
      (function () {
        const lightbox = document.getElementById("lightbox");
        const lightboxImg = document.getElementById("lightbox-img");
        const lightboxClose = document.getElementById("lightbox-close");
        const container = document.getElementById("lightbox-container");
        const carousel = document.getElementById("vroomSlides");
        
        // Zoom buttons
        const btnZoomIn = document.getElementById("zoom-in");
        const btnZoomOut = document.getElementById("zoom-out");
        const btnZoomReset = document.getElementById("zoom-reset");

        if (!lightbox || !lightboxImg || !carousel) return;

        let scale = 1;
        let translateX = 0;
        let translateY = 0;
        let isDragging = false;
        let startX, startY;

        const updateTransform = (smooth = true) => {
          lightboxImg.style.transition = smooth ? "transform 0.3s cubic-bezier(0.2, 0, 0.2, 1)" : "none";
          lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        };

        const resetZoom = () => {
          scale = 1;
          translateX = 0;
          translateY = 0;
          updateTransform();
        };

        const openLightbox = (src, alt) => {
          lightboxImg.src = src;
          lightboxImg.alt = alt || "Project screenshot";
          lightbox.setAttribute("aria-hidden", "false");
          document.body.classList.add("lightbox-open");
          resetZoom();
        };

        const closeLightbox = () => {
          lightbox.setAttribute("aria-hidden", "true");
          document.body.classList.remove("lightbox-open");
          setTimeout(() => {
            if (lightbox.getAttribute("aria-hidden") === "true") {
              lightboxImg.src = "";
              resetZoom();
            }
          }, 400);
        };

        // Event: Click on carousel images
        carousel.addEventListener("click", (e) => {
          const img = e.target.closest("img");
          if (img) {
            openLightbox(img.src, img.alt);
          }
        });

        // Event: Close
        lightboxClose.addEventListener("click", closeLightbox);
        lightbox.addEventListener("click", (e) => {
          if (e.target === lightbox || e.target === container) {
            closeLightbox();
          }
        });

        // Zoom Logic
        const zoom = (delta) => {
          const newScale = Math.min(Math.max(scale + delta, 1), 5);
          if (newScale === scale) return;
          scale = newScale;
          if (scale === 1) {
            translateX = 0;
            translateY = 0;
          }
          updateTransform();
        };

        btnZoomIn.addEventListener("click", () => zoom(0.5));
        btnZoomOut.addEventListener("click", () => zoom(-0.5));
        btnZoomReset.addEventListener("click", resetZoom);

        // Mouse Wheel Zoom
        lightbox.addEventListener("wheel", (e) => {
          e.preventDefault();
          const delta = e.deltaY < 0 ? 0.2 : -0.2;
          zoom(delta);
        }, { passive: false });

        // Pan Logic (Drag)
        const startDrag = (e) => {
          if (scale <= 1) return;
          isDragging = true;
          startX = (e.pageX || e.touches[0].pageX) - translateX;
          startY = (e.pageY || e.touches[0].pageY) - translateY;
          lightboxImg.style.cursor = "grabbing";
        };

        const moveDrag = (e) => {
          if (!isDragging) return;
          e.preventDefault();
          const x = (e.pageX || e.touches[0].pageX) - startX;
          const y = (e.pageY || e.touches[0].pageY) - startY;
          translateX = x;
          translateY = y;
          updateTransform(false); // No transition while dragging
        };

        const stopDrag = () => {
          isDragging = false;
          lightboxImg.style.cursor = scale > 1 ? "grab" : "default";
        };

        container.addEventListener("mousedown", startDrag);
        window.addEventListener("mousemove", moveDrag);
        window.addEventListener("mouseup", stopDrag);

        // Touch support for panning
        container.addEventListener("touchstart", startDrag, { passive: false });
        window.addEventListener("touchmove", moveDrag, { passive: false });
        window.addEventListener("touchend", stopDrag);

        // Keyboard Escape
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && lightbox.getAttribute("aria-hidden") === "false") {
            closeLightbox();
          }
        });
      })();