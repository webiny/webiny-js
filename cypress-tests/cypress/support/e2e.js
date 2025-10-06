import "@4tw/cypress-drag-drop";
import "@testing-library/cypress/add-commands";
import "./commands";

Cypress.on("uncaught:exception", err => {
    // Suppress only ResizeObserver loop errors
    if (err && err.message && err.message.includes("ResizeObserver loop")) {
        return false;
    }

    // Let all other errors fail the test
    return true;
});
