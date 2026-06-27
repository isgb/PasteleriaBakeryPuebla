/**
 * Modal de detalle de pedido y acciones de mutación.
 * Abre/cierra el modal, construye cada sección del detalle,
 * y ejecuta cambios de estado (avanzar, cancelar, urgente, imprimir).
 *
 * @module panel/order-detail
 * @requires panel/utils
 * @requires panel/state
 * @requires panel/ui
 */
(function (BP) {
  'use strict';

  var $ = BP.$, esc = BP.esc, escAttr = BP.escAttr;

  // ---- MODAL ----

  /**
   * Abre el modal con la ficha completa de un pedido.
   * Delega la construcción de cada sección a funciones build*.
   * @param {number} id - ID del pedido.
   */
  BP.openOrderDetail = function (id) {
    var order = BP.findOrder(id);
    if (!order) return;

    var rel = BP.getRelativeDate(order.deliveryDate);
    var timeLeft = BP.getTimeRemaining(order.deliveryDate);

    $('order-modal-body').innerHTML =
      '<div class="order-detail">' +
        buildHeader(order, rel, timeLeft) +
        buildInfo(order, rel) +
        (order.notes ? '<div class="order-notes"><strong><i class="fa fa-sticky-note"></i> Notas del cliente</strong>' + esc(order.notes) + '</div>' : '') +
        '<h4 style="font-size:0.85rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:1rem">Productos</h4>' +
        buildProducts(order) +
        '<div class="order-total-row"><span>Total del Pedido</span><span>$' + order.total.toLocaleString('es-MX') + '</span></div>' +
        '<h4 style="font-size:0.85rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:1.5rem 0 1rem">Línea de Tiempo</h4>' +
        buildTimeline(order) +
        '<div class="order-detail-actions">' + buildActions(order) + '</div>' +
      '</div>';

    $('order-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  /** Cierra el modal de detalle. */
  BP.closeOrderDetail = function () {
    $('order-modal').classList.remove('open');
    document.body.style.overflow = '';
  };

  // ---- BUILD HELPERS ----

  function buildHeader(order, rel, timeLeft) {
    var timeHtml = timeLeft ? '<span style="font-size:0.82rem;color:var(--gray-600)"><i class="fa fa-clock-o"></i> ' + timeLeft + '</span>' : '';
    return (
      '<div class="order-detail-header">' +
        '<span class="order-detail-folio">' + esc(order.folio) + '</span>' +
        '<div class="order-detail-meta">' + BP.statusBadge(order.status) + ' ' + BP.priorityBadge(order.priority) + ' ' + timeHtml + '</div>' +
      '</div>'
    );
  }

  function buildInfo(order, rel) {
    return (
      '<div class="order-info-grid">' +
        '<div class="order-info-card"><h4>Cliente</h4>' +
          '<p><i class="fa fa-user"></i> ' + esc(order.client.name) + '</p>' +
          '<p><i class="fa fa-phone"></i> ' + esc(order.client.phone) + '</p>' +
          '<p><i class="fa fa-envelope"></i> ' + esc(order.client.email) + '</p></div>' +
        '<div class="order-info-card"><h4>Entrega</h4>' +
          '<p><i class="fa fa-calendar"></i> ' + BP.formatFullDateTime(order.deliveryDate) + '</p>' +
          '<p class="order-delivery-relative ' + rel.cls + '" style="font-weight:600">' + rel.text + '</p>' +
          '<p><i class="fa fa-birthday-cake"></i> ' + esc(order.flavor) + ' — ' + esc(order.decoration) + '</p>' +
          '<p><i class="fa fa-arrows-alt"></i> ' + esc(order.size) + '</p></div>' +
      '</div>'
    );
  }

  function buildProducts(order) {
    var html = '<div class="order-products-list">';
    order.products.forEach(function (p) {
      html +=
        '<div class="order-product-item">' +
          '<img src="' + escAttr(p.image) + '" alt="' + escAttr(p.name) + '">' +
          '<div class="order-product-item-info">' +
            '<div class="order-product-item-name">' + esc(p.name) + '</div>' +
            '<div class="order-product-item-detail">Cantidad: ' + p.qty + ' &middot; $' + p.price.toLocaleString('es-MX') + ' c/u</div></div>' +
          '<div class="order-product-item-total">$' + (p.price * p.qty).toLocaleString('es-MX') + '</div></div>';
    });
    return html + '</div>';
  }

  /** El último evento se marca "active", los anteriores "completed". */
  function buildTimeline(order) {
    var html = '<div class="order-timeline">';
    var lastIdx = order.timeline.length - 1;
    order.timeline.forEach(function (t, i) {
      html +=
        '<div class="timeline-item ' + (i === lastIdx ? 'active' : 'completed') + '">' +
          '<div class="timeline-dot"></div>' +
          '<div class="timeline-status">' + BP.STATUSES[t.status].label + '</div>' +
          '<div class="timeline-date">' + BP.formatFullDateTime(t.date) + '</div>' +
          (t.note ? '<div class="timeline-note">' + esc(t.note) + '</div>' : '') +
        '</div>';
    });
    return html + '</div>';
  }

  /** Genera botones de acción según el estado (avanzar, urgente, cancelar, imprimir). */
  function buildActions(order) {
    var info = BP.STATUSES[order.status];
    var html = '';
    var isActive = order.status !== 'entregado' && order.status !== 'cancelado';

    if (info.next) {
      html += '<button class="btn-panel btn-panel-primary" data-advance="' + order.id + '"><i class="fa fa-arrow-right"></i> ' + info.nextLabel + '</button>';
    }
    if (isActive) {
      html += '<button class="btn-panel btn-panel-warning" data-toggle-urgent="' + order.id + '"><i class="fa fa-exclamation-triangle"></i> ' + (order.priority === 'urgent' ? 'Quitar Urgente' : 'Marcar Urgente') + '</button>';
      html += '<button class="btn-panel btn-panel-danger" data-cancel="' + order.id + '"><i class="fa fa-times"></i> Cancelar</button>';
    }
    html += '<button class="btn-panel btn-panel-secondary" data-print="' + order.id + '"><i class="fa fa-print"></i> Imprimir</button>';
    return html;
  }

  // ---- ACCIONES DE MUTACIÓN ----

  /** Refresca vista y modal si está abierto tras un cambio. */
  function afterMutation(id) {
    BP.saveOrders();
    BP.refreshCurrentView();
    if ($('order-modal').classList.contains('open')) BP.openOrderDetail(id);
  }

  /**
   * Avanza al siguiente estado del workflow y registra en timeline.
   * @param {number} id
   */
  BP.advanceStatus = function (id) {
    var order = BP.findOrder(id);
    if (!order || !BP.STATUSES[order.status].next) return;

    var newStatus = BP.STATUSES[order.status].next;
    order.status = newStatus;
    order.timeline.push({ status: newStatus, date: new Date().toISOString(), note: BP.STATUSES[newStatus].label + ' por ' + BP.state.user.name });
    if (newStatus === 'aceptado' && !order.assignedTo) order.assignedTo = BP.state.user.name;

    BP.showToast('Pedido ' + order.folio + ' → ' + BP.STATUSES[newStatus].label, 'success');
    afterMutation(id);
  };

  /**
   * Alterna la prioridad entre "urgent" y "normal".
   * @param {number} id
   */
  BP.toggleUrgent = function (id) {
    var order = BP.findOrder(id);
    if (!order) return;
    order.priority = order.priority === 'urgent' ? 'normal' : 'urgent';
    BP.showToast('Prioridad: ' + (order.priority === 'urgent' ? 'URGENTE' : 'Normal'), order.priority === 'urgent' ? 'error' : 'info');
    afterMutation(id);
  };

  /**
   * Cancela un pedido y registra en timeline.
   * @param {number} id
   */
  BP.cancelOrder = function (id) {
    var order = BP.findOrder(id);
    if (!order) return;
    order.status = 'cancelado';
    order.timeline.push({ status: 'cancelado', date: new Date().toISOString(), note: 'Cancelado por ' + BP.state.user.name });
    BP.showToast('Pedido ' + order.folio + ' cancelado', 'error');
    afterMutation(id);
  };

  /**
   * Abre detalle e invoca window.print().
   * @param {number} id
   */
  BP.printOrder = function (id) {
    BP.openOrderDetail(id);
    setTimeout(function () { window.print(); }, 300);
  };

})(window.BakeryPanel);
