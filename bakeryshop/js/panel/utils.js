/**
 * Utilidades compartidas del panel.
 * Helpers DOM, escape XSS, formato de fechas, generadores de badges.
 * No tiene dependencias externas — debe cargarse primero.
 *
 * @module panel/utils
 */
(function (BP) {
  'use strict';

  // ---- DOM ----

  /** @param {string} id @returns {HTMLElement|null} */
  function $(id) { return document.getElementById(id); }

  /** @param {string} sel @returns {NodeList} */
  function $$(sel) { return document.querySelectorAll(sel); }

  // ---- CONSTANTES DE FECHA ----

  var MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  var MESES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  var DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  /**
   * Máquina de estados del workflow de pedidos.
   * Flujo: pendiente → aceptado → preparando → decorando → listo → entregado.
   * Estados finales (sin next): entregado, cancelado.
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

  // ---- ESCAPE / SEGURIDAD ----

  /** @param {number} n @returns {string} Número con zero-padding (9 → "09"). */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /**
   * Escapa texto para prevenir XSS en innerHTML.
   * @param {string} str @returns {string}
   */
  function esc(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Escapa texto para uso seguro en atributos HTML.
   * @param {string} str @returns {string}
   */
  function escAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ---- BADGES ----

  /**
   * Genera HTML de un badge de estado con color por CSS.
   * @param {string} status - Clave del estado (ej: "preparando").
   * @returns {string}
   */
  function statusBadge(status) {
    return '<span class="status-badge status-' + status + '"><span class="status-dot"></span>' + STATUSES[status].label + '</span>';
  }

  /**
   * Genera HTML de un badge de prioridad.
   * @param {string} priority - "urgent" o "normal".
   * @returns {string}
   */
  function priorityBadge(priority) {
    if (priority === 'urgent') return '<span class="priority-badge urgent"><i class="fa fa-bolt"></i> Urgente</span>';
    return '<span class="priority-badge normal">Normal</span>';
  }

  // ---- FORMATO DE FECHAS ----

  /** @param {string} dateStr - ISO. @returns {string} "23 Jun 14:00". */
  function formatShortDate(dateStr) {
    var d = new Date(dateStr);
    return d.getDate() + ' ' + MESES_CORTO[d.getMonth()] + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  /** @param {Date} d @returns {string} "Martes 23 de junio de 2026". */
  function formatFullDate(d) {
    return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES_LARGO[d.getMonth()] + ' de ' + d.getFullYear();
  }

  /** @param {string} dateStr - ISO. @returns {string} "23 Jun 2026, 14:00". */
  function formatFullDateTime(dateStr) {
    var d = new Date(dateStr);
    return d.getDate() + ' ' + MESES_CORTO[d.getMonth()] + ' ' + d.getFullYear() + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  /**
   * Calcula etiqueta relativa respecto a hoy ("Hoy 14:00", "Mañana", "Hace 3 días").
   * @param {string} dateStr - ISO.
   * @returns {{ text: string, cls: string }}
   */
  function getRelativeDate(dateStr) {
    var d = new Date(dateStr);
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var target = new Date(d); target.setHours(0, 0, 0, 0);
    var diff = Math.round((target - today) / 86400000);

    if (diff === 0) return { text: 'Hoy ' + pad(d.getHours()) + ':' + pad(d.getMinutes()), cls: 'today' };
    if (diff === 1) return { text: 'Mañana', cls: 'tomorrow' };
    if (diff === -1) return { text: 'Ayer', cls: 'past' };
    if (diff < -1) return { text: 'Hace ' + Math.abs(diff) + ' días', cls: 'past' };
    return { text: 'En ' + diff + ' días', cls: '' };
  }

  /**
   * Tiempo restante hasta una fecha futura.
   * @param {string} dateStr - ISO.
   * @returns {string|null} "2h 30min", "1d 5h", o null si ya pasó.
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
   * Tiempo transcurrido desde una fecha pasada.
   * @param {string} dateStr - ISO.
   * @returns {string} "15 min", "3 horas", "2 días".
   */
  function formatTimeAgo(dateStr) {
    var mins = (new Date() - new Date(dateStr)) / 60000;
    if (mins < 60) return Math.round(mins) + ' min';
    if (mins < 1440) return Math.round(mins / 60) + ' horas';
    return Math.round(mins / 1440) + ' días';
  }

  /** @param {string} dateStr @returns {boolean} */
  function isToday(dateStr) {
    var d = new Date(dateStr), t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  }

  /** @param {string} dateStr @param {number} days @returns {boolean} */
  function isRecent(dateStr, days) {
    var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    return new Date(dateStr) >= cutoff;
  }

  // ---- EXPORTS ----

  BP.$ = $;
  BP.$$ = $$;
  BP.pad = pad;
  BP.esc = esc;
  BP.escAttr = escAttr;
  BP.STATUSES = STATUSES;
  BP.MESES_CORTO = MESES_CORTO;
  BP.DIAS_CORTO = DIAS_CORTO;
  BP.statusBadge = statusBadge;
  BP.priorityBadge = priorityBadge;
  BP.formatShortDate = formatShortDate;
  BP.formatFullDate = formatFullDate;
  BP.formatFullDateTime = formatFullDateTime;
  BP.getRelativeDate = getRelativeDate;
  BP.getTimeRemaining = getTimeRemaining;
  BP.formatTimeAgo = formatTimeAgo;
  BP.isToday = isToday;
  BP.isRecent = isRecent;

})(window.BakeryPanel = window.BakeryPanel || {});
