(function () {
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      navLinks.classList.toggle("is-open");
    });
  }

  const slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
  const dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
  const prev = document.querySelector("[data-hero-prev]");
  const next = document.querySelector("[data-hero-next]");
  let heroIndex = 0;
  let heroTimer;

  function showHero(index) {
    if (!slides.length) return;
    heroIndex = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      const active = i === heroIndex;
      slide.classList.toggle("is-active", active);
      const video = slide.querySelector("video");
      if (video) {
        if (active) {
          video.play().catch(function () {});
        } else {
          video.pause();
        }
      }
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle("is-active", i === heroIndex);
    });
  }

  function startHero() {
    stopHero();
    heroTimer = window.setInterval(function () {
      showHero(heroIndex + 1);
    }, 7000);
  }

  function stopHero() {
    if (heroTimer) window.clearInterval(heroTimer);
  }

  if (slides.length) {
    showHero(0);
    startHero();
    if (prev) prev.addEventListener("click", function () {
      showHero(heroIndex - 1);
      startHero();
    });
    if (next) next.addEventListener("click", function () {
      showHero(heroIndex + 1);
      startHero();
    });
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        showHero(i);
        startHero();
      });
    });
  }

  const textSlides = Array.prototype.slice.call(document.querySelectorAll(".text-slide"));
  let textIndex = 0;
  function showText(index) {
    if (!textSlides.length) return;
    textIndex = (index + textSlides.length) % textSlides.length;
    textSlides.forEach(function (slide, i) {
      slide.classList.toggle("is-active", i === textIndex);
    });
  }
  if (textSlides.length) {
    showText(0);
    window.setInterval(function () {
      textSlides.forEach(function (slide) {
        slide.classList.remove("is-active");
      });
      window.setTimeout(function () {
        showText(textIndex + 1);
      }, 450);
    }, 4000);
  }

  const form = document.querySelector(".contact-form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const note = form.querySelector(".form-note");
      if (note) note.textContent = "Message composed. This template does not send mail.";
    });
  }
})();
