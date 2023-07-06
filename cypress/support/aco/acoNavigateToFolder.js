Cypress.Commands.add("acoNavigateToRootFolder", () => {
    cy.acoNavigateToFolder("root");
});

Cypress.Commands.add("acoNavigateToFolder", folderId => {
    cy.get(`.aco-folder-${folderId}`).first().click({ force: true });
});
