/**
 * Mock jQuery isolé UNIQUEMENT pour Bills.js
 * Ce mock N'AFFECTE PAS les variables globales $ et jQuery
 * Il doit être importé manuellement dans les tests Bills.js
 */

/**
 * Crée un élément jQuery mocké spécifiquement pour Bills.js
 * @param {number} customWidth - Largeur personnalisée (défaut: 500)
 * @returns {Object} Élément jQuery mocké avec méthodes pour Bills.js
 */
const createBillsJQueryElement = (customWidth = 500) => {
  const element = {
    // === Méthodes utilisées dans Bills.js ===
    width: jest.fn(() => customWidth),
    find: jest.fn(function () {
      return element;
    }),
    html: jest.fn(function () {
      return element;
    }),
    modal: jest.fn(function () {
      return element;
    }),
    click: jest.fn(function () {
      return element;
    }),

    // === Propriétés communes ===
    length: 1,
  };

  return element;
};

/**
 * Mock jQuery isolé pour Bills.js UNIQUEMENT
 * Cette fonction ne modifie PAS global.$ ni global.jQuery
 */
const mockBillsJQuery = jest.fn((selector) => createBillsJQueryElement());

// Configuration du prototype pour compatibilité
mockBillsJQuery.fn = {
  modal: jest.fn(),
  find: jest.fn(),
  html: jest.fn(),
  width: jest.fn(),
  click: jest.fn(),
};

/**
 * Fonction pour configurer temporairement le mock dans Bills.js tests
 * Sauvegarde les variables globales originales et les restaure après
 */
const setupBillsJQueryMock = () => {
  // Sauvegarder les variables globales originales
  const originalDollar = global.$;
  const originalJQuery = global.jQuery;

  // Appliquer temporairement le mock
  global.$ = mockBillsJQuery;
  global.jQuery = mockBillsJQuery;

  // Retourner une fonction de nettoyage
  return () => {
    global.$ = originalDollar;
    global.jQuery = originalJQuery;
  };
};

/**
 * Fonction pour nettoyer le mock après les tests Bills.js
 */
const cleanupBillsJQueryMock = (restoreFunction) => {
  if (restoreFunction) {
    restoreFunction();
  }
};
// Export pour usage dans les tests Bills.js UNIQUEMENT
module.exports = {
  mockBillsJQuery,
  createBillsJQueryElement,
  setupBillsJQueryMock,
  cleanupBillsJQueryMock,
};

/**
 * ===================================================================
 * DOCUMENTATION DU MOCK JQUERY ISOLÉ POUR BILLS.JS
 * ===================================================================
 *
 * POURQUOI UN MOCK ISOLÉ ?
 * - Bills.js a besoin de jQuery mocké pour les tests Jest
 * - Dashboard.js et Logout.js doivent utiliser le VRAI jQuery global
 * - Solution : mock isolé qui n'affecte PAS les variables globales
 *
 * MÉTHODES SUPPORTÉES (Bills.js uniquement) :
 * - width() : calcul de largeurs des modales
 * - find() : recherche d'éléments DOM (.modal-body)
 * - html() : manipulation du contenu HTML
 * - modal() : gestion des modales Bootstrap
 * - click() : gestion des événements de clic
 *
 * UTILISATION DANS LES TESTS BILLS.JS :
 * ```javascript
 * const { setupBillsJQueryMock, cleanupBillsJQueryMock } = require('../__mocks__/jqueryBills.js');
 *
 * describe('Bills tests', () => {
 *   let restoreJQuery;
 *
 *   beforeAll(() => {
 *     restoreJQuery = setupBillsJQueryMock();
 *   });
 *
 *   afterAll(() => {
 *     cleanupBillsJQueryMock(restoreJQuery);
 *   });
 * });
 * ```
 *
 * IMPACT :
 * - Dashboard.js et Logout.js utilisent le vrai jQuery (global.$ non modifié)
 * - Bills.js utilise le mock temporairement pendant ses tests
 * - Isolation complète entre les tests des différents containers
 */
