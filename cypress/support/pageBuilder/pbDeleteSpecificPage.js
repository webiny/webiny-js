Cypress.Commands.add("pbDeleteSpecificPage", searchQueryString => {
    cy.pbListPages({
        search: {
            query: searchQueryString
        }
    }).then(pages => {
        pages.forEach(page => cy.pbDeletePage({ id: page.id }));
    });
});
