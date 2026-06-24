/**
 * Componentes de UI transversales del panel.
 * Toast, notificaciones dropdown, sidebar mobile, navegación de vistas y badges.
 *
 * @module panel/ui
 * @requires panel/utils
 * @requires panel/state
 */
(function (BP) {
  'use strict';

  var $ = BP.$, $$ = BP.$$, esc = BP.esc;

  // ---- TOAST ----

  /**
   * Muestra una notificación toast temporal (3 segundos).
   * @param {string} message
   * @param {'success'|'error'|'info'} [type='success']
   */
  BP.showToast = function (message, type) {
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
  };

  // ---- NOTIFICACIONES DROPDOWN ----

  /**
   * Genera las notificaciones del dropdown del topbar.
   * Detecta pedidos pendientes de aceptar y entregas dentro de 4 horas.
   */
  BP.renderNotifications = function () {
    var now = new Date();
    var items = [];

    BP.state.orders.forEach(function (o) {
      if (o.status === 'pendiente') {
        items.push({ urgent: true, icon: 'fa-clock-o', text: '<strong>' + esc(o.folio) + '</strong> pendiente de aceptar', time: BP.formatTimeAgo(o.createdAt), id: o.id });
      }
      if (o.status !== 'entregado' && o.status !== 'cancelado') {
        var hoursLeft = (new Date(o.deliveryDate) - now) / 3600000;
        if (hoursLeft > 0 && hoursLeft <= 4) {
          items.push({ urgent: true, icon: 'fa-exclamation-circle', text: '<strong>' + esc(o.folio) + '</strong> entrega próxima', time: BP.getTimeRemaining(o.deliveryDate), id: o.id });
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
  };

  // ---- BADGE PENDIENTES ----

  /** Actualiza el badge numérico de pedidos pendientes en el sidebar. */
  BP.updatePendingBadge = function () {
    var count = 0;
    BP.state.orders.forEach(function (o) { if (o.status === 'pendiente') count++; });
    var badge = $('sidebar-pending-count');
    badge.textContent = count;
    badge.style.display = count > 0 ? '' : 'none';
  };

  // ---- SIDEBAR MOBILE ----

  BP.openSidebar = function () {
    $('panel-sidebar').classList.add('open');
    $('sidebar-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  BP.closeSidebar = function () {
    $('panel-sidebar').classList.remove('open');
    $('sidebar-overlay').classList.remove('open');
    document.body.style.overflow = '';
  };

  // ---- NAVEGACIÓN DE VISTAS ----

  /**
   * Cambia la vista activa del panel.
   * Actualiza sidebar, título y renderiza la vista correspondiente.
   * @param {string} view - "dashboard", "orders" o "calendar".
   */
  BP.switchView = function (view) {
    BP.state.activeView = view;

    ['dashboard', 'orders', 'calendar'].forEach(function (v) {
      $('view-' + v).style.display = v === view ? '' : 'none';
    });

    $$('.sidebar-link[data-view]').forEach(function (el) {
      el.classList.toggle('active', el.dataset.view === view);
    });

    var titles = { dashboard: 'Dashboard', orders: 'Gestión de Pedidos', calendar: 'Calendario de Entregas' };
    $('topbar-title').textContent = titles[view] || '';

    if (view === 'dashboard') BP.renderDashboard();
    else if (view === 'orders') BP.renderOrdersView();
    else if (view === 'calendar') BP.renderCalendar();

    BP.closeSidebar();
  };

  /** Re-renderiza la vista activa (útil tras modificar un pedido). */
  BP.refreshCurrentView = function () {
    if (BP.state.activeView === 'dashboard') BP.renderDashboard();
    else if (BP.state.activeView === 'orders') BP.renderOrdersTable();
    else if (BP.state.activeView === 'calendar') BP.renderCalendar();
  };

})(window.BakeryPanel);
