Cypress.Commands.add("acoNavigateToRootFolder", () => {
    cy.get(".aco-folder-ROOT").first().click({ force: true });
});
