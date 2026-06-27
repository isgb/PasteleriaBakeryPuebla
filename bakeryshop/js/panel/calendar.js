/**
 * Vista de calendario semanal de entregas.
 * Muestra 7 días (Lun-Dom) con los pedidos programados para cada día.
 *
 * @module panel/calendar
 * @requires panel/utils
 * @requires panel/state
 */
(function (BP) {
  'use strict';

  var $ = BP.$, esc = BP.esc, pad = BP.pad;

  /**
   * Renderiza el calendario de la semana actual.
   *
   * Flujo:
   * 1. Calcula lunes de la semana actual.
   * 2. Genera 7 columnas con pedidos del día como chips clickeables.
   * 3. Resalta el día actual con clase "today".
   */
  BP.renderCalendar = function () {
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var dow = today.getDay();
    var monday = new Date(today);
    monday.setDate(today.getDate() - ((dow + 6) % 7));

    var sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    $('calendar-week-range').textContent =
      monday.getDate() + ' ' + BP.MESES_CORTO[monday.getMonth()] + ' — ' +
      sunday.getDate() + ' ' + BP.MESES_CORTO[sunday.getMonth()] + ' ' + sunday.getFullYear();

    var html = '';
    for (var i = 0; i < 7; i++) {
      var date = new Date(monday);
      date.setDate(monday.getDate() + i);
      var isTodayDate = date.getTime() === today.getTime();
      var dateKey = date.toISOString().split('T')[0];

      var dayOrders = BP.state.orders.filter(function (o) {
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
              BP.statusBadge(o.status) +
            '</div>';
        });
      }

      html +=
        '<div class="calendar-day' + (isTodayDate ? ' today' : '') + '">' +
          '<div class="calendar-day-header"><span class="calendar-day-number">' + date.getDate() + '</span> ' + BP.DIAS_CORTO[i] + '</div>' +
          '<div class="calendar-day-body">' + chipsHtml + '</div>' +
        '</div>';
    }
    $('calendar-grid').innerHTML = html;
  };

})(window.BakeryPanel);
