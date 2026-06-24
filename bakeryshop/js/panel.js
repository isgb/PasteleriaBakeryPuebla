/**
 * Bakery Puebla — Panel de gestión de pedidos.
 *
 * Sistema completo de administración para pasteleros con:
 * - Autenticación mock con persistencia en localStorage.
 * - Dashboard con métricas, alertas y producción del día.
 * - Gestión de pedidos con filtros, ordenamiento y búsqueda.
 * - Detalle de pedido con línea de tiempo y cambio de estados.
 * - Calendario semanal de entregas.
 * - Notificaciones de pedidos urgentes y entregas próximas.
 *
 * Datos: mock/users.js y mock/orders.js.
 * Persistencia: localStorage (sesión y pedidos).
 *
 * @module panel
 */
(function () {
  'use strict';

  /** @param {string} id @returns {HTMLElement|null} */
  function $(id) { return document.getElementById(id); }

  /** @param {string} sel @returns {NodeList} */
  function $$(sel) { return document.querySelectorAll(sel); }

  // =============================================
  //  CONSTANTES
  // =============================================

  /** Nombres de meses abreviados para formato de fechas. */
  var MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  /** Nombres de meses completos para formato largo. */
  var MESES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  /** Nombres de días de la semana (indexados por getDay()). */
  var DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  /** Días abreviados para el calendario semanal (Lun-Dom). */
  var DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  /**
   * Máquina de estados del workflow de pedidos.
   * Define la transición permitida y el label del botón para cada estado.
   *
   * Flujo: pendiente → aceptado → preparando → decorando → listo → entregado
   * Estados finales: entregado, cancelado (sin transición siguiente).
   *
   * @type {Object<string, { label: string, next: string|null, nextLabel: string|null }>}
   */
  var STATUSES = {
    pendiente:  { label: 'Pendiente',  next: 'aceptado',   nextLabel: 'Aceptar Pedido' },
    aceptado:   { label: 'Aceptado',   next: 'preparando', nextLabel: 'Iniciar Preparación' },
    preparando: { label: 'Preparando', next: 'decorando',  nextLabel: 'Pasar a Decorado' },
    decorando:  { label: 'Decorando',  next: 'listo',      nextLabel: 'Marcar como Listo' },
    listo:      { label: 'Listo',      next: 'entregado',  nextLabel: 'Marcar Entregado' },
    entregado:  { label: 'Entregado',  next: null,         nextLabel: null },
    cancelado:  { label: 'Cancelado',  next: null,         nextLabel: null }
  };

  /**
   * Estado global del panel.
   *
   * @type {{ user: Object|null, orders: Array, activeView: string, filters: Object, sortBy: string, sortDir: string, searchQuery: string }}
   */
  var state = {
    user: null,
    orders: [],
    activeView: 'dashboard',
    filters: { status: 'all', priority: 'all' },
    sortBy: 'deliveryDate',
    sortDir: 'asc',
    searchQuery: ''
  };


  // =============================================
  //  UTILIDADES DE SEGURIDAD
  // =============================================

  /**
   * Rellena con cero a la izquierda para formato de hora.
   *
   * @param {number} n - Número a formatear.
   * @returns {string} Número con padding (ej: 9 → "09").
   */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /**
   * Escapa texto para prevenir XSS en innerHTML.
   *
   * @param {string} str - Texto a escapar.
   * @returns {string} Texto seguro.
   */
  function esc(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Escapa texto para uso seguro en atributos HTML.
   *
   * @param {string} str - Texto a escapar.
   * @returns {string} Texto seguro para atributos.
   */
  function escAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }


  // =============================================
  //  GENERADORES DE BADGES
  // =============================================

  /**
   * Genera HTML de un badge de estado con color correspondiente.
   *
   * @param {string} status - Clave del estado (ej: "preparando").
   * @returns {string} HTML del badge.
   */
  function statusBadge(status) {
    return '<span class="status-badge status-' + status + '"><span class="status-dot"></span>' + STATUSES[status].label + '</span>';
  }

  /**
   * Genera HTML de un badge de prioridad (urgente con pulso o normal).
   *
   * @param {string} priority - "urgent" o "normal".
   * @returns {string} HTML del badge.
   */
  function priorityBadge(priority) {
    if (priority === 'urgent') return '<span class="priority-badge urgent"><i class="fa fa-bolt"></i> Urgente</span>';
    return '<span class="priority-badge normal">Normal</span>';
  }


  // =============================================
  //  FORMATO DE FECHAS
  // =============================================

  /**
   * Formatea una fecha como "23 Jun 14:00".
   *
   * @param {string} dateStr - Fecha ISO.
   * @returns {string} Fecha corta con hora.
   */
  function formatShortDate(dateStr) {
    var d = new Date(dateStr);
    return d.getDate() + ' ' + MESES_CORTO[d.getMonth()] + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  /**
   * Formatea un Date como "Martes 23 de junio de 2026".
   *
   * @param {Date} d - Objeto Date.
   * @returns {string} Fecha completa legible.
   */
  function formatFullDate(d) {
    return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES_LARGO[d.getMonth()] + ' de ' + d.getFullYear();
  }

  /**
   * Formatea como "23 Jun 2026, 14:00".
   *
   * @param {string} dateStr - Fecha ISO.
   * @returns {string} Fecha y hora completas.
   */
  function formatFullDateTime(dateStr) {
    var d = new Date(dateStr);
    return d.getDate() + ' ' + MESES_CORTO[d.getMonth()] + ' ' + d.getFullYear() + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  /**
   * Calcula la relación de una fecha con hoy para mostrar etiquetas contextuales.
   *
   * @param {string} dateStr - Fecha ISO de entrega.
   * @returns {{ text: string, cls: string }} Label relativo y clase CSS para colorear.
   */
  function getRelativeDate(dateStr) {
    var d = new Date(dateStr);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var target = new Date(d);
    target.setHours(0, 0, 0, 0);
    var diff = Math.round((target - today) / 86400000);

    if (diff === 0) return { text: 'Hoy ' + pad(d.getHours()) + ':' + pad(d.getMinutes()), cls: 'today' };
    if (diff === 1) return { text: 'Mañana', cls: 'tomorrow' };
    if (diff === -1) return { text: 'Ayer', cls: 'past' };
    if (diff < -1) return { text: 'Hace ' + Math.abs(diff) + ' días', cls: 'past' };
    return { text: 'En ' + diff + ' días', cls: '' };
  }

  /**
   * Calcula el tiempo restante hasta una fecha futura.
   *
   * @param {string} dateStr - Fecha ISO objetivo.
   * @returns {string|null} Tiempo restante formateado o null si ya pasó.
   */
  function getTimeRemaining(dateStr) {
    var diff = new Date(dateStr) - new Date();
    if (diff <= 0) return null;

    var hours = Math.floor(diff / 3600000);
    var mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return Math.floor(hours / 24) + 'd ' + (hours % 24) + 'h';
    if (hours > 0) return hours + 'h ' + mins + 'min';
    return mins + ' min';
  }

  /**
   * Formatea el tiempo transcurrido desde una fecha pasada.
   *
   * @param {string} dateStr - Fecha ISO pasada.
   * @returns {string} Texto relativo (ej: "15 min", "3 horas", "2 días").
   */
  function formatTimeAgo(dateStr) {
    var mins = (new Date() - new Date(dateStr)) / 60000;
    if (mins < 60) return Math.round(mins) + ' min';
    if (mins < 1440) return Math.round(mins / 60) + ' horas';
    return Math.round(mins / 1440) + ' días';
  }

  /**
   * Verifica si una fecha corresponde al día de hoy.
   *
   * @param {string} dateStr - Fecha ISO.
   * @returns {boolean}
   */
  function isToday(dateStr) {
    var d = new Date(dateStr);
    var t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  }

  /**
   * Verifica si una fecha está dentro de los últimos N días.
   *
   * @param {string} dateStr - Fecha ISO.
   * @param {number} days - Ventana en días.
   * @returns {boolean}
   */
  function isRecent(dateStr, days) {
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return new Date(dateStr) >= cutoff;
  }


  // =============================================
  //  GESTIÓN DE DATOS (PEDIDOS)
  // =============================================

  /**
   * Busca un pedido por ID en el estado local.
   *
   * @param {number} id - ID del pedido.
   * @returns {Object|null} Pedido encontrado o null.
   */
  function findOrder(id) {
    for (var i = 0; i < state.orders.length; i++) {
      if (state.orders[i].id === id) return state.orders[i];
    }
    return null;
  }

  /**
   * Carga pedidos desde localStorage. Si no hay datos válidos, usa los datos mock.
   */
  function loadOrders() {
    var stored = localStorage.getItem('bakery_orders');
    if (stored) {
      try { state.orders = JSON.parse(stored); return; } catch (e) { /* datos corruptos */ }
    }
    resetOrders();
  }

  /** Restaura los pedidos a su estado original desde MOCK_ORDERS. */
  function resetOrders() {
    state.orders = JSON.parse(JSON.stringify(MOCK_ORDERS));
    saveOrders();
  }

  /** Persiste los pedidos actuales en localStorage. */
  function saveOrders() {
    localStorage.setItem('bakery_orders', JSON.stringify(state.orders));
  }


  // =============================================
  //  AUTENTICACIÓN MOCK
  // =============================================

  /**
   * Verifica si hay una sesión activa en localStorage.
   *
   * Flujo:
   * 1. Lee bakery_session de localStorage.
   * 2. Si existe y es válido, carga pedidos y muestra el panel.
   * 3. Si no existe o es inválido, muestra el login.
   */
  function checkAuth() {
    var session = localStorage.getItem('bakery_session');
    if (session) {
      try {
        state.user = JSON.parse(session);
        loadOrders();
        showPanel();
      } catch (e) {
        localStorage.removeItem('bakery_session');
        showLogin();
      }
    } else {
      showLogin();
    }
  }

  /**
   * Intenta autenticar al usuario contra MOCK_USERS.
   * Si tiene éxito, persiste la sesión y carga el panel.
   *
   * @param {string} email - Email ingresado.
   * @param {string} password - Contraseña ingresada.
   */
  function login(email, password) {
    var user = null;
    for (var i = 0; i < MOCK_USERS.length; i++) {
      if (MOCK_USERS[i].email === email && MOCK_USERS[i].password === password) {
        user = MOCK_USERS[i];
        break;
      }
    }

    if (!user) {
      $('login-error').classList.add('visible');
      $('login-password').value = '';
      return;
    }

    state.user = { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar };
    localStorage.setItem('bakery_session', JSON.stringify(state.user));
    loadOrders();
    showPanel();
    showToast('Bienvenido, ' + user.name, 'success');
  }

  /** Cierra la sesión, limpia localStorage y regresa al login. */
  function logout() {
    state.user = null;
    localStorage.removeItem('bakery_session');
    showLogin();
    showToast('Sesión cerrada', 'info');
  }

  /** Muestra la pantalla de login y oculta el panel. */
  function showLogin() {
    $('login-screen').style.display = '';
    $('panel').style.display = 'none';
    $('login-email').focus();
  }

  /** Muestra el panel, actualiza datos del usuario en sidebar y carga el dashboard. */
  function showPanel() {
    $('login-screen').style.display = 'none';
    $('panel').style.display = '';
    $('sidebar-avatar').textContent = state.user.avatar;
    $('sidebar-user-name').textContent = state.user.name;
    $('sidebar-user-role').textContent = state.user.role;
    switchView('dashboard');
  }


  // =============================================
  //  NAVEGACIÓN DE VISTAS
  // =============================================

  /**
   * Cambia la vista activa del panel (dashboard, orders, calendar).
   * Actualiza sidebar, título del topbar y renderiza la vista.
   *
   * @param {string} view - Nombre de la vista.
   */
  function switchView(view) {
    state.activeView = view;

    ['dashboard', 'orders', 'calendar'].forEach(function (v) {
      $('view-' + v).style.display = v === view ? '' : 'none';
    });

    $$('.sidebar-link[data-view]').forEach(function (el) {
      el.classList.toggle('active', el.dataset.view === view);
    });

    var titles = { dashboard: 'Dashboard', orders: 'Gestión de Pedidos', calendar: 'Calendario de Entregas' };
    $('topbar-title').textContent = titles[view] || '';

    if (view === 'dashboard') renderDashboard();
    else if (view === 'orders') renderOrdersView();
    else if (view === 'calendar') renderCalendar();

    closeSidebar();
  }

  /** Re-renderiza la vista activa actual (útil tras modificar un pedido). */
  function refreshCurrentView() {
    if (state.activeView === 'dashboard') renderDashboard();
    else if (state.activeView === 'orders') renderOrdersTable();
    else if (state.activeView === 'calendar') renderCalendar();
  }


  // =============================================
  //  DASHBOARD
  // =============================================

  /**
   * Renderiza todo el dashboard.
   *
   * Flujo:
   * 1. Muestra saludo dinámico según la hora.
   * 2. Genera alertas de entregas próximas y pedidos urgentes.
   * 3. Calcula y muestra métricas (pendientes, en proceso, listos, ingresos).
   * 4. Lista los 5 pedidos más recientes.
   * 5. Muestra gráfico de producción por sabor y producto más vendido.
   * 6. Actualiza badges y notificaciones.
   */
  function renderDashboard() {
    var hour = new Date().getHours();
    var greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
    $('dash-greeting').innerHTML = '<h2>' + greeting + ', ' + esc(state.user.name) + '</h2><p>' + formatFullDate(new Date()) + '</p>';

    renderAlerts();
    renderStatCards();
    renderRecentOrders();
    renderProductionChart();
    renderTopProduct();
    updatePendingBadge();
    renderNotifications();
  }

  /**
   * Genera alertas visibles en el dashboard.
   * Detecta pedidos con entrega < 2 horas y cuenta urgentes del día.
   */
  function renderAlerts() {
    var now = new Date();
    var alerts = [];
    var urgentToday = 0;

    state.orders.forEach(function (o) {
      if (o.status === 'entregado' || o.status === 'cancelado') return;

      var hoursLeft = (new Date(o.deliveryDate) - now) / 3600000;
      if (hoursLeft > 0 && hoursLeft <= 2) {
        alerts.push({ danger: true, text: '<strong>' + esc(o.folio) + '</strong> — Entrega en menos de 2 horas (' + esc(o.client.name) + ')' });
      }
      if (o.priority === 'urgent' && isToday(o.deliveryDate)) urgentToday++;
    });

    if (urgentToday > 0) {
      alerts.unshift({ danger: false, text: '<i class="fa fa-exclamation-triangle"></i> Tienes <strong>' + urgentToday + ' pedido(s) urgente(s)</strong> para hoy.' });
    }

    var html = '';
    alerts.forEach(function (a) {
      var icon = a.danger ? 'fa-exclamation-circle' : 'fa-exclamation-triangle';
      html += '<div class="dash-alert' + (a.danger ? ' alert-danger' : '') + '"><i class="fa ' + icon + '"></i><span>' + a.text + '</span></div>';
    });
    $('dash-alerts').innerHTML = html;
  }

  /** Renderiza las 5 tarjetas de métricas del dashboard (pendientes, proceso, listos, entregados, ingresos). */
  function renderStatCards() {
    var counts = { pendiente: 0, enProceso: 0, listo: 0, entregados: 0, ingresos: 0 };

    state.orders.forEach(function (o) {
      if (o.status === 'pendiente') counts.pendiente++;
      if (o.status === 'aceptado' || o.status === 'preparando' || o.status === 'decorando') counts.enProceso++;
      if (o.status === 'listo') counts.listo++;
      if (o.status === 'entregado' && isRecent(o.deliveryDate, 7)) {
        counts.entregados++;
        counts.ingresos += o.total;
      }
    });

    var cards = [
      { css: 'pending',   icon: 'fa-clock-o',       value: counts.pendiente, label: 'Pendientes' },
      { css: 'preparing', icon: 'fa-cog fa-spin',   value: counts.enProceso, label: 'En Proceso' },
      { css: 'ready',     icon: 'fa-check-circle',  value: counts.listo,     label: 'Listos' },
      { css: 'delivered', icon: 'fa-truck',          value: counts.entregados, label: 'Entregados (7d)' },
      { css: 'revenue',   icon: 'fa-money',          value: '$' + counts.ingresos.toLocaleString('es-MX'), label: 'Ingresos (7d)' }
    ];

    var html = '';
    cards.forEach(function (c) {
      html +=
        '<div class="dash-stat-card">' +
          '<div class="dash-stat-icon ' + c.css + '"><i class="fa ' + c.icon + '"></i></div>' +
          '<div>' +
            '<div class="dash-stat-value">' + c.value + '</div>' +
            '<div class="dash-stat-label">' + c.label + '</div>' +
          '</div>' +
        '</div>';
    });
    $('dash-stats').innerHTML = html;
  }

  /** Muestra los 5 pedidos más recientes en tabla compacta. */
  function renderRecentOrders() {
    var recent = state.orders.slice()
      .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
      .slice(0, 5);

    if (recent.length === 0) {
      $('dash-recent-orders').innerHTML = '<div class="panel-empty"><i class="fa fa-clipboard"></i><h3>Sin pedidos</h3></div>';
      return;
    }

    var rows = '';
    recent.forEach(function (o) {
      rows +=
        '<tr class="' + (o.priority === 'urgent' ? 'urgent-row' : '') + '" data-order-id="' + o.id + '">' +
          '<td><span class="order-folio">' + esc(o.folio) + '</span></td>' +
          '<td>' + esc(o.client.name) + '</td>' +
          '<td>' + formatShortDate(o.deliveryDate) + '</td>' +
          '<td>' + statusBadge(o.status) + '</td>' +
          '<td><strong>$' + o.total.toLocaleString('es-MX') + '</strong></td>' +
        '</tr>';
    });

    $('dash-recent-orders').innerHTML =
      '<table class="orders-table" style="margin:0"><thead><tr>' +
        '<th>Folio</th><th>Cliente</th><th>Entrega</th><th>Estado</th><th>Total</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  /** Renderiza gráfico de barras CSS con los sabores más pedidos. */
  function renderProductionChart() {
    var counts = {};
    state.orders.forEach(function (o) {
      if (o.status !== 'cancelado') {
        counts[o.flavor] = (counts[o.flavor] || 0) + 1;
      }
    });

    var entries = Object.keys(counts).map(function (name) { return { name: name, count: counts[name] }; });
    entries.sort(function (a, b) { return b.count - a.count; });

    if (entries.length === 0) {
      $('dash-production').innerHTML = '<p style="color:var(--gray-600);text-align:center">Sin datos</p>';
      return;
    }

    var max = entries[0].count;
    var html = '';
    entries.slice(0, 5).forEach(function (e) {
      var pct = Math.round((e.count / max) * 100);
      html +=
        '<div class="chart-bar">' +
          '<span class="chart-bar-label">' + esc(e.name) + '</span>' +
          '<div class="chart-bar-track"><div class="chart-bar-fill" style="width:' + pct + '%"></div></div>' +
          '<span class="chart-bar-value">' + e.count + '</span>' +
        '</div>';
    });
    $('dash-production').innerHTML = html;
  }

  /** Identifica y muestra el producto con más unidades vendidas. */
  function renderTopProduct() {
    var counts = {};
    state.orders.forEach(function (o) {
      if (o.status === 'cancelado') return;
      o.products.forEach(function (p) {
        if (!counts[p.name]) counts[p.name] = { qty: 0, image: p.image };
        counts[p.name].qty += p.qty;
      });
    });

    var topName = null;
    var topQty = 0;
    Object.keys(counts).forEach(function (name) {
      if (counts[name].qty > topQty) { topName = name; topQty = counts[name].qty; }
    });

    if (!topName) {
      $('dash-top-product').innerHTML = '<p style="color:var(--gray-600);text-align:center">Sin datos</p>';
      return;
    }

    $('dash-top-product').innerHTML =
      '<div class="top-product">' +
        '<img src="' + escAttr(counts[topName].image) + '" alt="' + escAttr(topName) + '">' +
        '<div>' +
          '<div class="top-product-name">' + esc(topName) + '</div>' +
          '<div class="top-product-count"><i class="fa fa-shopping-cart"></i> ' + topQty + ' unidades vendidas</div>' +
        '</div>' +
      '</div>';
  }


  // =============================================
  //  VISTA DE PEDIDOS
  // =============================================

  /** Renderiza la vista completa de pedidos: toolbar + tabla + badge. */
  function renderOrdersView() {
    renderOrdersToolbar();
    renderOrdersTable();
    updatePendingBadge();
  }

  /** Genera los controles de filtro por estado y prioridad, preservando selección actual. */
  function renderOrdersToolbar() {
    $('orders-toolbar').innerHTML =
      '<div class="filter-group">' +
        '<select id="filter-status" aria-label="Filtrar por estado">' +
          '<option value="all">Todos los estados</option>' +
          '<option value="pendiente">Pendiente</option>' +
          '<option value="aceptado">Aceptado</option>' +
          '<option value="preparando">Preparando</option>' +
          '<option value="decorando">Decorando</option>' +
          '<option value="listo">Listo</option>' +
          '<option value="entregado">Entregado</option>' +
          '<option value="cancelado">Cancelado</option>' +
        '</select>' +
        '<select id="filter-priority" aria-label="Filtrar por prioridad">' +
          '<option value="all">Todas las prioridades</option>' +
          '<option value="urgent">Urgente</option>' +
          '<option value="normal">Normal</option>' +
        '</select>' +
      '</div>' +
      '<span class="orders-count" id="orders-count"></span>';

    $('filter-status').value = state.filters.status;
    $('filter-priority').value = state.filters.priority;
  }

  /**
   * Renderiza la tabla de pedidos (desktop) y cards (mobile) con los filtros aplicados.
   * Genera encabezado con indicadores de ordenamiento clickeables.
   */
  function renderOrdersTable() {
    var filtered = getFilteredOrders();
    $('orders-count').textContent = filtered.length + ' pedido(s)';

    if (filtered.length === 0) {
      $('orders-tbody').innerHTML = '';
      $('orders-card-list').innerHTML = '';
      $('orders-empty').style.display = 'block';
      return;
    }
    $('orders-empty').style.display = 'none';

    var sortIcon = state.sortDir === 'asc' ? 'fa-sort-asc' : 'fa-sort-desc';
    var cols = [
      { key: 'folio', label: 'Folio' },
      { key: 'client', label: 'Cliente' },
      { key: null, label: 'Producto' },
      { key: 'deliveryDate', label: 'Entrega' },
      { key: null, label: 'Prioridad' },
      { key: 'status', label: 'Estado' },
      { key: 'total', label: 'Total' },
      { key: null, label: 'Acciones' }
    ];

    var thead = '<tr>';
    cols.forEach(function (col) {
      var icon = col.key ? ' <i class="fa ' + (state.sortBy === col.key ? sortIcon : 'fa-sort') + '"></i>' : '';
      var sortAttr = col.key ? ' data-sort="' + col.key + '"' : '';
      thead += '<th' + sortAttr + '>' + col.label + icon + '</th>';
    });
    thead += '</tr>';
    $('orders-thead').innerHTML = thead;

    var tbody = '';
    var cards = '';
    filtered.forEach(function (o) {
      tbody += buildTableRow(o);
      cards += buildMobileCard(o);
    });
    $('orders-tbody').innerHTML = tbody;
    $('orders-card-list').innerHTML = cards;
  }

  /**
   * Genera el HTML de una fila de tabla para un pedido.
   *
   * @param {Object} o - Pedido.
   * @returns {string} HTML del <tr>.
   */
  function buildTableRow(o) {
    var rel = getRelativeDate(o.deliveryDate);
    var products = o.products.map(function (p) { return p.name; }).join(', ');
    var info = STATUSES[o.status];
    var advanceBtn = info.next
      ? '<button class="order-action-btn" data-advance="' + o.id + '" title="' + info.nextLabel + '"><i class="fa fa-arrow-right"></i></button>'
      : '';

    return (
      '<tr class="' + (o.priority === 'urgent' ? 'urgent-row' : '') + '" data-order-id="' + o.id + '">' +
        '<td><span class="order-folio">' + esc(o.folio) + '</span></td>' +
        '<td>' +
          '<span class="order-client-name">' + esc(o.client.name) + '</span><br>' +
          '<span class="order-client-phone"><i class="fa fa-phone"></i> ' + esc(o.client.phone) + '</span>' +
        '</td>' +
        '<td><span class="order-product-name">' + esc(products.length > 30 ? products.substring(0, 30) + '...' : products) + '</span></td>' +
        '<td>' +
          '<span class="order-delivery-date">' + formatShortDate(o.deliveryDate) + '</span>' +
          '<div class="order-delivery-relative ' + rel.cls + '">' + rel.text + '</div>' +
        '</td>' +
        '<td>' + priorityBadge(o.priority) + '</td>' +
        '<td>' + statusBadge(o.status) + '</td>' +
        '<td><strong>$' + o.total.toLocaleString('es-MX') + '</strong></td>' +
        '<td><div class="order-actions-cell">' +
          '<button class="order-action-btn" data-detail="' + o.id + '" title="Ver detalle"><i class="fa fa-eye"></i></button>' +
          advanceBtn +
        '</div></td>' +
      '</tr>'
    );
  }

  /**
   * Genera el HTML de una card mobile para un pedido.
   *
   * @param {Object} o - Pedido.
   * @returns {string} HTML de la card.
   */
  function buildMobileCard(o) {
    var rel = getRelativeDate(o.deliveryDate);
    var products = o.products.map(function (p) { return p.name; }).join(', ');

    return (
      '<div class="order-card-mobile ' + (o.priority === 'urgent' ? 'urgent' : '') + '" data-order-id="' + o.id + '">' +
        '<div class="order-card-mobile-header">' +
          '<span class="order-folio">' + esc(o.folio) + '</span>' +
          statusBadge(o.status) +
        '</div>' +
        '<div class="order-card-mobile-body">' +
          '<div>' +
            '<p><strong>' + esc(o.client.name) + '</strong></p>' +
            '<p>' + esc(products.length > 25 ? products.substring(0, 25) + '...' : products) + '</p>' +
            '<p><i class="fa fa-calendar"></i> ' + formatShortDate(o.deliveryDate) +
              ' <span class="order-delivery-relative ' + rel.cls + '">' + rel.text + '</span></p>' +
          '</div>' +
          '<div class="order-card-mobile-total">$' + o.total.toLocaleString('es-MX') + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /**
   * Filtra y ordena pedidos según estado, prioridad, búsqueda y columna de ordenamiento.
   *
   * @returns {Object[]} Pedidos filtrados y ordenados.
   */
  function getFilteredOrders() {
    var filtered = state.orders.filter(function (o) {
      if (state.filters.status !== 'all' && o.status !== state.filters.status) return false;
      if (state.filters.priority !== 'all' && o.priority !== state.filters.priority) return false;

      if (state.searchQuery) {
        var q = state.searchQuery.toLowerCase();
        var matchFolio = o.folio.toLowerCase().indexOf(q) !== -1;
        var matchName = o.client.name.toLowerCase().indexOf(q) !== -1;
        var matchPhone = o.client.phone.indexOf(q) !== -1;
        if (!matchFolio && !matchName && !matchPhone) return false;
      }

      return true;
    });

    filtered.sort(function (a, b) {
      var va, vb;
      switch (state.sortBy) {
        case 'folio':        va = a.folio;          vb = b.folio;          break;
        case 'client':       va = a.client.name;    vb = b.client.name;    break;
        case 'status':       va = a.status;         vb = b.status;         break;
        case 'total':        va = a.total;          vb = b.total;          break;
        case 'deliveryDate':
        default:             va = new Date(a.deliveryDate); vb = new Date(b.deliveryDate);
      }
      var cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return state.sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }


  // =============================================
  //  DETALLE DE PEDIDO (MODAL)
  // =============================================

  /**
   * Abre el modal con la información completa de un pedido.
   * Compone el contenido delegando en funciones build* para cada sección.
   *
   * @param {number} id - ID del pedido.
   */
  function openOrderDetail(id) {
    var order = findOrder(id);
    if (!order) return;

    var rel = getRelativeDate(order.deliveryDate);
    var timeLeft = getTimeRemaining(order.deliveryDate);

    $('order-modal-body').innerHTML =
      '<div class="order-detail">' +
        buildDetailHeader(order, rel, timeLeft) +
        buildDetailInfo(order, rel) +
        (order.notes ? '<div class="order-notes"><strong><i class="fa fa-sticky-note"></i> Notas del cliente</strong>' + esc(order.notes) + '</div>' : '') +
        '<h4 style="font-size:0.85rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:1rem">Productos</h4>' +
        buildDetailProducts(order) +
        '<div class="order-total-row"><span>Total del Pedido</span><span>$' + order.total.toLocaleString('es-MX') + '</span></div>' +
        '<h4 style="font-size:0.85rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:1.5rem 0 1rem">Línea de Tiempo</h4>' +
        buildDetailTimeline(order) +
        '<div class="order-detail-actions">' + buildDetailActions(order) + '</div>' +
      '</div>';

    $('order-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Genera el encabezado del detalle con folio, badges y tiempo restante.
   *
   * @param {Object} order - Pedido.
   * @param {{ text: string, cls: string }} rel - Fecha relativa.
   * @param {string|null} timeLeft - Tiempo restante formateado.
   * @returns {string} HTML del header.
   */
  function buildDetailHeader(order, rel, timeLeft) {
    var timeHtml = timeLeft ? '<span style="font-size:0.82rem;color:var(--gray-600)"><i class="fa fa-clock-o"></i> ' + timeLeft + '</span>' : '';
    return (
      '<div class="order-detail-header">' +
        '<span class="order-detail-folio">' + esc(order.folio) + '</span>' +
        '<div class="order-detail-meta">' + statusBadge(order.status) + ' ' + priorityBadge(order.priority) + ' ' + timeHtml + '</div>' +
      '</div>'
    );
  }

  /**
   * Genera las cards de información del cliente y datos de entrega.
   *
   * @param {Object} order - Pedido.
   * @param {{ text: string, cls: string }} rel - Fecha relativa.
   * @returns {string} HTML del grid de info.
   */
  function buildDetailInfo(order, rel) {
    return (
      '<div class="order-info-grid">' +
        '<div class="order-info-card"><h4>Cliente</h4>' +
          '<p><i class="fa fa-user"></i> ' + esc(order.client.name) + '</p>' +
          '<p><i class="fa fa-phone"></i> ' + esc(order.client.phone) + '</p>' +
          '<p><i class="fa fa-envelope"></i> ' + esc(order.client.email) + '</p>' +
        '</div>' +
        '<div class="order-info-card"><h4>Entrega</h4>' +
          '<p><i class="fa fa-calendar"></i> ' + formatFullDateTime(order.deliveryDate) + '</p>' +
          '<p class="order-delivery-relative ' + rel.cls + '" style="font-weight:600">' + rel.text + '</p>' +
          '<p><i class="fa fa-birthday-cake"></i> ' + esc(order.flavor) + ' — ' + esc(order.decoration) + '</p>' +
          '<p><i class="fa fa-arrows-alt"></i> ' + esc(order.size) + '</p>' +
        '</div>' +
      '</div>'
    );
  }

  /**
   * Genera la lista de productos del pedido con imagen, cantidad y subtotal.
   *
   * @param {Object} order - Pedido.
   * @returns {string} HTML de la lista de productos.
   */
  function buildDetailProducts(order) {
    var html = '<div class="order-products-list">';
    order.products.forEach(function (p) {
      var subtotal = (p.price * p.qty).toLocaleString('es-MX');
      html +=
        '<div class="order-product-item">' +
          '<img src="' + escAttr(p.image) + '" alt="' + escAttr(p.name) + '">' +
          '<div class="order-product-item-info">' +
            '<div class="order-product-item-name">' + esc(p.name) + '</div>' +
            '<div class="order-product-item-detail">Cantidad: ' + p.qty + ' &middot; $' + p.price.toLocaleString('es-MX') + ' c/u</div>' +
          '</div>' +
          '<div class="order-product-item-total">$' + subtotal + '</div>' +
        '</div>';
    });
    html += '</div>';
    return html;
  }

  /**
   * Genera la línea de tiempo visual del pedido.
   * El último evento se marca como "active", los anteriores como "completed".
   *
   * @param {Object} order - Pedido con array timeline.
   * @returns {string} HTML de la timeline.
   */
  function buildDetailTimeline(order) {
    var html = '<div class="order-timeline">';
    var lastIdx = order.timeline.length - 1;
    order.timeline.forEach(function (t, i) {
      var cls = i === lastIdx ? 'active' : 'completed';
      html +=
        '<div class="timeline-item ' + cls + '">' +
          '<div class="timeline-dot"></div>' +
          '<div class="timeline-status">' + STATUSES[t.status].label + '</div>' +
          '<div class="timeline-date">' + formatFullDateTime(t.date) + '</div>' +
          (t.note ? '<div class="timeline-note">' + esc(t.note) + '</div>' : '') +
        '</div>';
    });
    html += '</div>';
    return html;
  }

  /**
   * Genera los botones de acción según el estado actual del pedido.
   * Pedidos finalizados (entregado/cancelado) solo muestran "Imprimir".
   *
   * @param {Object} order - Pedido.
   * @returns {string} HTML de los botones de acción.
   */
  function buildDetailActions(order) {
    var info = STATUSES[order.status];
    var html = '';
    var isActive = order.status !== 'entregado' && order.status !== 'cancelado';

    if (info.next) {
      html += '<button class="btn-panel btn-panel-primary" data-advance="' + order.id + '"><i class="fa fa-arrow-right"></i> ' + info.nextLabel + '</button>';
    }
    if (isActive) {
      var urgentLabel = order.priority === 'urgent' ? 'Quitar Urgente' : 'Marcar Urgente';
      html += '<button class="btn-panel btn-panel-warning" data-toggle-urgent="' + order.id + '"><i class="fa fa-exclamation-triangle"></i> ' + urgentLabel + '</button>';
      html += '<button class="btn-panel btn-panel-danger" data-cancel="' + order.id + '"><i class="fa fa-times"></i> Cancelar</button>';
    }
    html += '<button class="btn-panel btn-panel-secondary" data-print="' + order.id + '"><i class="fa fa-print"></i> Imprimir</button>';
    return html;
  }

  /** Cierra el modal de detalle y restaura el scroll del body. */
  function closeOrderDetail() {
    $('order-modal').classList.remove('open');
    document.body.style.overflow = '';
  }


  // =============================================
  //  ACCIONES SOBRE PEDIDOS
  // =============================================

  /**
   * Avanza un pedido al siguiente estado del workflow.
   * Registra la transición en el timeline con timestamp y usuario.
   *
   * @param {number} id - ID del pedido.
   */
  function advanceStatus(id) {
    var order = findOrder(id);
    if (!order || !STATUSES[order.status].next) return;

    var newStatus = STATUSES[order.status].next;
    order.status = newStatus;
    order.timeline.push({ status: newStatus, date: new Date().toISOString(), note: STATUSES[newStatus].label + ' por ' + state.user.name });

    if (newStatus === 'aceptado' && !order.assignedTo) order.assignedTo = state.user.name;

    saveOrders();
    showToast('Pedido ' + order.folio + ' → ' + STATUSES[newStatus].label, 'success');
    refreshCurrentView();
    if ($('order-modal').classList.contains('open')) openOrderDetail(id);
  }

  /**
   * Alterna la prioridad de un pedido entre "urgent" y "normal".
   *
   * @param {number} id - ID del pedido.
   */
  function toggleUrgent(id) {
    var order = findOrder(id);
    if (!order) return;

    order.priority = order.priority === 'urgent' ? 'normal' : 'urgent';
    saveOrders();

    var msg = order.priority === 'urgent' ? 'URGENTE' : 'Normal';
    showToast('Prioridad actualizada: ' + msg, order.priority === 'urgent' ? 'error' : 'info');
    refreshCurrentView();
    if ($('order-modal').classList.contains('open')) openOrderDetail(id);
  }

  /**
   * Cancela un pedido y registra la cancelación en el timeline.
   *
   * @param {number} id - ID del pedido.
   */
  function cancelOrder(id) {
    var order = findOrder(id);
    if (!order) return;

    order.status = 'cancelado';
    order.timeline.push({ status: 'cancelado', date: new Date().toISOString(), note: 'Cancelado por ' + state.user.name });

    saveOrders();
    showToast('Pedido ' + order.folio + ' cancelado', 'error');
    refreshCurrentView();
    if ($('order-modal').classList.contains('open')) openOrderDetail(id);
  }

  /**
   * Abre el detalle de un pedido y lanza la impresión del navegador.
   *
   * @param {number} id - ID del pedido.
   */
  function printOrder(id) {
    openOrderDetail(id);
    setTimeout(function () { window.print(); }, 300);
  }


  // =============================================
  //  CALENDARIO SEMANAL
  // =============================================

  /**
   * Renderiza la vista de calendario con entregas de la semana actual (Lun-Dom).
   * Cada día muestra los pedidos programados como chips clickeables.
   *
   * Flujo:
   * 1. Calcula el lunes de la semana actual.
   * 2. Genera 7 columnas con fecha y pedidos del día.
   * 3. Resalta el día actual.
   */
  function renderCalendar() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var dow = today.getDay();
    var monday = new Date(today);
    monday.setDate(today.getDate() - ((dow + 6) % 7));

    var sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    $('calendar-week-range').textContent =
      monday.getDate() + ' ' + MESES_CORTO[monday.getMonth()] + ' — ' +
      sunday.getDate() + ' ' + MESES_CORTO[sunday.getMonth()] + ' ' + sunday.getFullYear();

    var html = '';
    for (var i = 0; i < 7; i++) {
      var date = new Date(monday);
      date.setDate(monday.getDate() + i);
      var isTodayDate = date.getTime() === today.getTime();
      var dateKey = date.toISOString().split('T')[0];

      var dayOrders = state.orders.filter(function (o) {
        return o.status !== 'cancelado' && new Date(o.deliveryDate).toISOString().split('T')[0] === dateKey;
      });

      var chipsHtml = '';
      if (dayOrders.length === 0) {
        chipsHtml = '<p style="color:var(--gray-600);font-size:0.75rem;text-align:center;margin:1rem 0">Sin entregas</p>';
      } else {
        dayOrders.forEach(function (o) {
          var dt = new Date(o.deliveryDate);
          chipsHtml +=
            '<div class="calendar-order-chip ' + (o.priority === 'urgent' ? 'urgent' : '') + '" data-order-id="' + o.id + '">' +
              '<div class="calendar-chip-time">' + pad(dt.getHours()) + ':' + pad(dt.getMinutes()) + '</div>' +
              '<div class="calendar-chip-name">' + esc(o.client.name.split(' ')[0]) + ' — ' + esc(o.products[0].name) + '</div>' +
              statusBadge(o.status) +
            '</div>';
        });
      }

      html +=
        '<div class="calendar-day' + (isTodayDate ? ' today' : '') + '">' +
          '<div class="calendar-day-header"><span class="calendar-day-number">' + date.getDate() + '</span> ' + DIAS_CORTO[i] + '</div>' +
          '<div class="calendar-day-body">' + chipsHtml + '</div>' +
        '</div>';
    }
    $('calendar-grid').innerHTML = html;
  }


  // =============================================
  //  NOTIFICACIONES
  // =============================================

  /**
   * Genera las notificaciones del dropdown del topbar.
   * Incluye pedidos pendientes de aceptar y entregas dentro de 4 horas.
   */
  function renderNotifications() {
    var now = new Date();
    var items = [];

    state.orders.forEach(function (o) {
      if (o.status === 'pendiente') {
        items.push({ urgent: true, icon: 'fa-clock-o', text: '<strong>' + esc(o.folio) + '</strong> pendiente de aceptar', time: formatTimeAgo(o.createdAt), id: o.id });
      }

      if (o.status !== 'entregado' && o.status !== 'cancelado') {
        var hoursLeft = (new Date(o.deliveryDate) - now) / 3600000;
        if (hoursLeft > 0 && hoursLeft <= 4) {
          items.push({ urgent: true, icon: 'fa-exclamation-circle', text: '<strong>' + esc(o.folio) + '</strong> entrega próxima', time: getTimeRemaining(o.deliveryDate), id: o.id });
        }
      }
    });

    $('badge-notif').style.display = items.length > 0 ? '' : 'none';

    var html = '';
    if (items.length === 0) {
      html = '<div class="notif-item"><span class="notif-text">Sin notificaciones nuevas</span></div>';
    } else {
      items.slice(0, 5).forEach(function (n) {
        html +=
          '<div class="notif-item ' + (n.urgent ? 'urgent' : '') + '" data-notif-order="' + n.id + '">' +
            '<i class="fa ' + n.icon + '"></i>' +
            '<div><div class="notif-text">' + n.text + '</div><div class="notif-time">' + n.time + '</div></div>' +
          '</div>';
      });
    }
    $('notif-list').innerHTML = html;
  }

  /** Actualiza el badge de pedidos pendientes en el sidebar. */
  function updatePendingBadge() {
    var count = 0;
    state.orders.forEach(function (o) { if (o.status === 'pendiente') count++; });
    var badge = $('sidebar-pending-count');
    badge.textContent = count;
    badge.style.display = count > 0 ? '' : 'none';
  }


  // =============================================
  //  SIDEBAR (MOBILE)
  // =============================================

  /** Abre el sidebar con overlay y bloquea scroll del body. */
  function openSidebar() {
    $('panel-sidebar').classList.add('open');
    $('sidebar-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  /** Cierra el sidebar y restaura el scroll. */
  function closeSidebar() {
    $('panel-sidebar').classList.remove('open');
    $('sidebar-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }


  // =============================================
  //  NOTIFICACIONES TOAST
  // =============================================

  /**
   * Muestra una notificación toast que se auto-elimina en 3 segundos.
   *
   * @param {string} message - Texto del mensaje.
   * @param {'success'|'error'|'info'} [type='success'] - Tipo visual del toast.
   */
  function showToast(message, type) {
    type = type || 'success';
    var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML =
      '<span class="toast-icon ' + type + '"><i class="fa ' + icons[type] + '"></i></span>' +
      '<span class="toast-message">' + esc(message) + '</span>';

    $('toast-container').appendChild(toast);
    setTimeout(function () {
      toast.classList.add('removing');
      setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    }, 3000);
  }


  // =============================================
  //  REGISTRO DE EVENTOS
  // =============================================

  /**
   * Registra todos los event listeners del panel.
   *
   * Flujo:
   * 1. Login: submit, input (limpia errores), toggle contraseña.
   * 2. Panel: logout, reset datos, sidebar mobile.
   * 3. Navegación: links del sidebar cambian vista activa.
   * 4. Notificaciones: toggle dropdown.
   * 5. Búsqueda: debounce 300ms, redirige a vista pedidos.
   * 6. Delegación: clicks en elementos dinámicos (tabla, cards, modales).
   * 7. Filtros: cambio en selects de estado/prioridad.
   * 8. Teclado: ESC cierra modales y sidebar.
   */
  function bindGlobalEvents() {
    $('login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      $('login-error').classList.remove('visible');
      login($('login-email').value.trim(), $('login-password').value);
    });

    $('login-email').addEventListener('input', function () { $('login-error').classList.remove('visible'); });
    $('login-password').addEventListener('input', function () { $('login-error').classList.remove('visible'); });

    $('btn-toggle-pass').addEventListener('click', function () {
      var inp = $('login-password');
      var isPass = inp.type === 'password';
      inp.type = isPass ? 'text' : 'password';
      this.querySelector('.fa').className = 'fa ' + (isPass ? 'fa-eye-slash' : 'fa-eye');
    });

    $('btn-logout').addEventListener('click', logout);
    $('btn-reset-data').addEventListener('click', function () {
      resetOrders();
      showToast('Datos restaurados', 'info');
      refreshCurrentView();
    });

    $('topbar-hamburger').addEventListener('click', openSidebar);
    $('sidebar-close').addEventListener('click', closeSidebar);
    $('sidebar-overlay').addEventListener('click', closeSidebar);

    $$('.sidebar-link[data-view]').forEach(function (el) {
      el.addEventListener('click', function () { switchView(this.dataset.view); });
    });

    $('btn-notif').addEventListener('click', function (e) {
      e.stopPropagation();
      $('notif-dropdown').classList.toggle('open');
    });
    document.addEventListener('click', function () { $('notif-dropdown').classList.remove('open'); });

    var searchTimer;
    $('panel-search').addEventListener('input', function () {
      var input = this;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        state.searchQuery = input.value.trim();
        if (state.activeView !== 'orders') switchView('orders');
        else renderOrdersTable();
      }, 300);
    });

    document.addEventListener('click', handleDelegatedClick);

    document.addEventListener('change', function (e) {
      if (e.target.id === 'filter-status') { state.filters.status = e.target.value; renderOrdersTable(); }
      if (e.target.id === 'filter-priority') { state.filters.priority = e.target.value; renderOrdersTable(); }
    });

    $('close-order-modal').addEventListener('click', closeOrderDetail);
    $('order-modal').addEventListener('click', function (e) { if (e.target === this) closeOrderDetail(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeOrderDetail(); closeSidebar(); $('notif-dropdown').classList.remove('open'); }
    });
  }

  /**
   * Maneja clicks delegados para elementos dinámicos del panel.
   * Usa data attributes para identificar la acción:
   * - data-detail: abrir modal de detalle
   * - data-advance: avanzar estado del pedido
   * - data-toggle-urgent: alternar prioridad
   * - data-cancel: cancelar pedido
   * - data-print: imprimir pedido
   * - data-notif-order: navegar desde notificación
   * - data-sort: ordenar columna de tabla
   * - data-order-id: click genérico en fila/card/chip
   *
   * @param {Event} e - Evento click.
   */
  function handleDelegatedClick(e) {
    var target;

    target = e.target.closest('[data-detail]');
    if (target) { e.stopPropagation(); openOrderDetail(parseInt(target.dataset.detail)); return; }

    target = e.target.closest('[data-advance]');
    if (target) { e.stopPropagation(); advanceStatus(parseInt(target.dataset.advance)); return; }

    target = e.target.closest('[data-toggle-urgent]');
    if (target) { toggleUrgent(parseInt(target.dataset.toggleUrgent)); return; }

    target = e.target.closest('[data-cancel]');
    if (target) { cancelOrder(parseInt(target.dataset.cancel)); return; }

    target = e.target.closest('[data-print]');
    if (target) { printOrder(parseInt(target.dataset.print)); return; }

    target = e.target.closest('[data-notif-order]');
    if (target) { $('notif-dropdown').classList.remove('open'); openOrderDetail(parseInt(target.dataset.notifOrder)); return; }

    target = e.target.closest('[data-sort]');
    if (target) {
      var col = target.dataset.sort;
      if (state.sortBy === col) { state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'; }
      else { state.sortBy = col; state.sortDir = 'asc'; }
      renderOrdersTable();
      return;
    }

    target = e.target.closest('.calendar-order-chip');
    if (target) { openOrderDetail(parseInt(target.dataset.orderId)); return; }

    target = e.target.closest('[data-order-id]');
    if (target) { openOrderDetail(parseInt(target.dataset.orderId)); return; }
  }


  // =============================================
  //  INICIO DEL MÓDULO
  // =============================================

  /**
   * Punto de entrada del panel.
   * Verifica autenticación y registra eventos globales.
   */
  function init() {
    checkAuth();
    bindGlobalEvents();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
