import "@4tw/cypress-drag-drop";
import "@testing-library/cypress/add-commands";
import "@deploysentinel/cypress-debugger/support";
import "./commands";

const resizeObserverLoopErrRe = /^ResizeObserver loop limit exceeded/

Cypress.on('uncaught:exception', (err) => {
  if (resizeObserverLoopErrRe.test(err.message)) {
    // returning false here prevents Cypress from
    // failing the test
    return false
  }
})