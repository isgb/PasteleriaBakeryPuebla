/**
 * Autenticación mock del panel.
 * Valida credenciales contra MOCK_USERS y persiste sesión en localStorage.
 *
 * Flujo: checkAuth → login/showLogin → showPanel → switchView('dashboard')
 *
 * @module panel/auth
 * @requires panel/utils
 * @requires panel/state
 * @requires panel/ui (showToast, switchView)
 */
(function (BP) {
  'use strict';

  var $ = BP.$;

  /**
   * Verifica si hay sesión activa al cargar la página.
   * Si es válida, carga pedidos y muestra el panel. Si no, muestra login.
   */
  BP.checkAuth = function () {
    var session = localStorage.getItem('bakery_session');
    if (session) {
      try {
        BP.state.user = JSON.parse(session);
        BP.loadOrders();
        BP.showPanel();
      } catch (e) {
        localStorage.removeItem('bakery_session');
        BP.showLogin();
      }
    } else {
      BP.showLogin();
    }
  };

  /**
   * Intenta autenticar contra MOCK_USERS.
   * Si tiene éxito, persiste sesión y carga el panel.
   *
   * @param {string} email
   * @param {string} password
   */
  BP.login = function (email, password) {
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

    BP.state.user = { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar };
    localStorage.setItem('bakery_session', JSON.stringify(BP.state.user));
    BP.loadOrders();
    BP.showPanel();
    BP.showToast('Bienvenido, ' + user.name, 'success');
  };

  /** Cierra sesión, limpia localStorage y muestra login. */
  BP.logout = function () {
    BP.state.user = null;
    localStorage.removeItem('bakery_session');
    BP.showLogin();
    BP.showToast('Sesión cerrada', 'info');
  };

  /** Muestra pantalla de login y oculta el panel. */
  BP.showLogin = function () {
    $('login-screen').style.display = '';
    $('panel').style.display = 'none';
    $('login-email').focus();
  };

  /** Muestra el panel, actualiza info del usuario en sidebar y carga dashboard. */
  BP.showPanel = function () {
    $('login-screen').style.display = 'none';
    $('panel').style.display = '';
    $('sidebar-avatar').textContent = BP.state.user.avatar;
    $('sidebar-user-name').textContent = BP.state.user.name;
    $('sidebar-user-role').textContent = BP.state.user.role;
    BP.switchView('dashboard');
  };

})(window.BakeryPanel);
