"use strict";

// Expose scrollToContent globally for the inline onclick handler
window.scrollToContent = function () {
  const firstSection = document.querySelector("section");
  if (firstSection) {
    firstSection.scrollIntoView({ behavior: "smooth" });
  }
};

document.addEventListener("DOMContentLoaded", function () {
  // Moving tech icons
  const movingIcons = document.getElementById("movingIcons");
  const icons = [
    "fa-microchip",
    "fa-wifi",
    "fa-robot",
    "fa-server",
    "fa-cloud",
    "fa-satellite",
    "fa-mobile-alt",
    "fa-code",
  ];

  if (movingIcons) {
    for (let i = 0; i < 20; i++) {
      const icon = document.createElement("i");
      icon.className = `tech-icon fas ${
        icons[Math.floor(Math.random() * icons.length)]
      }`;
      icon.style.left = `${Math.random() * 100}%`;
      icon.style.top = `${Math.random() * 100}%`;
      icon.style.animationDuration = `${10 + Math.random() * 20}s`;
      icon.style.animationDelay = `${Math.random() * 5}s`;
      movingIcons.appendChild(icon);
    }
  }

  // Typing effect
  const typingText = document.querySelector(".typing-text");
  const phrases = [
    "Full Stack Developer",
    "Laravel & PHP Developer",
    "Software Engineer",
    "Wordpress Developer"
  ];
  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let isEnd = false;

  function type() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      typingText.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typingText.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
      isEnd = true;
      setTimeout(() => {
        isDeleting = true;
        type();
      }, 2000);
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      setTimeout(type, 500);
    } else {
      const speed = isDeleting ? 50 : 100;
      setTimeout(type, isEnd ? speed * 2 : speed);
      isEnd = false;
    }
  }

  if (typingText) {
    setTimeout(type, 1000);
  }

  // Scroll animation for sections
  const sections = document.querySelectorAll("section");

  function checkScroll() {
    sections.forEach((section) => {
      const sectionTop = section.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;

      if (sectionTop < windowHeight * 0.75) {
        section.classList.add("visible");
      }
    });
  }

  window.addEventListener("scroll", checkScroll);
  checkScroll(); // Check on load
});

function scrollCertifications(direction) {
  const container = document.querySelector(".certifications-container");
  const scrollAmount = 320; // Adjust this value based on card width + gap
  container.scrollBy({
    left: direction * scrollAmount,
    behavior: "smooth",
  });
}

// Optional: Auto-scroll for touch devices
let isDown = false;
let startX;
let scrollLeft;
const certificationsContainer = document.querySelector(
  ".certifications-container"
);

certificationsContainer.addEventListener("mousedown", (e) => {
  isDown = true;
  startX = e.pageX - certificationsContainer.offsetLeft;
  scrollLeft = certificationsContainer.scrollLeft;
});

certificationsContainer.addEventListener("mouseleave", () => {
  isDown = false;
});

certificationsContainer.addEventListener("mouseup", () => {
  isDown = false;
});

certificationsContainer.addEventListener("mousemove", (e) => {
  if (!isDown) return;
  e.preventDefault();
  const x = e.pageX - certificationsContainer.offsetLeft;
  const walk = (x - startX) * 2;
  certificationsContainer.scrollLeft = scrollLeft - walk;
});
// active navbar
// js/script.js
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".navbar");
  const navLinksContainer = document.getElementById("navLinks");
  const hamburger = document.getElementById("hamburger");

  // كل روابط الناف اللي بتشير لأقسام الصفحة
  const navLinks = Array.from(
    navLinksContainer.querySelectorAll('a[href^="#"]')
  );

  // الأقسام الموجودة فعلياً في الصفحة (بالترتيب العمودي)
  let sections = navLinks
    .map((a) => {
      const sel = a.getAttribute("href");
      if (!sel || !sel.startsWith("#")) return null;
      return document.querySelector(sel);
    })
    .filter(Boolean);

  // فتح/إغلاق قائمة الموبايل
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      navLinksContainer.classList.toggle("open");
      hamburger.classList.toggle("open");
    });
    navLinks.forEach((a) =>
      a.addEventListener("click", () => {
        navLinksContainer.classList.remove("open");
        hamburger.classList.remove("open");
      })
    );
  }

  const getNavHeight = () => (nav ? nav.offsetHeight : 0);

  // سكرول سلس عند الضغط على الروابط
  navLinks.forEach((a) => {
    a.addEventListener("click", (e) => {
      const hash = a.getAttribute("href");
      if (!hash || !hash.startsWith("#")) return;
      const target = document.querySelector(hash);
      if (!target) return;

      e.preventDefault();
      const top =
        target.getBoundingClientRect().top +
        window.scrollY -
        getNavHeight() -
        8;
      window.scrollTo({ top, behavior: "smooth" });

      // حدّث الـactive مباشرة
      setActive(hash.slice(1));
      history.replaceState(null, "", hash);
    });
  });

  // تفعيل رابط معيّن
  const setActive = (id) => {
    navLinks.forEach((link) => {
      const match = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("active", match);
      if (match) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  };

  // حساب القسم الحالي بناءً على موضع السّكرول
  let ticking = false;
  const updateActiveByScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      // نقطة مرجعية: أعلى الناف + هامش صغير
      const probe = window.scrollY + getNavHeight() + 80;

      // أحياناً ارتفاعات الأقسام تتغير بعد تحميل صور -> أعيدي فرزهم حسب الموضع
      sections = sections
        .filter((s) => document.body.contains(s))
        .sort((a, b) => a.offsetTop - b.offsetTop);

      // اختاري "آخر" قسم بدايته <= نقطة probe
      let current = sections[0];
      for (const sec of sections) {
        if (sec.offsetTop <= probe) current = sec;
        else break;
      }

      // لو قربنا من آخر الصفحة، فعّلي آخر قسم (يتفادى مشكلة الأقسام الطويلة مثل projects)
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (nearBottom) current = sections[sections.length - 1];

      if (current && current.id) setActive(current.id);
      ticking = false;
    });
  };

  // استماع لأحداث السّكرول/الريسايز/بعد تحميل الصور
  window.addEventListener("scroll", updateActiveByScroll, { passive: true });
  window.addEventListener("resize", updateActiveByScroll);
  window.addEventListener("load", updateActiveByScroll);

  // ملاحظة: صور كبيرة تغيّر الارتفاعات بعد التحميل
  const imgs = Array.from(document.images || []);
  let pending = imgs.length;
  if (pending) {
    imgs.forEach((img) => {
      if (img.complete) {
        if (--pending === 0) updateActiveByScroll();
      } else {
        img.addEventListener("load", () => {
          if (--pending === 0) updateActiveByScroll();
        });
        img.addEventListener("error", () => {
          if (--pending === 0) updateActiveByScroll();
        });
      }
    });
  } else {
    updateActiveByScroll();
  }

  // زر السهم بالهيدر
  window.scrollToContent = () => {
    const first = document.querySelector("#about");
    if (first) {
      const top =
        first.getBoundingClientRect().top + window.scrollY - getNavHeight() - 8;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };
});
