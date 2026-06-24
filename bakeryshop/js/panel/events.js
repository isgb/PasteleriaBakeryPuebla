/**
 * Registro de eventos e inicialización del panel.
 * Centraliza todos los event listeners y la delegación de clicks.
 * Debe cargarse último (después de todos los módulos).
 *
 * @module panel/events
 * @requires panel/* (todos los módulos)
 */
(function (BP) {
  'use strict';

  var $ = BP.$, $$ = BP.$$;

  /**
   * Registra todos los event listeners del panel.
   *
   * Flujo:
   * 1. Login: submit, limpia errores al escribir, toggle contraseña.
   * 2. Panel: logout, reset datos, sidebar mobile.
   * 3. Sidebar: links cambian vista activa.
   * 4. Notificaciones: toggle dropdown, cierre al click fuera.
   * 5. Búsqueda: debounce 300ms.
   * 6. Delegación: clicks en elementos dinámicos.
   * 7. Filtros: selects de estado y prioridad.
   * 8. Teclado: ESC cierra modales y sidebar.
   */
  function bindGlobalEvents() {
    // Login
    $('login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      $('login-error').classList.remove('visible');
      BP.login($('login-email').value.trim(), $('login-password').value);
    });

    $('login-email').addEventListener('input', function () { $('login-error').classList.remove('visible'); });
    $('login-password').addEventListener('input', function () { $('login-error').classList.remove('visible'); });

    $('btn-toggle-pass').addEventListener('click', function () {
      var inp = $('login-password');
      var isPass = inp.type === 'password';
      inp.type = isPass ? 'text' : 'password';
      this.querySelector('.fa').className = 'fa ' + (isPass ? 'fa-eye-slash' : 'fa-eye');
    });

    // Panel
    $('btn-logout').addEventListener('click', BP.logout);
    $('btn-reset-data').addEventListener('click', function () {
      BP.resetOrders();
      BP.showToast('Datos restaurados', 'info');
      BP.refreshCurrentView();
    });

    // Sidebar mobile
    $('topbar-hamburger').addEventListener('click', BP.openSidebar);
    $('sidebar-close').addEventListener('click', BP.closeSidebar);
    $('sidebar-overlay').addEventListener('click', BP.closeSidebar);

    // Navegación sidebar
    $$('.sidebar-link[data-view]').forEach(function (el) {
      el.addEventListener('click', function () { BP.switchView(this.dataset.view); });
    });

    // Notificaciones dropdown
    $('btn-notif').addEventListener('click', function (e) {
      e.stopPropagation();
      $('notif-dropdown').classList.toggle('open');
    });
    document.addEventListener('click', function () { $('notif-dropdown').classList.remove('open'); });

    // Búsqueda con debounce
    var searchTimer;
    $('panel-search').addEventListener('input', function () {
      var input = this;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        BP.state.searchQuery = input.value.trim();
        if (BP.state.activeView !== 'orders') BP.switchView('orders');
        else BP.renderOrdersTable();
      }, 300);
    });

    // Delegación de clicks para elementos renderizados dinámicamente
    document.addEventListener('click', handleDelegatedClick);

    // Filtros (selects dinámicos)
    document.addEventListener('change', function (e) {
      if (e.target.id === 'filter-status') { BP.state.filters.status = e.target.value; BP.renderOrdersTable(); }
      if (e.target.id === 'filter-priority') { BP.state.filters.priority = e.target.value; BP.renderOrdersTable(); }
    });

    // Modal
    $('close-order-modal').addEventListener('click', BP.closeOrderDetail);
    $('order-modal').addEventListener('click', function (e) { if (e.target === this) BP.closeOrderDetail(); });

    // ESC global
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { BP.closeOrderDetail(); BP.closeSidebar(); $('notif-dropdown').classList.remove('open'); }
    });
  }

  /**
   * Maneja clicks delegados para elementos dinámicos.
   * Data attributes → acción correspondiente.
   * El orden importa: botones específicos antes que contenedores genéricos.
   *
   * @param {Event} e
   */
  function handleDelegatedClick(e) {
    var target;

    target = e.target.closest('[data-detail]');
    if (target) { e.stopPropagation(); BP.openOrderDetail(parseInt(target.dataset.detail)); return; }

    target = e.target.closest('[data-advance]');
    if (target) { e.stopPropagation(); BP.advanceStatus(parseInt(target.dataset.advance)); return; }

    target = e.target.closest('[data-toggle-urgent]');
    if (target) { BP.toggleUrgent(parseInt(target.dataset.toggleUrgent)); return; }

    target = e.target.closest('[data-cancel]');
    if (target) { BP.cancelOrder(parseInt(target.dataset.cancel)); return; }

    target = e.target.closest('[data-print]');
    if (target) { BP.printOrder(parseInt(target.dataset.print)); return; }

    target = e.target.closest('[data-notif-order]');
    if (target) { $('notif-dropdown').classList.remove('open'); BP.openOrderDetail(parseInt(target.dataset.notifOrder)); return; }

    target = e.target.closest('[data-sort]');
    if (target) {
      var col = target.dataset.sort;
      if (BP.state.sortBy === col) BP.state.sortDir = BP.state.sortDir === 'asc' ? 'desc' : 'asc';
      else { BP.state.sortBy = col; BP.state.sortDir = 'asc'; }
      BP.renderOrdersTable();
      return;
    }

    target = e.target.closest('.calendar-order-chip');
    if (target) { BP.openOrderDetail(parseInt(target.dataset.orderId)); return; }

    target = e.target.closest('[data-order-id]');
    if (target) { BP.openOrderDetail(parseInt(target.dataset.orderId)); return; }
  }

  // ---- INICIALIZACIÓN ----

  /** Punto de entrada: verifica auth y registra eventos. */
  document.addEventListener('DOMContentLoaded', function () {
    BP.checkAuth();
    bindGlobalEvents();
  });

})(window.BakeryPanel);
