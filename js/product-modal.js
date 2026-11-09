/**
 * TRESA Atelier — Product Detail Modal
 *
 * Opens a full product popup when a product card or homepage bestseller row
 * is clicked. Reads all detail data from window.TRESA_PRODUCTS.
 */
(function(global) {
  'use strict';

  var modal = null;
  var panel = null;
  var mediaEl = null;
  var categoryEl = null;
  var titleEl = null;
  var taglineEl = null;
  var descEl = null;
  var specsEl = null;
  var footerEl = null;
  var closeBtn = null;

  var lastFocused = null;
  var lastTriggerCard = null;
  var openAnimation = null;
  var closeAnimation = null;
  var previousBodyOverflow = '';
  var suppressClickUntil = 0;
  var touchStartX = 0;
  var touchStartY = 0;
  var touchMoved = false;

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function getProducts() {
    return Array.isArray(global.TRESA_PRODUCTS) ? global.TRESA_PRODUCTS : [];
  }

  function buildModal() {
    modal = document.createElement('div');
    modal.id = 'productDetailModal';
    modal.className = 'product-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML =
      '<div class="product-modal-panel" role="dialog" aria-modal="true" aria-labelledby="productModalTitle">' +
        '<button type="button" class="product-modal-close" data-product-modal-close aria-label="Close product details">&times;</button>' +
        '<div class="product-modal-media" id="productModalMedia"></div>' +
        '<div class="product-modal-body">' +
          '<span class="product-modal-category" id="productModalCategory"></span>' +
          '<h2 class="product-modal-title" id="productModalTitle"></h2>' +
          '<p class="product-modal-tagline" id="productModalTagline"></p>' +
          '<p class="product-modal-desc" id="productModalDesc"></p>' +
          '<dl class="product-modal-specs" id="productModalSpecs"></dl>' +
          '<div class="product-modal-footer" id="productModalFooter"></div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    panel = modal.querySelector('.product-modal-panel');
    mediaEl = modal.querySelector('#productModalMedia');
    categoryEl = modal.querySelector('#productModalCategory');
    titleEl = modal.querySelector('#productModalTitle');
    taglineEl = modal.querySelector('#productModalTagline');
    descEl = modal.querySelector('#productModalDesc');
    specsEl = modal.querySelector('#productModalSpecs');
    footerEl = modal.querySelector('#productModalFooter');
    closeBtn = modal.querySelector('.product-modal-close');
  }

  function canAnimate() {
    return !!(
      global.Element &&
      Element.prototype.animate &&
      !(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches)
    );
  }

  function stopAnimations() {
    if (openAnimation) {
      openAnimation.cancel();
      openAnimation = null;
    }
    if (closeAnimation) {
      closeAnimation.cancel();
      closeAnimation = null;
    }
  }

  function clearPanelStyles() {
    if (!panel) return;
    panel.style.transition = '';
    panel.style.transform = '';
    panel.style.transformOrigin = '';
    panel.style.opacity = '';
    panel.style.willChange = '';
  }

  function openProductModal(productId, triggerCard) {
    if (!modal) return;

    var product = getProducts().filter(function(item) {
      return item && item.id === productId;
    })[0];

    if (!product) return;

    // Capture the clicked card's position before the body scroll lock can
    // shift the page, so the zoom animation starts exactly where it was.
    var cardRect = (triggerCard && triggerCard.getBoundingClientRect)
      ? triggerCard.getBoundingClientRect()
      : null;

    lastFocused = document.activeElement;
    lastTriggerCard = triggerCard || null;

    // A previous close animation may still be shrinking the panel.
    var wasClosing = !!closeAnimation;
    stopAnimations();
    clearPanelStyles();

    categoryEl.textContent = product.category || '';
    categoryEl.hidden = !product.category;

    titleEl.textContent = product.name || 'Product Details';

    taglineEl.textContent = product.tagline || '';
    taglineEl.hidden = !product.tagline;

    descEl.textContent = product.fullDescription || product.shortDescription || '';
    descEl.hidden = !descEl.textContent;

    var specs = (product.specs || []).filter(function(spec) {
      return spec && String(spec.label || '').trim() && String(spec.value || '').trim();
    });

    specsEl.innerHTML = specs.map(function(spec) {
      return (
        '<div class="product-modal-spec">' +
          '<dt>' + escapeHTML(spec.label) + '</dt>' +
          '<dd>' + escapeHTML(spec.value) + '</dd>' +
        '</div>'
      );
    }).join('');
    specsEl.hidden = specs.length === 0;

    if (global.TresaCatalog && global.TresaCatalog.buildCarouselHTML) {
      mediaEl.innerHTML = global.TresaCatalog.buildCarouselHTML(product.media);
      if (global.TresaCatalog.initProductCarousels) {
        global.TresaCatalog.initProductCarousels(mediaEl);
      }
    } else {
      mediaEl.innerHTML = '';
    }

    var priceDisplay = (product.price && product.price.display) ? product.price.display : '';
    var buyUrl = (global.TresaCatalog && global.TresaCatalog.getBuyUrl)
      ? global.TresaCatalog.getBuyUrl(product)
      : '';

    var footerHTML = '';
    if (priceDisplay) {
      footerHTML +=
        '<div class="product-modal-price-wrap">' +
          '<span class="product-modal-price-label">Price</span>' +
          '<span class="product-modal-price">' + escapeHTML(priceDisplay) + '</span>' +
        '</div>';
    }
    if (buyUrl) {
      footerHTML +=
        '<a class="product-modal-buy" href="' + buyUrl + '" target="_blank" rel="noopener noreferrer">Buy Now</a>';
    }
    footerEl.innerHTML = footerHTML;
    footerEl.hidden = !footerHTML;

    if (!modal.classList.contains('open') && !wasClosing) {
      previousBodyOverflow = document.body.style.overflow;
    }

    var animateOpen = !!(cardRect && panel && canAnimate());

    if (animateOpen) {
      // Disable the CSS transition so it does not fight the WAAPI zoom.
      panel.style.transition = 'none';
      panel.style.transformOrigin = 'top left';
      panel.style.transform = 'none';
      panel.style.opacity = '1';
      panel.style.willChange = 'transform, opacity';
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (animateOpen) {
      var panelRect = panel.getBoundingClientRect();

      if (panelRect.width > 0 && panelRect.height > 0) {
        var translateX = cardRect.left - panelRect.left;
        var translateY = cardRect.top - panelRect.top;
        var scaleX = cardRect.width / panelRect.width;
        var scaleY = cardRect.height / panelRect.height;
        var startTransform =
          'translate(' + translateX + 'px, ' + translateY + 'px) ' +
          'scale(' + scaleX + ', ' + scaleY + ')';

        openAnimation = panel.animate(
          [
            { transform: startTransform, opacity: 0, offset: 0 },
            { opacity: 0, offset: 0.18 },
            { opacity: 1, offset: 0.55 },
            { transform: 'translate(0, 0) scale(1, 1)', opacity: 1, offset: 1 }
          ],
          {
            duration: 700,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'both'
          }
        );

        openAnimation.onfinish = function() {
          var finished = openAnimation;
          openAnimation = null;
          clearPanelStyles();
          if (finished) {
            finished.cancel();
          }
        };
      } else {
        clearPanelStyles();
      }
    }

    var focusClose = function() {
      if (modal.classList.contains('open')) closeBtn.focus();
    };
    if (global.requestAnimationFrame) {
      global.requestAnimationFrame(focusClose);
    } else {
      focusClose();
    }
  }

  function closeProductModal() {
    if (!modal || !modal.classList.contains('open')) return;

    var cardRect = (lastTriggerCard && document.contains(lastTriggerCard))
      ? lastTriggerCard.getBoundingClientRect()
      : null;

    stopAnimations();

    var animateClose = !!(cardRect && panel && canAnimate());
    var panelRect = null;

    if (animateClose) {
      // Freeze the panel at its fully open state before measuring.
      panel.style.transition = 'none';
      panel.style.transformOrigin = 'top left';
      panel.style.transform = 'none';
      panel.style.opacity = '1';
      panel.style.willChange = 'transform, opacity';
      panelRect = panel.getBoundingClientRect();
      if (!panelRect.width || !panelRect.height) animateClose = false;
    }

    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');

    var finishClose = function() {
      closeAnimation = null;
      clearPanelStyles();
      document.body.style.overflow = previousBodyOverflow;

      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    };

    if (animateClose) {
      var endTransform =
        'translate(' + (cardRect.left - panelRect.left) + 'px, ' +
        (cardRect.top - panelRect.top) + 'px) ' +
        'scale(' + (cardRect.width / panelRect.width) + ', ' +
        (cardRect.height / panelRect.height) + ')';

      closeAnimation = panel.animate(
        [
          { transform: 'translate(0, 0) scale(1, 1)' },
          { transform: endTransform }
        ],
        {
          duration: 280,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'both'
        }
      );

      closeAnimation.onfinish = function() {
        var finished = closeAnimation;
        closeAnimation = null;
        finishClose();
        if (finished) {
          finished.cancel();
        }
      };
    } else {
      finishClose();
    }
  }

  function findCard(element) {
    return element.closest('.product-card[data-product-id], .bs-row[data-product-id]');
  }

  function bindEvents() {
    modal.addEventListener('click', function(event) {
      if (event.target === modal || event.target.closest('[data-product-modal-close]')) {
        closeProductModal();
      }
    });

    document.addEventListener('click', function(event) {
      if (Date.now() < suppressClickUntil) return;

      // Details buttons/links without an external buy target open the modal.
      var detailsControl = event.target.closest('.product-btn, .bs-purchase-btn');
      if (detailsControl && !detailsControl.hasAttribute('target')) {
        var controlCard = findCard(detailsControl);
        if (controlCard) {
          event.preventDefault();
          openProductModal(controlCard.getAttribute('data-product-id'), controlCard);
          return;
        }
      }

      // Never hijack links, buttons, or carousel controls.
      if (event.target.closest('a, button, .p-carousel-btn, .p-carousel-dot')) return;

      var card = findCard(event.target);
      if (card) {
        openProductModal(card.getAttribute('data-product-id'), card);
      }
    });

    document.addEventListener('keydown', function(event) {
      if (!modal.classList.contains('open')) return;

      if (event.key === 'Escape') {
        closeProductModal();
        return;
      }

      if (event.key === 'Tab') {
        var focusable = modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;

        var first = focusable[0];
        var last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    document.addEventListener('touchstart', function(event) {
      if (event.touches.length !== 1) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      touchMoved = false;
    }, { passive: true });

    document.addEventListener('touchmove', function(event) {
      if (event.touches.length !== 1) return;
      var deltaX = event.touches[0].clientX - touchStartX;
      var deltaY = event.touches[0].clientY - touchStartY;
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        touchMoved = true;
      }
    }, { passive: true });

    document.addEventListener('touchend', function() {
      if (touchMoved) {
        suppressClickUntil = Date.now() + 400;
      }
      touchMoved = false;
    }, { passive: true });
  }

  function init() {
    if (!document.body || !global.TresaCatalog) return;
    buildModal();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
