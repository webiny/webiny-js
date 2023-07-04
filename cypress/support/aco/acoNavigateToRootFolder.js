Cypress.Commands.add("acoNavigateToRootFolder", () => {
    cy.get(".aco-folder-root").first().click({ force: true });
});
