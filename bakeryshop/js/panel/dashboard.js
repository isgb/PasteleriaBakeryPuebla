/**
 * Vista Dashboard del panel.
 * Renderiza saludo, alertas, métricas, pedidos recientes, producción y top producto.
 *
 * @module panel/dashboard
 * @requires panel/utils
 * @requires panel/state
 * @requires panel/ui
 */
(function (BP) {
  'use strict';

  var $ = BP.$, esc = BP.esc, escAttr = BP.escAttr;

  /**
   * Renderiza el dashboard completo.
   *
   * Flujo:
   * 1. Saludo dinámico según hora del día.
   * 2. Alertas de entregas próximas y urgentes.
   * 3. 5 tarjetas de métricas.
   * 4. Tabla de pedidos recientes.
   * 5. Gráfico de producción + producto más vendido.
   * 6. Actualiza badges y notificaciones.
   */
  BP.renderDashboard = function () {
    var hour = new Date().getHours();
    var greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
    $('dash-greeting').innerHTML = '<h2>' + greeting + ', ' + esc(BP.state.user.name) + '</h2><p>' + BP.formatFullDate(new Date()) + '</p>';

    renderAlerts();
    renderStatCards();
    renderRecentOrders();
    renderProductionChart();
    renderTopProduct();
    BP.updatePendingBadge();
    BP.renderNotifications();
  };

  /** Genera alertas de entregas < 2 horas y pedidos urgentes del día. */
  function renderAlerts() {
    var now = new Date();
    var alerts = [];
    var urgentToday = 0;

    BP.state.orders.forEach(function (o) {
      if (o.status === 'entregado' || o.status === 'cancelado') return;
      var hoursLeft = (new Date(o.deliveryDate) - now) / 3600000;
      if (hoursLeft > 0 && hoursLeft <= 2) {
        alerts.push({ danger: true, text: '<strong>' + esc(o.folio) + '</strong> — Entrega en menos de 2 horas (' + esc(o.client.name) + ')' });
      }
      if (o.priority === 'urgent' && BP.isToday(o.deliveryDate)) urgentToday++;
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

  /** Renderiza las 5 tarjetas de métricas (pendientes, proceso, listos, entregados, ingresos). */
  function renderStatCards() {
    var counts = { pendiente: 0, enProceso: 0, listo: 0, entregados: 0, ingresos: 0 };

    BP.state.orders.forEach(function (o) {
      if (o.status === 'pendiente') counts.pendiente++;
      if (o.status === 'aceptado' || o.status === 'preparando' || o.status === 'decorando') counts.enProceso++;
      if (o.status === 'listo') counts.listo++;
      if (o.status === 'entregado' && BP.isRecent(o.deliveryDate, 7)) {
        counts.entregados++;
        counts.ingresos += o.total;
      }
    });

    var cards = [
      { css: 'pending',   icon: 'fa-clock-o',      value: counts.pendiente,  label: 'Pendientes' },
      { css: 'preparing', icon: 'fa-cog fa-spin',  value: counts.enProceso,  label: 'En Proceso' },
      { css: 'ready',     icon: 'fa-check-circle', value: counts.listo,      label: 'Listos' },
      { css: 'delivered', icon: 'fa-truck',         value: counts.entregados, label: 'Entregados (7d)' },
      { css: 'revenue',   icon: 'fa-money',         value: '$' + counts.ingresos.toLocaleString('es-MX'), label: 'Ingresos (7d)' }
    ];

    var html = '';
    cards.forEach(function (c) {
      html +=
        '<div class="dash-stat-card">' +
          '<div class="dash-stat-icon ' + c.css + '"><i class="fa ' + c.icon + '"></i></div>' +
          '<div><div class="dash-stat-value">' + c.value + '</div><div class="dash-stat-label">' + c.label + '</div></div>' +
        '</div>';
    });
    $('dash-stats').innerHTML = html;
  }

  /** Muestra los 5 pedidos más recientes en tabla compacta. */
  function renderRecentOrders() {
    var recent = BP.state.orders.slice()
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
          '<td>' + BP.formatShortDate(o.deliveryDate) + '</td>' +
          '<td>' + BP.statusBadge(o.status) + '</td>' +
          '<td><strong>$' + o.total.toLocaleString('es-MX') + '</strong></td>' +
        '</tr>';
    });

    $('dash-recent-orders').innerHTML =
      '<table class="orders-table" style="margin:0"><thead><tr>' +
        '<th>Folio</th><th>Cliente</th><th>Entrega</th><th>Estado</th><th>Total</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  /** Gráfico de barras CSS con sabores más pedidos. */
  function renderProductionChart() {
    var counts = {};
    BP.state.orders.forEach(function (o) {
      if (o.status !== 'cancelado') counts[o.flavor] = (counts[o.flavor] || 0) + 1;
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
    BP.state.orders.forEach(function (o) {
      if (o.status === 'cancelado') return;
      o.products.forEach(function (p) {
        if (!counts[p.name]) counts[p.name] = { qty: 0, image: p.image };
        counts[p.name].qty += p.qty;
      });
    });

    var topName = null, topQty = 0;
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
        '<div><div class="top-product-name">' + esc(topName) + '</div>' +
        '<div class="top-product-count"><i class="fa fa-shopping-cart"></i> ' + topQty + ' unidades vendidas</div></div>' +
      '</div>';
  }

})(window.BakeryPanel);
