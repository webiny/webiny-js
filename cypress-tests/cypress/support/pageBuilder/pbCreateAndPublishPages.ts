Cypress.Commands.add("pbCreateAndPublishPages", (totalPages, id) => {
    for (let i = 0; i < totalPages; i++) {
      cy.pbCreatePage({ category: "static" }).then((page) => {
        cy.pbUpdatePage({
          id: page.id,
          data: {
            category: "static",
            path: `/page-${id}-${i}`,
            title: `Page-${id}-${i}`,
            settings: {
              general: {
                layout: "static",
                tags: [`page-${id}`, `page-${id}-${i}`],
              },
            },
          },
        }).then((updatedPage) => {
          cy.pbPublishPage({ id: updatedPage.id });
        });
      });
    }
  });
  