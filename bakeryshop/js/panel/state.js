/**
 * Estado global y gestión de datos del panel.
 * Centraliza el state, CRUD de pedidos y persistencia en localStorage.
 *
 * @module panel/state
 * @requires panel/utils
 */
(function (BP) {
  'use strict';

  /**
   * Estado mutable compartido por todos los módulos.
   * @type {{ user: Object|null, orders: Array, activeView: string, filters: Object, sortBy: string, sortDir: string, searchQuery: string }}
   */
  BP.state = {
    user: null,
    orders: [],
    activeView: 'dashboard',
    filters: { status: 'all', priority: 'all' },
    sortBy: 'deliveryDate',
    sortDir: 'asc',
    searchQuery: ''
  };

  /**
   * Busca un pedido por ID en el estado local.
   * @param {number} id
   * @returns {Object|null}
   */
  BP.findOrder = function (id) {
    for (var i = 0; i < BP.state.orders.length; i++) {
      if (BP.state.orders[i].id === id) return BP.state.orders[i];
    }
    return null;
  };

  /** Carga pedidos desde localStorage o usa datos mock si no hay datos válidos. */
  BP.loadOrders = function () {
    var stored = localStorage.getItem('bakery_orders');
    if (stored) {
      try { BP.state.orders = JSON.parse(stored); return; } catch (e) { /* datos corruptos */ }
    }
    BP.resetOrders();
  };

  /** Restaura los pedidos al estado original desde MOCK_ORDERS. */
  BP.resetOrders = function () {
    BP.state.orders = JSON.parse(JSON.stringify(MOCK_ORDERS));
    BP.saveOrders();
  };

  /** Persiste los pedidos actuales en localStorage. */
  BP.saveOrders = function () {
    localStorage.setItem('bakery_orders', JSON.stringify(BP.state.orders));
  };

})(window.BakeryPanel);
