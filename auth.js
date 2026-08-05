/**
 * auth.js
 * ------------------------------------------------------------------
 * Single-admin authentication for VKM CRM — backed by the real
 * Spring Boot AdminController running on http://localhost:8092.
 *
 * Endpoints used (from AdminController):
 *   POST /api/admin/login            -> { success, message, data: { token, ... } }
 *   GET  /api/admin/validate-token   -> 200 OK if the Bearer token is still valid
 *
 * IMPORTANT: The exact JSON field names below (token / name / role) are my
 * best guess based on common Spring naming conventions. Open your actual
 * LoginResponseDto and check what fields it returns, then fix the section
 * marked "ADJUST THESE FIELD NAMES" if they don't match.
 *
 * CORS: since the frontend (e.g. http://127.0.0.1:5500) and backend
 * (http://localhost:8092) are different origins, your Spring Boot app
 * needs CORS enabled for this origin, e.g. @CrossOrigin(origins = "*")
 * on AdminController, or a global CorsConfig bean. Without this, every
 * fetch() call below will fail with a CORS error in the browser console.
 *
 * Include this file on EVERY page (path is relative to that page):
 *   root page (index.html):        <script src="./auth.js"></script>
 *   subfolder pages (dashboard/, customer/, productM/, Quotation/, reports/):
 *                                   <script src="../auth.js"></script>
 *
 * On protected pages call Auth.requireAuth() as the very first thing in
 * <head>, right after loading this script.
 * ------------------------------------------------------------------
 */

(function (global) {
  'use strict';

  // Same backend host used by productm.js / quotation.js / customer.js
  const API_BASE = 'http://localhost:8092/api';

  // ---- localStorage keys ----
  const STORAGE_KEYS = {
    token: 'authToken',
    isLoggedIn: 'isLoggedIn',
    adminEmail: 'adminEmail',
    adminName: 'adminName',
    adminRole: 'adminRole',
    loginTime: 'loginTime',
    rememberedEmail: 'rememberedEmail',
  };

  // requireAuth()/logout() are only ever called from the one-level-deep
  // subfolder pages, so "../index.html" always points back to the root login page.
  const LOGIN_PATH = '../index.html';

  /**
   * Call the real backend to authenticate.
   * @param {string} email
   * @param {string} password
   * @param {boolean} [rememberMe=false]
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async function login(email, password, rememberMe) {
    email = (email || '').trim();
    password = (password || '').trim();

    let res;
    try {
      res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ---- ADJUST if LoginRequestDto uses different field names ----
        body: JSON.stringify({ email, password }),
      });
    } catch (networkErr) {
      return {
        success: false,
        message: 'Could not reach the server. Is the backend running on http://localhost:8092?',
      };
    }

    const body = await res.json().catch(() => null);

    if (!res.ok || !body || body.success === false) {
      return {
        success: false,
        message: (body && body.message) || 'Invalid email or password',
      };
    }

    // ---- ADJUST THESE FIELD NAMES to match your actual LoginResponseDto ----
    const payload = body.data || {};
    const token = payload.token;
    const name = payload.name || payload.adminName || 'Administrator';
    const role = payload.role || 'ADMIN';
    // -------------------------------------------------------------------

    if (!token) {
      return {
        success: false,
        message: 'Login succeeded but no token was found in the response. Check LoginResponseDto field names in auth.js.',
      };
    }

    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.isLoggedIn, 'true');
    localStorage.setItem(STORAGE_KEYS.adminEmail, email);
    localStorage.setItem(STORAGE_KEYS.adminName, name);
    localStorage.setItem(STORAGE_KEYS.adminRole, role);
    localStorage.setItem(STORAGE_KEYS.loginTime, new Date().toISOString());

    if (rememberMe) {
      localStorage.setItem(STORAGE_KEYS.rememberedEmail, email);
    } else {
      localStorage.removeItem(STORAGE_KEYS.rememberedEmail);
    }

    return { success: true };
  }

  /**
   * Clear the local session and send the user back to the login page.
   * (There's no /logout endpoint on the backend, so this is purely
   * client-side — the JWT just stops being sent after this.)
   * @param {string} [redirectPath]
   */
  function logout(redirectPath) {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.isLoggedIn);
    localStorage.removeItem(STORAGE_KEYS.adminEmail);
    localStorage.removeItem(STORAGE_KEYS.adminName);
    localStorage.removeItem(STORAGE_KEYS.adminRole);
    localStorage.removeItem(STORAGE_KEYS.loginTime);

    global.location.href = redirectPath || LOGIN_PATH;
  }

  /** Fast, local-only check — no network call. Used to gate page rendering. */
  function isAuthenticated() {
    return (
      localStorage.getItem(STORAGE_KEYS.isLoggedIn) === 'true' &&
      !!localStorage.getItem(STORAGE_KEYS.token)
    );
  }

  /** @returns {string|null} the raw JWT, for pages that need to call other protected APIs */
  function getToken() {
    return localStorage.getItem(STORAGE_KEYS.token);
  }

  /** @returns {{Authorization: string}|{}} spread this into any fetch() headers */
  function getAuthHeader() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /** @returns {{email:string,name:string,role:string,loginTime:string}|null} */
  function getCurrentAdmin() {
    if (!isAuthenticated()) return null;
    return {
      email: localStorage.getItem(STORAGE_KEYS.adminEmail),
      name: localStorage.getItem(STORAGE_KEYS.adminName),
      role: localStorage.getItem(STORAGE_KEYS.adminRole),
      loginTime: localStorage.getItem(STORAGE_KEYS.loginTime),
    };
  }

  /**
   * Guard for protected pages. Call this at the top of every page other
   * than the login page. Redirects to login immediately if there's no
   * local session, then quietly double-checks the token is still valid
   * with the backend (handles expired/revoked tokens).
   * @param {string} [redirectPath]
   */
  function requireAuth(redirectPath) {
    if (!isAuthenticated()) {
      global.location.href = redirectPath || LOGIN_PATH;
      return;
    }
    validateSession(redirectPath);
  }

  /** Pings /api/admin/validate-token; logs out if the backend rejects the token. */
  async function validateSession(redirectPath) {
    try {
      const res = await fetch(`${API_BASE}/admin/validate-token`, {
        method: 'GET',
        headers: { ...getAuthHeader() },
      });
      if (res.status === 401 || res.status === 403) {
        logout(redirectPath);
      }
      // Any other non-2xx (e.g. 500, or backend down) is left alone —
      // we don't want a flaky server to boot out a valid session.
    } catch (err) {
      // Backend unreachable — keep the cached session, don't force logout.
    }
  }

  // Public API
  global.Auth = {
    login,
    logout,
    isAuthenticated,
    getCurrentAdmin,
    requireAuth,
    getToken,
    getAuthHeader,
    API_BASE,
  };
})(window);