/**
 * Bakery Puebla — Módulo principal de la tienda.
 *
 * Gestiona el catálogo de productos, carrito de compras, favoritos,
 * checkout simulado, filtros y validación de formularios.
 * Los datos provienen de BAKERY_DATA (mock/data.js).
 * Persiste carrito y favoritos en localStorage.
 *
 * @module app
 */
(function () {
  'use strict';

  /** @param {string} id - ID del elemento. @returns {HTMLElement|null} */
  function $(id) { return document.getElementById(id); }

  /** @param {string} sel - Selector CSS. @returns {NodeList} */
  function $$(sel) { return document.querySelectorAll(sel); }

  /**
   * Estado global de la aplicación.
   * Se hidrata desde localStorage en la carga inicial.
   *
   * @type {{ cart: Array, favorites: number[], activeCategory: string, searchQuery: string, priceRange: string }}
   */
  var state = {
    cart: JSON.parse(localStorage.getItem('bakery_cart') || '[]'),
    favorites: JSON.parse(localStorage.getItem('bakery_favorites') || '[]'),
    activeCategory: 'all',
    searchQuery: '',
    priceRange: 'all'
  };

  /**
   * Reglas de validación del formulario de pedido.
   * Cada entrada mapea un campo del DOM a su error y función de validación.
   *
   * @type {Array<{ id: string, errorId: string, msg: string, validate: function(string): boolean }>}
   */
  var FORM_FIELDS = [
    { id: 'inputNombre',   errorId: 'error-nombre',   msg: 'El nombre es requerido (mín. 2 caracteres)',  validate: function (v) { return v.length >= 2; } },
    { id: 'inputApellido', errorId: 'error-apellido',  msg: 'El apellido es requerido (mín. 2 caracteres)', validate: function (v) { return v.length >= 2; } },
    { id: 'inputTelefono', errorId: 'error-telefono',  msg: 'Ingresa un teléfono válido de 10 dígitos',   validate: function (v) { return /^\d{10}$/.test(v); } },
    { id: 'inputEmail',    errorId: 'error-email',     msg: 'Ingresa un email válido',                    validate: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); } },
    { id: 'inputSabor',    errorId: 'error-sabor',     msg: 'Selecciona un sabor',                        validate: function (v) { return v !== ''; } },
    { id: 'inputAdorno',   errorId: 'error-adorno',    msg: 'Selecciona un adorno',                       validate: function (v) { return v !== ''; } }
  ];


  // =============================================
  //  UTILIDADES
  // =============================================

  /**
   * Busca un producto por ID en el catálogo mock.
   *
   * @param {number} id - ID del producto.
   * @returns {Object|null} Producto encontrado o null.
   */
  function findProduct(id) {
    for (var i = 0; i < BAKERY_DATA.products.length; i++) {
      if (BAKERY_DATA.products[i].id === id) return BAKERY_DATA.products[i];
    }
    return null;
  }

  /**
   * Obtiene el nombre legible de una categoría por su ID.
   *
   * @param {string} categoryId - ID de la categoría (ej: "pasteles").
   * @returns {string} Nombre de la categoría o cadena vacía.
   */
  function getCategoryLabel(categoryId) {
    for (var i = 0; i < BAKERY_DATA.categories.length; i++) {
      if (BAKERY_DATA.categories[i].id === categoryId) return BAKERY_DATA.categories[i].name;
    }
    return '';
  }

  /**
   * Genera el HTML de estrellas de rating (5 estrellas, llenas o vacías).
   *
   * @param {number} rating - Rating numérico (ej: 4.7 → 4 estrellas llenas).
   * @returns {string} HTML con íconos de estrella.
   */
  function renderStars(rating) {
    var full = Math.floor(rating);
    var html = '';
    for (var i = 0; i < 5; i++) {
      html += '<i class="fa ' + (i < full ? 'fa-star' : 'fa-star-o') + '"></i>';
    }
    return html;
  }

  /**
   * Formatea un número como precio en pesos mexicanos.
   *
   * @param {number} n - Cantidad.
   * @returns {string} Precio formateado (ej: "$350.00").
   */
  function formatPrice(n) {
    return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /**
   * Escapa texto para prevenir XSS al insertarlo como HTML.
   *
   * @param {string} str - Texto a escapar.
   * @returns {string} Texto seguro para innerHTML.
   */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Escapa texto para uso seguro dentro de atributos HTML.
   *
   * @param {string} str - Texto a escapar.
   * @returns {string} Texto seguro para atributos.
   */
  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * Muestra u oculta un badge numérico según el conteo.
   *
   * @param {HTMLElement} badgeEl - Elemento del badge.
   * @param {number} count - Cantidad a mostrar.
   */
  function showBadge(badgeEl, count) {
    badgeEl.textContent = count;
    badgeEl.style.display = count > 0 ? 'flex' : 'none';
  }


  // =============================================
  //  INICIALIZACIÓN
  // =============================================

  /**
   * Punto de entrada de la aplicación.
   *
   * Flujo:
   * 1. Registra event listeners (incluyendo delegación).
   * 2. Activa animaciones de scroll.
   * 3. Simula carga (600ms) y renderiza todas las secciones.
   */
  function init() {
    bindEvents();
    initNavScroll();
    initScrollReveal();

    setTimeout(function () {
      renderStats();
      renderFeatured();
      renderCategories();
      renderProducts();
      renderTestimonials();
      populateFormSelects();
      updateCartBadge();
      updateFavoritesBadge();
      $('current-year').textContent = new Date().getFullYear();
    }, 600);
  }


  // =============================================
  //  RENDER: ESTADÍSTICAS
  // =============================================

  /**
   * Renderiza la barra de estadísticas del sitio.
   * Los valores se animan con contadores al entrar al viewport.
   */
  function renderStats() {
    var html = '';
    BAKERY_DATA.stats.forEach(function (stat) {
      html +=
        '<div class="col-6 col-md-3"><div class="stat-item">' +
          '<div class="stat-icon"><i class="fa ' + stat.icon + '"></i></div>' +
          '<div class="stat-value" data-target="' + stat.value + '">0</div>' +
          '<div class="stat-label">' + stat.label + '</div>' +
        '</div></div>';
    });
    $('stats-container').innerHTML = html;
    initCounters();
  }


  // =============================================
  //  RENDER: PRODUCTOS
  // =============================================

  /** Renderiza la sección de productos destacados (featured: true). */
  function renderFeatured() {
    var featured = BAKERY_DATA.products.filter(function (p) { return p.featured; });
    var html = '';
    featured.forEach(function (p) {
      html += '<div class="col-md-6 col-lg-3">' + createProductCard(p) + '</div>';
    });
    $('featured-container').innerHTML = html;
  }

  /** Renderiza los botones de filtro por categoría, resaltando la activa. */
  function renderCategories() {
    var html = '';
    BAKERY_DATA.categories.forEach(function (cat) {
      html +=
        '<button class="category-btn' + (cat.id === state.activeCategory ? ' active' : '') + '" data-category="' + cat.id + '">' +
          '<i class="fa ' + cat.icon + '"></i> ' + cat.name +
        '</button>';
    });
    $('category-filters').innerHTML = html;
  }

  /**
   * Renderiza el grid de productos aplicando los filtros activos.
   * Muestra empty state si no hay resultados.
   */
  function renderProducts() {
    var filtered = getFilteredProducts();

    if (filtered.length === 0) {
      $('products-container').innerHTML = '';
      $('empty-state').style.display = 'block';
      return;
    }

    $('empty-state').style.display = 'none';
    var html = '';
    filtered.forEach(function (p) {
      html += '<div class="col-sm-6 col-lg-4">' + createProductCard(p) + '</div>';
    });
    $('products-container').innerHTML = html;
  }

  /**
   * Genera el HTML de una card de producto con imagen, rating, precio y acciones.
   *
   * @param {Object} product - Objeto de producto de BAKERY_DATA.
   * @returns {string} HTML de la card.
   */
  function createProductCard(product) {
    var isFav = state.favorites.indexOf(product.id) !== -1;

    return (
      '<div class="product-card" data-id="' + product.id + '">' +
        '<div class="product-card-img">' +
          '<img src="' + escapeAttr(product.image) + '" alt="' + escapeAttr(product.name) + '" loading="lazy">' +
          (product.featured ? '<span class="product-card-badge">Destacado</span>' : '') +
          '<div class="product-card-actions">' +
            '<button class="product-action-btn' + (isFav ? ' is-favorite' : '') + '" data-fav="' + product.id + '" aria-label="Favoritos">' +
              '<i class="fa ' + (isFav ? 'fa-heart' : 'fa-heart-o') + '"></i>' +
            '</button>' +
            '<button class="product-action-btn" data-view="' + product.id + '" aria-label="Ver detalle">' +
              '<i class="fa fa-eye"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="product-card-body">' +
          '<div class="product-card-category">' + escapeHtml(getCategoryLabel(product.category)) + '</div>' +
          '<div class="product-card-name">' + escapeHtml(product.name) + '</div>' +
          '<div class="product-card-rating">' + renderStars(product.rating) + '<span>(' + product.reviews + ')</span></div>' +
          '<div class="product-card-footer">' +
            '<div class="product-card-price">' + formatPrice(product.price) + '</div>' +
            '<button class="btn-add-cart" data-cart="' + product.id + '" aria-label="Agregar al carrito">' +
              '<i class="fa fa-cart-plus"></i> Agregar' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /** Renderiza las cards de testimonios con avatar de iniciales. */
  function renderTestimonials() {
    var html = '';
    BAKERY_DATA.testimonials.forEach(function (t) {
      var initials = t.name.split(' ').map(function (w) { return w[0]; }).join('').substring(0, 2);
      html +=
        '<div class="col-md-6 col-lg-3"><div class="testimonial-card">' +
          '<div class="testimonial-stars">' + renderStars(t.rating) + '</div>' +
          '<p class="testimonial-text">"' + escapeHtml(t.text) + '"</p>' +
          '<div class="testimonial-author">' +
            '<div class="testimonial-avatar">' + escapeHtml(initials) + '</div>' +
            '<div>' +
              '<div class="testimonial-name">' + escapeHtml(t.name) + '</div>' +
              '<div class="testimonial-date">' + escapeHtml(t.date) + '</div>' +
            '</div>' +
          '</div>' +
        '</div></div>';
    });
    $('testimonials-container').innerHTML = html;
  }


  // =============================================
  //  FILTROS DE CATÁLOGO
  // =============================================

  /**
   * Filtra productos según categoría activa, texto de búsqueda y rango de precio.
   *
   * @returns {Object[]} Productos que pasan los 3 filtros.
   */
  function getFilteredProducts() {
    return BAKERY_DATA.products.filter(function (p) {
      if (state.activeCategory !== 'all' && p.category !== state.activeCategory) return false;

      if (state.searchQuery) {
        var q = state.searchQuery.toLowerCase();
        var matchName = p.name.toLowerCase().indexOf(q) !== -1;
        var matchDesc = p.description.toLowerCase().indexOf(q) !== -1;
        if (!matchName && !matchDesc) return false;
      }

      if (state.priceRange !== 'all') {
        var parts = state.priceRange.split('-');
        var min = parseInt(parts[0]);
        var max = parts[1] ? parseInt(parts[1]) : Infinity;
        if (p.price < min || p.price > max) return false;
      }

      return true;
    });
  }

  /** Restablece todos los filtros a sus valores por defecto y re-renderiza. */
  function clearFilters() {
    state.activeCategory = 'all';
    state.searchQuery = '';
    state.priceRange = 'all';
    $('search-input').value = '';
    $('price-filter').value = 'all';
    renderCategories();
    renderProducts();
  }


  // =============================================
  //  CARRITO DE COMPRAS
  // =============================================

  /**
   * Agrega un producto al carrito. Si ya existe, incrementa la cantidad.
   *
   * @param {number} id - ID del producto.
   */
  function addToCart(id) {
    var product = findProduct(id);
    if (!product) return;

    var existing = null;
    for (var i = 0; i < state.cart.length; i++) {
      if (state.cart[i].id === id) { existing = state.cart[i]; break; }
    }

    if (existing) {
      existing.qty++;
    } else {
      state.cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty: 1 });
    }

    saveCart();
    updateCartBadge();
    showToast(product.name + ' agregado al carrito', 'success');
  }

  /**
   * Elimina un producto del carrito por ID.
   *
   * @param {number} id - ID del producto a eliminar.
   */
  function removeFromCart(id) {
    state.cart = state.cart.filter(function (item) { return item.id !== id; });
    saveCart();
    updateCartBadge();
    renderCartItems();
    showToast('Producto eliminado del carrito', 'info');
  }

  /**
   * Modifica la cantidad de un item en el carrito. Mínimo permitido: 1.
   *
   * @param {number} id - ID del producto.
   * @param {number} delta - Cambio (+1 o -1).
   */
  function updateQuantity(id, delta) {
    for (var i = 0; i < state.cart.length; i++) {
      if (state.cart[i].id === id) {
        state.cart[i].qty = Math.max(1, state.cart[i].qty + delta);
        break;
      }
    }
    saveCart();
    updateCartBadge();
    renderCartItems();
  }

  /**
   * Calcula el total sumando precio * cantidad de cada item.
   *
   * @returns {number} Total del carrito.
   */
  function getCartTotal() {
    var total = 0;
    for (var i = 0; i < state.cart.length; i++) {
      total += state.cart[i].price * state.cart[i].qty;
    }
    return total;
  }

  /**
   * Cuenta el total de unidades en el carrito (suma de todas las cantidades).
   *
   * @returns {number} Número total de items.
   */
  function getCartCount() {
    var count = 0;
    for (var i = 0; i < state.cart.length; i++) {
      count += state.cart[i].qty;
    }
    return count;
  }

  /** Actualiza el badge numérico del ícono de carrito en la navbar. */
  function updateCartBadge() {
    showBadge($('cart-count'), getCartCount());
  }

  /** Persiste el carrito actual en localStorage. */
  function saveCart() {
    localStorage.setItem('bakery_cart', JSON.stringify(state.cart));
  }

  /**
   * Renderiza la lista de items dentro del sidebar del carrito.
   * Si el carrito está vacío, muestra un empty state.
   */
  function renderCartItems() {
    var body = $('cart-body');
    var footer = $('cart-footer');

    if (state.cart.length === 0) {
      body.innerHTML =
        '<div class="cart-empty">' +
          '<i class="fa fa-shopping-cart"></i>' +
          '<h4>Tu carrito está vacío</h4>' +
          '<p>Agrega productos desde nuestro catálogo</p>' +
        '</div>';
      footer.style.display = 'none';
      return;
    }

    footer.style.display = 'block';
    var html = '';
    state.cart.forEach(function (item) {
      html +=
        '<div class="cart-item">' +
          '<div class="cart-item-img"><img src="' + escapeAttr(item.image) + '" alt="' + escapeAttr(item.name) + '"></div>' +
          '<div class="cart-item-info">' +
            '<div class="cart-item-name">' + escapeHtml(item.name) + '</div>' +
            '<div class="cart-item-price">' + formatPrice(item.price) + '</div>' +
            '<div class="cart-item-controls">' +
              '<button class="qty-btn" data-action="decrease" data-id="' + item.id + '">−</button>' +
              '<span class="cart-item-qty">' + item.qty + '</span>' +
              '<button class="qty-btn" data-action="increase" data-id="' + item.id + '">+</button>' +
            '</div>' +
          '</div>' +
          '<button class="cart-item-remove" data-id="' + item.id + '"><i class="fa fa-trash-o"></i></button>' +
        '</div>';
    });
    body.innerHTML = html;
    $('cart-total').textContent = formatPrice(getCartTotal());
  }

  /**
   * Abre o cierra el sidebar del carrito con overlay.
   *
   * @param {boolean} [open] - Forzar estado. Si se omite, alterna.
   */
  function toggleCart(open) {
    var sidebar = $('cart-sidebar');
    var overlay = $('cart-overlay');

    if (open === undefined) open = !sidebar.classList.contains('open');

    if (open) {
      renderCartItems();
      sidebar.classList.add('open');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    } else {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }


  // =============================================
  //  FAVORITOS
  // =============================================

  /**
   * Agrega o quita un producto de favoritos y persiste en localStorage.
   * Re-renderiza las secciones afectadas para reflejar el cambio.
   *
   * @param {number} id - ID del producto.
   */
  function toggleFavorite(id) {
    var idx = state.favorites.indexOf(id);
    if (idx !== -1) {
      state.favorites.splice(idx, 1);
      showToast('Eliminado de favoritos', 'info');
    } else {
      state.favorites.push(id);
      showToast('Agregado a favoritos', 'success');
    }
    localStorage.setItem('bakery_favorites', JSON.stringify(state.favorites));
    updateFavoritesBadge();
    renderProducts();
    renderFeatured();
  }

  /** Actualiza el badge numérico del ícono de favoritos en la navbar. */
  function updateFavoritesBadge() {
    showBadge($('favorites-count'), state.favorites.length);
  }


  // =============================================
  //  MODAL: DETALLE DE PRODUCTO
  // =============================================

  /**
   * Abre el modal con la ficha completa de un producto.
   * Muestra imagen, rating, precio, descripción, ingredientes y acciones.
   *
   * @param {number} id - ID del producto.
   */
  function openProductModal(id) {
    var product = findProduct(id);
    if (!product) return;

    var isFav = state.favorites.indexOf(product.id) !== -1;
    var catLabel = getCategoryLabel(product.category);

    var ingredientsHtml = '';
    product.ingredients.forEach(function (ing) {
      ingredientsHtml += '<span class="ingredient-tag">' + escapeHtml(ing) + '</span>';
    });

    $('modal-body').innerHTML =
      '<div class="modal-product">' +
        '<img class="modal-product-img" src="' + escapeAttr(product.image) + '" alt="' + escapeAttr(product.name) + '">' +
        '<div class="modal-product-body">' +
          '<div class="modal-product-category">' + escapeHtml(catLabel) + '</div>' +
          '<h3 class="modal-product-name">' + escapeHtml(product.name) + '</h3>' +
          '<div class="product-card-rating" style="margin-bottom:0.5rem">' +
            renderStars(product.rating) +
            '<span style="color:var(--gray-600);font-size:0.85rem">' + product.rating + ' (' + product.reviews + ' reseñas)</span>' +
          '</div>' +
          '<div class="modal-product-price">' + formatPrice(product.price) + '</div>' +
          '<p class="modal-product-desc">' + escapeHtml(product.description) + '</p>' +
          '<div class="modal-product-meta">' +
            '<div class="modal-meta-item"><i class="fa fa-cutlery"></i> ' + escapeHtml(product.servings) + '</div>' +
            '<div class="modal-meta-item"><i class="fa fa-star"></i> ' + product.rating + ' / 5</div>' +
          '</div>' +
          '<div style="margin-bottom:1rem"><strong style="font-size:0.85rem;text-transform:uppercase;letter-spacing:1px">Ingredientes</strong></div>' +
          '<div class="modal-ingredients">' + ingredientsHtml + '</div>' +
          '<div class="modal-product-actions">' +
            '<button class="btn btn-primary" data-cart="' + product.id + '" style="flex:1"><i class="fa fa-cart-plus"></i> Agregar al Carrito</button>' +
            '<button class="btn ' + (isFav ? 'btn-submit' : 'btn-secondary') + '" data-fav="' + product.id + '" style="border-color:var(--primary);color:' + (isFav ? '#fff' : 'var(--primary)') + '">' +
              '<i class="fa ' + (isFav ? 'fa-heart' : 'fa-heart-o') + '"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    $('product-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  /** Cierra el modal de producto. Restaura scroll solo si no hay otros overlays abiertos. */
  function closeProductModal() {
    $('product-modal').classList.remove('open');
    var cartOpen = $('cart-sidebar').classList.contains('open');
    var checkoutOpen = $('checkout-modal').classList.contains('open');
    if (!cartOpen && !checkoutOpen) document.body.style.overflow = '';
  }


  // =============================================
  //  CHECKOUT SIMULADO
  // =============================================

  /**
   * Abre el modal de checkout con resumen del pedido y formulario de entrega.
   *
   * Flujo:
   * 1. Cierra el sidebar del carrito.
   * 2. Genera resumen de items con subtotales.
   * 3. Muestra formulario de datos de entrega.
   */
  function openCheckout() {
    if (state.cart.length === 0) return;
    toggleCart(false);

    var itemsHtml = '';
    state.cart.forEach(function (item) {
      itemsHtml +=
        '<div class="checkout-item">' +
          '<span class="checkout-item-name">' + escapeHtml(item.name) + ' <span class="checkout-item-detail">x' + item.qty + '</span></span>' +
          '<span>' + formatPrice(item.price * item.qty) + '</span>' +
        '</div>';
    });

    $('checkout-body').innerHTML =
      '<div class="checkout-header"><h3 style="font-weight:700;margin:0">Resumen del Pedido</h3></div>' +
      '<div class="checkout-body">' +
        itemsHtml +
        '<div class="checkout-total"><span>Total</span><span>' + formatPrice(getCartTotal()) + '</span></div>' +
        '<hr>' +
        '<h4 style="font-size:1rem;font-weight:600;margin-bottom:1rem">Datos de Entrega</h4>' +
        '<div class="mb-3"><input type="text" class="form-control" id="checkout-name" placeholder="Nombre completo" style="border-radius:var(--radius-sm)"></div>' +
        '<div class="mb-3"><input type="tel" class="form-control" id="checkout-phone" placeholder="Teléfono" style="border-radius:var(--radius-sm)"></div>' +
        '<div class="mb-3"><input type="text" class="form-control" id="checkout-address" placeholder="Dirección de entrega" style="border-radius:var(--radius-sm)"></div>' +
        '<button class="btn btn-primary w-100" id="btn-confirm-order" style="margin-top:0.5rem"><i class="fa fa-check"></i> Confirmar Pedido</button>' +
      '</div>';

    $('checkout-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Confirma el pedido simulado.
   *
   * Flujo:
   * 1. Valida que los campos de entrega no estén vacíos.
   * 2. Genera un número de pedido aleatorio (BP-XXXXX).
   * 3. Muestra pantalla de confirmación.
   * 4. Vacía el carrito y persiste.
   */
  function confirmOrder() {
    var name = $('checkout-name').value.trim();
    var phone = $('checkout-phone').value.trim();
    var address = $('checkout-address').value.trim();

    if (!name || !phone || !address) {
      showToast('Completa todos los campos de entrega', 'error');
      return;
    }

    var orderNum = 'BP-' + Math.floor(10000 + Math.random() * 90000);

    $('checkout-body').innerHTML =
      '<div class="checkout-success">' +
        '<i class="fa fa-check-circle"></i>' +
        '<h3>¡Pedido Confirmado!</h3>' +
        '<p style="color:var(--gray-600)">Tu pedido ha sido recibido y será procesado pronto.</p>' +
        '<div class="order-number">' + orderNum + '</div>' +
        '<p style="color:var(--gray-600);font-size:0.85rem">Guarda este número para dar seguimiento a tu pedido.</p>' +
        '<button class="btn btn-primary mt-3" id="btn-close-success">Cerrar</button>' +
      '</div>';

    state.cart = [];
    saveCart();
    updateCartBadge();
    showToast('¡Pedido ' + orderNum + ' confirmado!', 'success');
  }

  /** Cierra el modal de checkout y restaura el scroll. */
  function closeCheckout() {
    $('checkout-modal').classList.remove('open');
    document.body.style.overflow = '';
  }


  // =============================================
  //  NOTIFICACIONES TOAST
  // =============================================

  /**
   * Muestra una notificación toast temporal (3 segundos).
   *
   * @param {string} message - Texto del mensaje.
   * @param {'success'|'error'|'info'} [type='success'] - Tipo visual.
   */
  function showToast(message, type) {
    type = type || 'success';
    var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML =
      '<span class="toast-icon ' + type + '"><i class="fa ' + icons[type] + '"></i></span>' +
      '<span class="toast-message">' + escapeHtml(message) + '</span>';

    $('toast-container').appendChild(toast);

    setTimeout(function () {
      toast.classList.add('removing');
      setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    }, 3000);
  }


  // =============================================
  //  VALIDACIÓN DE FORMULARIOS
  // =============================================

  /**
   * Valida el formulario de pedido usando las reglas de FORM_FIELDS.
   * Marca campos inválidos visualmente y muestra mensajes de error.
   *
   * @param {Event} e - Evento submit del formulario.
   */
  function validateOrderForm(e) {
    e.preventDefault();
    var allValid = true;

    FORM_FIELDS.forEach(function (field) {
      var el = $(field.id);
      var errEl = $(field.errorId);
      var val = el.value.trim();
      var isValid = val && field.validate(val);

      el.classList.toggle('is-invalid', !isValid);
      errEl.textContent = field.msg;
      errEl.classList.toggle('visible', !isValid);

      if (!isValid) allValid = false;
    });

    if (allValid) {
      var orderNum = 'BP-' + Math.floor(10000 + Math.random() * 90000);
      showToast('¡Pedido ' + orderNum + ' enviado con éxito!', 'success');
      $('order-form').reset();
    } else {
      showToast('Corrige los campos marcados', 'error');
    }
  }

  /**
   * Valida el formulario de newsletter (solo email).
   *
   * @param {Event} e - Evento submit.
   */
  function validateNewsletter(e) {
    e.preventDefault();
    var input = this.querySelector('input');
    var errEl = $('error-newsletter');
    var val = input.value.trim();
    var isValid = val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

    input.classList.toggle('is-invalid', !isValid);
    errEl.textContent = 'Ingresa un email válido';
    errEl.classList.toggle('visible', !isValid);

    if (isValid) {
      showToast('¡Te has suscrito exitosamente!', 'success');
      input.value = '';
    }
  }

  /** Llena los selects de sabor y adorno desde los datos mock. */
  function populateFormSelects() {
    var saborSelect = $('inputSabor');
    var adornoSelect = $('inputAdorno');

    BAKERY_DATA.flavors.forEach(function (flavor) {
      var opt = document.createElement('option');
      opt.value = flavor;
      opt.textContent = flavor;
      saborSelect.appendChild(opt);
    });

    BAKERY_DATA.decorations.forEach(function (dec) {
      var opt = document.createElement('option');
      opt.value = dec;
      opt.textContent = dec;
      adornoSelect.appendChild(opt);
    });
  }


  // =============================================
  //  ANIMACIONES
  // =============================================

  /**
   * Observa la barra de stats y dispara animación de conteo al ser visible.
   * Usa IntersectionObserver para ejecutarse solo una vez.
   */
  function initCounters() {
    var counters = $$('.stat-value');
    if (counters.length === 0) return;

    var animated = false;
    var observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !animated) {
        animated = true;
        counters.forEach(function (el) {
          animateCounter(el, parseInt(el.dataset.target));
        });
      }
    }, { threshold: 0.5 });

    observer.observe(counters[0].closest('.stats-bar'));
  }

  /**
   * Anima un contador de 0 al valor objetivo con easing cúbico.
   *
   * @param {HTMLElement} el - Elemento que muestra el número.
   * @param {number} target - Valor final.
   */
  function animateCounter(el, target) {
    var duration = 2000;
    var start = null;

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString('es-MX');
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  /** Aplica fade-in animado a elementos con clase .reveal al entrar al viewport. */
  function initScrollReveal() {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    $$('.reveal').forEach(function (el) { observer.observe(el); });
  }

  /** Compacta la navbar al hacer scroll (agrega clase navbar-scrolled > 50px). */
  function initNavScroll() {
    var navbar = $$('.navbar')[0];
    window.addEventListener('scroll', function () {
      navbar.classList.toggle('navbar-scrolled', window.pageYOffset > 50);
    }, { passive: true });
  }


  // =============================================
  //  REGISTRO DE EVENTOS
  // =============================================

  /**
   * Registra todos los event listeners de la aplicación.
   *
   * Flujo:
   * 1. Listeners directos para controles del carrito y modales.
   * 2. Delegación de clicks en document para elementos dinámicos.
   * 3. Búsqueda con debounce (300ms).
   * 4. Validación de formularios.
   * 5. Smooth scroll y tracking de sección activa.
   */
  function bindEvents() {
    $('btn-cart').addEventListener('click', function () { toggleCart(true); });
    $('btn-close-cart').addEventListener('click', function () { toggleCart(false); });
    $('cart-overlay').addEventListener('click', function () { toggleCart(false); });

    $('btn-favorites-nav').addEventListener('click', function () {
      if (state.favorites.length === 0) {
        showToast('Aún no tienes favoritos', 'info');
      } else {
        showToast('Tienes ' + state.favorites.length + ' favorito(s)', 'info');
        document.querySelector('#catalogo').scrollIntoView({ behavior: 'smooth' });
      }
    });

    document.addEventListener('click', handleDelegatedClick);

    $('close-product-modal').addEventListener('click', closeProductModal);
    $('product-modal').addEventListener('click', function (e) { if (e.target === this) closeProductModal(); });
    $('close-checkout').addEventListener('click', closeCheckout);
    $('checkout-modal').addEventListener('click', function (e) { if (e.target === this) closeCheckout(); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeProductModal(); closeCheckout(); toggleCart(false); }
    });

    var searchTimer;
    $('search-input').addEventListener('input', function () {
      var input = this;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        state.searchQuery = input.value.trim();
        renderProducts();
      }, 300);
    });

    $('price-filter').addEventListener('change', function () {
      state.priceRange = this.value;
      renderProducts();
    });

    $('order-form').addEventListener('submit', validateOrderForm);
    $('newsletter-form').addEventListener('submit', validateNewsletter);

    FORM_FIELDS.forEach(function (field) {
      $(field.id).addEventListener('input', function () {
        this.classList.remove('is-invalid');
        $(field.errorId).classList.remove('visible');
      });
    });

    $$('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        if (href === '#') return;
        var target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.pageYOffset - 70;
        window.scrollTo({ top: top, behavior: 'smooth' });

        var collapse = document.querySelector('#menuprincipal.show');
        if (collapse) {
          var bsCollapse = bootstrap.Collapse.getInstance(collapse);
          if (bsCollapse) bsCollapse.hide();
        }
      });
    });

    var sections = $$('section[id]');
    window.addEventListener('scroll', function () {
      var scrollY = window.pageYOffset + 100;
      sections.forEach(function (section) {
        var id = section.getAttribute('id');
        var link = document.querySelector('.nav-link[href="#' + id + '"]');
        if (!link) return;

        var isActive = scrollY >= section.offsetTop && scrollY < section.offsetTop + section.offsetHeight;
        if (isActive) {
          $$('.nav-link').forEach(function (l) { l.classList.remove('active'); });
          link.classList.add('active');
        }
      });
    }, { passive: true });
  }

  /**
   * Maneja clicks delegados para elementos renderizados dinámicamente.
   * Usa data attributes para identificar la acción:
   * - data-cart: agregar al carrito
   * - data-fav: toggle favorito
   * - data-view: abrir modal detalle
   * - data-category: filtrar por categoría
   * - data-action + data-id: controles de cantidad
   *
   * @param {Event} e - Evento click.
   */
  function handleDelegatedClick(e) {
    var target;

    target = e.target.closest('[data-cart]');
    if (target) { e.stopPropagation(); addToCart(parseInt(target.dataset.cart)); return; }

    target = e.target.closest('[data-fav]');
    if (target) { e.stopPropagation(); toggleFavorite(parseInt(target.dataset.fav)); return; }

    target = e.target.closest('[data-view]');
    if (target) { e.stopPropagation(); openProductModal(parseInt(target.dataset.view)); return; }

    target = e.target.closest('.product-card');
    if (target && !e.target.closest('.product-card-actions') && !e.target.closest('.btn-add-cart')) {
      openProductModal(parseInt(target.dataset.id));
      return;
    }

    target = e.target.closest('[data-category]');
    if (target) { state.activeCategory = target.dataset.category; renderCategories(); renderProducts(); return; }

    target = e.target.closest('[data-action]');
    if (target) {
      var delta = target.dataset.action === 'increase' ? 1 : -1;
      updateQuantity(parseInt(target.dataset.id), delta);
      return;
    }

    target = e.target.closest('.cart-item-remove');
    if (target) { removeFromCart(parseInt(target.dataset.id)); return; }

    if (e.target.closest('#btn-checkout')) { openCheckout(); return; }
    if (e.target.closest('#btn-confirm-order')) { confirmOrder(); return; }
    if (e.target.closest('#btn-close-success')) { closeCheckout(); return; }
    if (e.target.closest('#btn-clear-filters')) { clearFilters(); return; }
  }


  // =============================================
  //  INICIO DE LA APLICACIÓN
  // =============================================

  document.addEventListener('DOMContentLoaded', init);
})();
