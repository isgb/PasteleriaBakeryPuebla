/**
 * Vista de lista de pedidos.
 * Toolbar con filtros, tabla desktop, cards mobile, ordenamiento y búsqueda.
 *
 * @module panel/orders
 * @requires panel/utils
 * @requires panel/state
 * @requires panel/ui
 */
(function (BP) {
  'use strict';

  var $ = BP.$, esc = BP.esc;

  /** Renderiza la vista completa: toolbar + tabla + badge. */
  BP.renderOrdersView = function () {
    renderToolbar();
    BP.renderOrdersTable();
    BP.updatePendingBadge();
  };

  /** Genera los selects de filtro por estado y prioridad. */
  function renderToolbar() {
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

    $('filter-status').value = BP.state.filters.status;
    $('filter-priority').value = BP.state.filters.priority;
  }

  /**
   * Renderiza la tabla (desktop) y cards (mobile) con filtros y orden aplicados.
   * También se invoca desde refreshCurrentView tras cambios de estado.
   */
  BP.renderOrdersTable = function () {
    var filtered = getFilteredOrders();
    $('orders-count').textContent = filtered.length + ' pedido(s)';

    if (filtered.length === 0) {
      $('orders-tbody').innerHTML = '';
      $('orders-card-list').innerHTML = '';
      $('orders-empty').style.display = 'block';
      return;
    }
    $('orders-empty').style.display = 'none';

    var sortIcon = BP.state.sortDir === 'asc' ? 'fa-sort-asc' : 'fa-sort-desc';
    var cols = [
      { key: 'folio', label: 'Folio' }, { key: 'client', label: 'Cliente' },
      { key: null, label: 'Producto' }, { key: 'deliveryDate', label: 'Entrega' },
      { key: null, label: 'Prioridad' }, { key: 'status', label: 'Estado' },
      { key: 'total', label: 'Total' }, { key: null, label: 'Acciones' }
    ];

    var thead = '<tr>';
    cols.forEach(function (col) {
      var icon = col.key ? ' <i class="fa ' + (BP.state.sortBy === col.key ? sortIcon : 'fa-sort') + '"></i>' : '';
      var attr = col.key ? ' data-sort="' + col.key + '"' : '';
      thead += '<th' + attr + '>' + col.label + icon + '</th>';
    });
    $('orders-thead').innerHTML = thead + '</tr>';

    var tbody = '', cards = '';
    filtered.forEach(function (o) {
      tbody += buildTableRow(o);
      cards += buildMobileCard(o);
    });
    $('orders-tbody').innerHTML = tbody;
    $('orders-card-list').innerHTML = cards;
  };

  /**
   * Genera HTML de una fila de tabla para un pedido.
   * @param {Object} o - Pedido.
   * @returns {string}
   */
  function buildTableRow(o) {
    var rel = BP.getRelativeDate(o.deliveryDate);
    var products = o.products.map(function (p) { return p.name; }).join(', ');
    var info = BP.STATUSES[o.status];
    var advanceBtn = info.next
      ? '<button class="order-action-btn" data-advance="' + o.id + '" title="' + info.nextLabel + '"><i class="fa fa-arrow-right"></i></button>'
      : '';

    return (
      '<tr class="' + (o.priority === 'urgent' ? 'urgent-row' : '') + '" data-order-id="' + o.id + '">' +
        '<td><span class="order-folio">' + esc(o.folio) + '</span></td>' +
        '<td><span class="order-client-name">' + esc(o.client.name) + '</span><br>' +
          '<span class="order-client-phone"><i class="fa fa-phone"></i> ' + esc(o.client.phone) + '</span></td>' +
        '<td><span class="order-product-name">' + esc(products.length > 30 ? products.substring(0, 30) + '...' : products) + '</span></td>' +
        '<td><span class="order-delivery-date">' + BP.formatShortDate(o.deliveryDate) + '</span>' +
          '<div class="order-delivery-relative ' + rel.cls + '">' + rel.text + '</div></td>' +
        '<td>' + BP.priorityBadge(o.priority) + '</td>' +
        '<td>' + BP.statusBadge(o.status) + '</td>' +
        '<td><strong>$' + o.total.toLocaleString('es-MX') + '</strong></td>' +
        '<td><div class="order-actions-cell">' +
          '<button class="order-action-btn" data-detail="' + o.id + '" title="Ver detalle"><i class="fa fa-eye"></i></button>' +
          advanceBtn + '</div></td>' +
      '</tr>'
    );
  }

  /**
   * Genera HTML de una card mobile para un pedido.
   * @param {Object} o - Pedido.
   * @returns {string}
   */
  function buildMobileCard(o) {
    var rel = BP.getRelativeDate(o.deliveryDate);
    var products = o.products.map(function (p) { return p.name; }).join(', ');

    return (
      '<div class="order-card-mobile ' + (o.priority === 'urgent' ? 'urgent' : '') + '" data-order-id="' + o.id + '">' +
        '<div class="order-card-mobile-header"><span class="order-folio">' + esc(o.folio) + '</span>' + BP.statusBadge(o.status) + '</div>' +
        '<div class="order-card-mobile-body"><div>' +
          '<p><strong>' + esc(o.client.name) + '</strong></p>' +
          '<p>' + esc(products.length > 25 ? products.substring(0, 25) + '...' : products) + '</p>' +
          '<p><i class="fa fa-calendar"></i> ' + BP.formatShortDate(o.deliveryDate) +
            ' <span class="order-delivery-relative ' + rel.cls + '">' + rel.text + '</span></p></div>' +
          '<div class="order-card-mobile-total">$' + o.total.toLocaleString('es-MX') + '</div></div>' +
      '</div>'
    );
  }

  /**
   * Filtra y ordena pedidos según filtros activos, búsqueda y columna de orden.
   * @returns {Object[]}
   */
  function getFilteredOrders() {
    var s = BP.state;

    var filtered = s.orders.filter(function (o) {
      if (s.filters.status !== 'all' && o.status !== s.filters.status) return false;
      if (s.filters.priority !== 'all' && o.priority !== s.filters.priority) return false;
      if (s.searchQuery) {
        var q = s.searchQuery.toLowerCase();
        if (o.folio.toLowerCase().indexOf(q) === -1 &&
            o.client.name.toLowerCase().indexOf(q) === -1 &&
            o.client.phone.indexOf(q) === -1) return false;
      }
      return true;
    });

    filtered.sort(function (a, b) {
      var va, vb;
      switch (s.sortBy) {
        case 'folio':  va = a.folio;       vb = b.folio;       break;
        case 'client': va = a.client.name;  vb = b.client.name;  break;
        case 'status': va = a.status;       vb = b.status;       break;
        case 'total':  va = a.total;        vb = b.total;        break;
        default:       va = new Date(a.deliveryDate); vb = new Date(b.deliveryDate);
      }
      var cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return s.sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }

})(window.BakeryPanel);
