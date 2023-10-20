Cypress.Commands.add("cmsDeleteAllContentModelGroups", () => {
    cy.cmsListContentModelGroup().then(groups => {
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            cy.cmsDeleteContentModelGroup({ id: group.id });
        }
    });
});
