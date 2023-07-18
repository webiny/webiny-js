Cypress.Commands.add("pbDeleteAllBlockCategories", () => {
    cy.pbListBlockCategories().then(blockCategories => {
        blockCategories.forEach(blockCategory =>
            cy.pbDeleteBlockCategory({ slug: blockCategory.slug })
        );
    });
});
