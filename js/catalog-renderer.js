/**
 * TRESA Atelier — Catalog Renderer & Dynamic Carousel Engine
 * 
 * Responsibilities:
 * 1. Read centralized product data from window.TRESA_PRODUCTS.
 * 2. Render Homepage Bestsellers split-screen layout dynamically.
 * 3. Render Products listing category grids dynamically.
 * 4. Bind interactive touch/swipe and keyboard-accessible carousels.
 */

(function(global) {
  'use strict';

  var TresaCatalog = {};

  /**
   * Helper: Build clean carousel HTML for an array of images.
   */
  TresaCatalog.buildCarouselHTML = function(media) {
    var images = (media && media.images && media.images.length) ? media.images : [];
    if (!images.length) {
      return '<div class="product-carousel"><div class="product-carousel-slide active"><div class="p-fallback-box">Image coming soon</div></div></div>';
    }

    var slidesHTML = images.map(function(img, idx) {
      var src = typeof img === 'string' ? img : img.src;
      var alt = (typeof img === 'object' && img.alt) ? img.alt : 'TRESA Atelier piece';
      var loading = idx === 0 ? 'eager' : 'lazy';
      var activeClass = idx === 0 ? ' active' : '';
      return (
        '<div class="product-carousel-slide' + activeClass + '" data-slide-index="' + idx + '">' +
          '<img src="' + src + '" alt="' + alt + '" loading="' + loading + '" />' +
        '</div>'
      );
    }).join('');

    var dotsHTML = images.map(function(_, idx) {
      var activeClass = idx === 0 ? ' active' : '';
      return '<span class="p-carousel-dot' + activeClass + '" data-index="' + idx + '" aria-label="Go to slide ' + (idx + 1) + '"></span>';
    }).join('');

    var showControls = images.length > 1;

    return (
      '<div class="product-carousel" data-carousel>' +
        '<div class="product-carousel-track">' +
          slidesHTML +
        '</div>' +
        (showControls ?
          '<button type="button" class="p-carousel-btn prev" aria-label="Previous image">' +
            '<svg viewBox="0 0 24 24"><polyline points="15,18 9,12 15,6"></polyline></svg>' +
          '</button>' +
          '<button type="button" class="p-carousel-btn next" aria-label="Next image">' +
            '<svg viewBox="0 0 24 24"><polyline points="9,6 15,12 9,18"></polyline></svg>' +
          '</button>' +
          '<div class="p-carousel-dots">' +
            dotsHTML +
          '</div>' : '') +
      '</div>'
    );
  };

  /**
   * Render Bestsellers section (alternating split-screen) on Homepage.
   */
  TresaCatalog.renderBestsellers = function(containerSelector, productsList) {
    var container = typeof containerSelector === 'string' 
      ? document.querySelector(containerSelector) 
      : containerSelector;
    if (!container) return;

    var products = productsList || global.TRESA_PRODUCTS || [];
    var bestsellers = products.filter(function(p) { return p.isBestseller; });
    bestsellers.sort(function(a, b) { 
      return (a.bestsellerOrder || 99) - (b.bestsellerOrder || 99); 
    });

    var rowsHTML = bestsellers.map(function(item) {
      var carouselHTML = TresaCatalog.buildCarouselHTML(item.media);
      var badge = item.editionBadge ? '<span class="bs-badge">' + item.editionBadge + '</span>' : '';
      var tagline = item.tagline ? '<span class="bs-tag">' + item.tagline + '</span>' : '';
      var desc = item.fullDescription || item.shortDescription || '';
      var priceDisplay = (item.price && item.price.display) ? item.price.display : '₹0';
      var detailsUrl = (item.links && item.links.detailsUrl) ? item.links.detailsUrl : 'products.html';

      return (
        '<article class="bs-row" data-product-id="' + item.id + '">' +
          '<div class="bs-media">' +
            '<div class="bs-image-box">' +
              badge +
              carouselHTML +
            '</div>' +
          '</div>' +
          '<div class="bs-details">' +
            tagline +
            '<h3 class="bs-title">' + item.name + '</h3>' +
            '<p class="bs-desc">' + desc + '</p>' +
            '<div class="bs-meta-row">' +
              '<div class="bs-price-wrap">' +
                '<span class="bs-price-label">Price</span>' +
                '<span class="bs-price">' + priceDisplay + '</span>' +
              '</div>' +
              '<a href="' + detailsUrl + '" class="bs-purchase-btn" aria-label="Purchase ' + item.name + '">' +
                '<span>Purchase</span>' +
                '<svg viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
              '</a>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join('');

    container.innerHTML = rowsHTML;

    // Trigger intersection observer for smooth entry fade
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) { 
          if (e.isIntersecting) { 
            e.target.classList.add('visible'); 
            observer.unobserve(e.target); 
          } 
        });
      }, { threshold: 0.12 });
      container.querySelectorAll('.bs-row').forEach(function(r) { observer.observe(r); });
    } else {
      container.querySelectorAll('.bs-row').forEach(function(r) { r.classList.add('visible'); });
    }
  };

  /**
   * Render category grids on Products listing page.
   */
  TresaCatalog.renderProductsCatalog = function(productsList) {
    var products = productsList || global.TRESA_PRODUCTS || [];

    var categoryMap = {
      cutlery: document.getElementById('gridCutlery'),
      plates: document.getElementById('gridPlates'),
      placemats: document.getElementById('gridPlacemats')
    };

    Object.keys(categoryMap).forEach(function(catKey) {
      var gridEl = categoryMap[catKey];
      if (!gridEl) return;

      var items = products.filter(function(p) { return p.category === catKey; });
      var cardsHTML = items.map(function(item) {
        var carouselHTML = TresaCatalog.buildCarouselHTML(item.media);
        var priceDisplay = (item.price && item.price.display) ? item.price.display : '₹0';
        var buyUrl = (item.links && item.links.externalBuyUrl) ? item.links.externalBuyUrl : '#';

        return (
          '<article class="product-card" data-product-id="' + item.id + '">' +
            '<div class="product-image">' +
              carouselHTML +
            '</div>' +
            '<div class="product-info">' +
              '<h3 class="product-title">' + item.name + '</h3>' +
              '<p class="product-desc">' + (item.shortDescription || '') + '</p>' +
              '<div class="product-footer">' +
                '<div class="product-price-wrap">' +
                  '<span class="product-price-label">Price</span>' +
                  '<span class="product-price">' + priceDisplay + '</span>' +
                '</div>' +
                '<a href="' + buyUrl + '" class="product-btn">View Details →</a>' +
              '</div>' +
            '</div>' +
          '</article>'
        );
      }).join('');

      gridEl.innerHTML = cardsHTML;
    });

    // Trigger intersection observer for product card entrances
    if ('IntersectionObserver' in window) {
      var cardObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            cardObserver.unobserve(e.target);
          }
        });
      }, { threshold: 0.08 });

      document.querySelectorAll('.product-card').forEach(function(c, i) {
        c.style.transitionDelay = (i % 3 * 0.08) + 's';
        cardObserver.observe(c);
      });
    } else {
      document.querySelectorAll('.product-card').forEach(function(c) { c.classList.add('visible'); });
    }
  };

  /**
   * Bind interactive carousel controls (prev/next, dots, touch swipe) across all carousels.
   */
  TresaCatalog.initProductCarousels = function(rootElement) {
    var root = rootElement || document;
    var carousels = root.querySelectorAll('[data-carousel]');

    carousels.forEach(function(carousel) {
      var track = carousel.querySelector('.product-carousel-track');
      var slides = carousel.querySelectorAll('.product-carousel-slide');
      var dots = carousel.querySelectorAll('.p-carousel-dot');
      var prevBtn = carousel.querySelector('.p-carousel-btn.prev');
      var nextBtn = carousel.querySelector('.p-carousel-btn.next');

      if (!track || slides.length <= 1) return;

      var currentIndex = 0;
      var total = slides.length;

      function goTo(newIndex) {
        currentIndex = (newIndex + total) % total;
        track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';

        slides.forEach(function(slide, idx) {
          slide.classList.toggle('active', idx === currentIndex);
          // Preload adjacent images
          if (Math.abs(idx - currentIndex) <= 1 || (currentIndex === 0 && idx === total - 1) || (currentIndex === total - 1 && idx === 0)) {
            var lazyImg = slide.querySelector('img[loading="lazy"]');
            if (lazyImg) lazyImg.loading = 'eager';
          }
        });

        dots.forEach(function(dot, idx) {
          dot.classList.toggle('active', idx === currentIndex);
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          goTo(currentIndex - 1);
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          goTo(currentIndex + 1);
        });
      }

      dots.forEach(function(dot, idx) {
        dot.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          goTo(idx);
        });
      });

      // Mobile Touch & Swipe Handling
      var startX = 0;
      var currentX = 0;
      var isSwiping = false;

      carousel.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        currentX = startX;
        isSwiping = true;
      }, { passive: true });

      carousel.addEventListener('touchmove', function(e) {
        if (!isSwiping) return;
        currentX = e.touches[0].clientX;
      }, { passive: true });

      carousel.addEventListener('touchend', function() {
        if (!isSwiping) return;
        isSwiping = false;
        var diff = startX - currentX;
        if (Math.abs(diff) > 40) {
          goTo(diff > 0 ? currentIndex + 1 : currentIndex - 1);
        }
      }, { passive: true });
    });
  };

  // Expose to global window
  global.TresaCatalog = TresaCatalog;

})(typeof window !== 'undefined' ? window : this);
