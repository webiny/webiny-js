Cypress.Commands.add("acoNavigateToRootFolder", () => {
    return cy.acoNavigateToFolder("root");
});

Cypress.Commands.add("acoNavigateToFolder", folderId => {
    return cy.get(`.aco-folder-${folderId}`).first().click({ force: true });
});
