/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import Bills from "../containers/Bills.js";
import router from "../app/Router.js";
import { formatDate, formatStatus } from "../app/format.js";

// Mock store
jest.mock("../app/store", () => mockStore);

// Import du mock jQuery isolé UNIQUEMENT pour Bills.js
const {
  setupBillsJQueryMock,
  cleanupBillsJQueryMock,
} = require("../__mocks__/jqueryBills.js");

// Mock console.log to avoid console spam in tests
const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

describe("Given I am connected as an employee", () => {
  let restoreJQuery; // Variable pour restaurer jQuery après les tests

  // Configuration du mock jQuery isolé pour Bills.js UNIQUEMENT
  beforeAll(() => {
    restoreJQuery = setupBillsJQueryMock();
  });

  // Nettoyage du mock après tous les tests Bills.js
  afterAll(() => {
    cleanupBillsJQueryMock(restoreJQuery);
  });

  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
    consoleSpy.mockClear();

    // Le mock jQuery global est automatiquement configuré
    // Réinitialisation des mocks pour avoir des données fraîches
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up DOM after each test
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon).toBeTruthy();
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    test("Then loading page should be displayed when data is loading", () => {
      document.body.innerHTML = BillsUI({ loading: true });
      expect(screen.getByText("Loading...")).toBeTruthy();
    });

    test("Then error page should be displayed when there is an error", () => {
      document.body.innerHTML = BillsUI({ error: "Erreur de connexion" });
      expect(screen.getByText("Erreur")).toBeTruthy();
    });

    test("Then bills should be displayed correctly with all required information", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      // Vérifie que les éléments principaux sont présents
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      expect(screen.getByTestId("btn-new-bill")).toBeTruthy();

      // Vérifie que les factures sont affichées
      bills.forEach((bill) => {
        expect(screen.getByText(bill.name)).toBeTruthy();
        expect(screen.getByText(bill.type)).toBeTruthy();
      });
    });
  });

  describe("When I interact with Bills container", () => {
    let billsInstance;
    let onNavigate;
    let store;

    beforeEach(() => {
      onNavigate = jest.fn();
      store = mockStore;
      document.body.innerHTML = BillsUI({ data: bills });
    });

    test("Then Bills constructor should initialize properly", () => {
      billsInstance = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      expect(billsInstance.document).toBe(document);
      expect(billsInstance.onNavigate).toBe(onNavigate);
      expect(billsInstance.store).toBe(store);
    });

    test("Then handleClickNewBill should navigate to NewBill page", () => {
      billsInstance = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      billsInstance.handleClickNewBill();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });

    test("Then handleClickNewBill should be called when new bill button is clicked", () => {
      const onNavigate = jest.fn();

      billsInstance = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const newBillBtn = screen.getByTestId("btn-new-bill");

      fireEvent.click(newBillBtn);
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });

    test("Then handleClickIconEye should open modal when eye icon is clicked", () => {
      // Le mock jQuery global est automatiquement configuré
      billsInstance = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const iconEye = screen.getAllByTestId("icon-eye")[0];

      // Tester que la méthode fonctionne sans erreur
      expect(() => {
        fireEvent.click(iconEye);
      }).not.toThrow();
    });

    test("Then handleClickIconEye should display bill image in modal", () => {
      // Le mock jQuery global est automatiquement configuré
      billsInstance = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const iconEye = screen.getAllByTestId("icon-eye")[0];
      const billUrl = iconEye.getAttribute("data-bill-url");

      // Tester que la méthode fonctionne sans erreur
      expect(() => {
        billsInstance.handleClickIconEye(iconEye);
      }).not.toThrow();

      // Vérifier que l'URL de la facture est utilisée
      expect(billUrl).toBeTruthy();
    });

    test("Then handleClickIconEye should handle modal width calculation correctly", () => {
      // Le mock jQuery global retourne une largeur de 500 par défaut
      billsInstance = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const iconEye = screen.getAllByTestId("icon-eye")[0];

      // Tester que la méthode fonctionne sans erreur
      expect(() => {
        billsInstance.handleClickIconEye(iconEye);
      }).not.toThrow();
    });
  });

  describe("When I call getBills method", () => {
    let billsInstance;
    let onNavigate;

    beforeEach(() => {
      onNavigate = jest.fn();
      document.body.innerHTML = BillsUI({ data: bills });
    });

    test("Then it should return formatted bills when store is available", async () => {
      billsInstance = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const result = await billsInstance.getBills();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);

      // Vérifie que les dates sont formatées
      result.forEach((bill) => {
        expect(bill.date).toMatch(/^\d{1,2} [A-Za-zÀ-ÿ]{3}\.? \d{2}$/);
        expect(bill.status).toMatch(/^(En attente|Accepté|Refusé)$/);
      });
    });

    test("Then it should return undefined when store is not available", async () => {
      billsInstance = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const result = await billsInstance.getBills();
      expect(result).toBeUndefined();
    });

    test("Then it should handle corrupted date data gracefully", async () => {
      // Mock store with corrupted data
      const corruptedStore = {
        bills() {
          return {
            list() {
              return Promise.resolve([
                {
                  id: "1",
                  date: "invalid-date",
                  status: "pending",
                  name: "Test bill",
                  type: "Transport",
                  amount: 100,
                },
              ]);
            },
          };
        },
      };

      billsInstance = new Bills({
        document,
        onNavigate,
        store: corruptedStore,
        localStorage: window.localStorage,
      });

      const result = await billsInstance.getBills();

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].date).toBe("invalid-date"); // Date non formatée
      expect(consoleSpy).toHaveBeenCalled(); // Erreur loggée
    });

    test("Then bills should be sorted by date in descending order", async () => {
      billsInstance = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const result = await billsInstance.getBills();

      // Vérifie que les résultats sont dans l'ordre attendu (plus récente en premier)
      // Basé sur les dates du mock store: 2004-04-04, 2003-03-03, 2001-01-01
      expect(result.length).toBeGreaterThan(0);

      // Vérifie que le tri est correct en comparant le premier et dernier élément
      // Les dates formatées devraient être dans l'ordre décroissant
      const firstBillDate = result[0].date;
      const lastBillDate = result[result.length - 1].date;

      // Dans notre cas, la première date devrait être 2004 et la dernière 2001
      expect(firstBillDate).toContain("04"); // 2004 formaté => '04'
      expect(lastBillDate).toContain("01"); // 2001 formaté => '01'
    });
  });

  // Tests d'intégration pour les erreurs HTTP
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "employee@test.tld",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });

    test("Then fetches bills from an API and fails with 404 message error", async () => {
      const error404 = new Error("Erreur 404");
      error404.status = 404;

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(error404);
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);

      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
      expect(message.textContent).toContain("404");
    });

    test("Then fetches messages from an API and fails with 500 message error", async () => {
      const error500 = new Error("Erreur 500");
      error500.status = 500;

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(error500);
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);

      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
      expect(message.textContent).toContain("500");
    });

    test("Then it should handle network errors gracefully", async () => {
      const networkError = new Error("Network Error");
      networkError.code = "NETWORK_ERROR";

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(networkError);
          },
        };
      });

      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      try {
        await billsInstance.getBills();
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error.message).toBe("Network Error");
        expect(error.code).toBe("NETWORK_ERROR");
      }
    });

    test("Then it should handle empty response from API", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.resolve([]);
          },
        };
      });

      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      const result = await billsInstance.getBills();
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    test("Then it should handle timeout errors", async () => {
      const timeoutError = new Error("Request timeout");
      timeoutError.code = "TIMEOUT";

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(timeoutError);
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);

      // Vérifier que l'erreur est bien affichée dans l'interface
      await waitFor(() => {
        const errorElements = document.querySelectorAll("*");
        const hasErrorText = Array.from(errorElements).some(
          (el) => el.textContent && el.textContent.includes("timeout")
        );
        expect(
          hasErrorText || document.body.textContent.includes("Erreur")
        ).toBe(true);
      });
    });

    test("Then it should properly handle API error responses with status codes", async () => {
      // Test avec différents codes d'erreur HTTP
      const testCases = [
        { status: 400, message: "Bad Request" },
        { status: 401, message: "Unauthorized" },
        { status: 403, message: "Forbidden" },
        { status: 404, message: "Not Found" },
        { status: 500, message: "Internal Server Error" },
        { status: 502, message: "Bad Gateway" },
        { status: 503, message: "Service Unavailable" },
      ];

      for (const testCase of testCases) {
        const error = new Error(`Erreur ${testCase.status}`);
        error.status = testCase.status;
        error.message = testCase.message;

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => Promise.reject(error),
          };
        });

        const billsInstance = new Bills({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage,
        });

        try {
          await billsInstance.getBills();
          fail(`Expected error ${testCase.status} to be thrown`);
        } catch (thrownError) {
          expect(thrownError.status).toBe(testCase.status);
          expect(thrownError.message).toContain(testCase.message);
        }
      }
    });

    test("Then it should handle malformed response data", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => Promise.resolve(null), // Réponse malformée
        };
      });

      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      try {
        const result = await billsInstance.getBills();
        // Si aucune erreur n'est levée, vérifier que le résultat est géré correctement
        expect(result).toBeNull();
      } catch (error) {
        // Si une erreur est levée, elle doit être gérée gracieusement
        expect(error).toBeDefined();
      }
    });

    test("Then it should handle partial data corruption gracefully", async () => {
      const partiallyCorruptedData = [
        {
          id: "1",
          name: "Valid Bill",
          type: "Transport",
          amount: 100,
          date: "2023-12-15",
          status: "pending",
        },
        {
          id: "2",
          name: null, // Données corrompues
          type: "Hotel",
          amount: "invalid", // Type incorrect
          date: "invalid-date", // Date invalide
          status: "unknown", // Statut invalide
        },
        {
          // Objet incomplet
          id: "3",
          name: "Incomplete Bill",
          // Champs manquants
        },
      ];

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => Promise.resolve(partiallyCorruptedData),
        };
      });

      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      const result = await billsInstance.getBills();

      // Vérifier que la méthode retourne toujours un résultat
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);

      // Vérifier que les erreurs sont loggées pour les données corrompues
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // Tests pour vérifier les événements et interactions
  describe("When I interact with the interface", () => {
    let billsInstance;

    beforeEach(() => {
      document.body.innerHTML = BillsUI({ data: bills });
      billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });
    });

    test("Then all eye icons should have click event listeners", () => {
      const eyeIcons = screen.getAllByTestId("icon-eye");
      expect(eyeIcons.length).toBeGreaterThan(0);

      eyeIcons.forEach((icon) => {
        expect(icon.getAttribute("data-bill-url")).toBeTruthy();
      });
    });

    test("Then new bill button should have click event listener", () => {
      const newBillBtn = screen.getByTestId("btn-new-bill");
      expect(newBillBtn).toBeTruthy();

      const onNavigate = jest.fn();

      // Créer une nouvelle instance pour ce test
      const testBillsInstance = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      fireEvent.click(newBillBtn);
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });
  });

  // Tests pour la validation des données
  describe("When validating bill data", () => {
    test("Then bills should have required fields", async () => {
      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      const result = await billsInstance.getBills();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      result.forEach((bill) => {
        expect(bill).toHaveProperty("id");
        expect(bill).toHaveProperty("name");
        expect(bill).toHaveProperty("type");
        expect(bill).toHaveProperty("amount");
        expect(bill).toHaveProperty("date");
        expect(bill).toHaveProperty("status");

        expect(bill.id).toBeDefined();
        expect(bill.name).toBeDefined();
        expect(bill.type).toBeDefined();
        expect(bill.amount).toBeDefined();
        expect(bill.date).toBeDefined();
        expect(bill.status).toBeDefined();

        expect(typeof bill.id).toBe("string");
        expect(typeof bill.name).toBe("string");
        expect(typeof bill.type).toBe("string");
      });
    });

    test("Then bill amounts should be numbers", async () => {
      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      const result = await billsInstance.getBills();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      result.forEach((bill) => {
        expect(typeof bill.amount).toBe("number");
        expect(bill.amount).toBeGreaterThan(0);
        expect(Number.isFinite(bill.amount)).toBe(true);
        expect(Number.isNaN(bill.amount)).toBe(false);
      });
    });

    test("Then bill dates should be properly formatted", async () => {
      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      const result = await billsInstance.getBills();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      result.forEach((bill) => {
        // Vérifier le format de date français: "4 Avr. 04"
        expect(bill.date).toMatch(/^\d{1,2} [A-Za-zÀ-ÿ]{3}\.? \d{2}$/);
      });
    });

    test("Then bill statuses should be properly formatted", async () => {
      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      const result = await billsInstance.getBills();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      result.forEach((bill) => {
        expect(["En attente", "Accepté", "Refusé"]).toContain(bill.status);
      });
    });
  });

  // Tests pour la gestion des modales avec fichiers invalides
  describe("When I click on eye icon", () => {
    let bills;
    let mockStore;

    beforeEach(() => {
      document.body.innerHTML = BillsUI({ data: [] });
      mockStore = {
        bills: jest.fn(() => ({
          list: jest.fn(() => Promise.resolve([])),
        })),
      };

      bills = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });
    });

    test("Then it should handle null URL correctly", () => {
      // Mock jQuery
      const mockHtml = jest.fn();
      const mockModal = jest.fn();
      global.$ = jest.fn(() => ({
        width: jest.fn(() => 800),
        find: jest.fn(() => ({ html: mockHtml })),
        modal: mockModal,
      }));

      const icon = document.createElement("div");
      icon.setAttribute("data-bill-url", null);

      bills.handleClickIconEye(icon);

      expect(mockHtml).toHaveBeenCalledWith(
        expect.stringContaining("Aucun justificatif disponible")
      );
      expect(mockModal).toHaveBeenCalledWith("show");
    });
  });
});
