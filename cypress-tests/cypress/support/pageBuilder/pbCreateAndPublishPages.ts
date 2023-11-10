import { gqlClient } from "../utils";

interface pbCreateAndPublishPages {
    blockCategory: Record<string, any>;
    blockNames: string[];
}

declare global {
    namespace Cypress {
        interface Chainable {
            pbCreateAndPublishPages(totalPages: number, id: string): Chainable<Promise<any>>;
        }
    }
}

Cypress.Commands.add("pbCreateAndPublishPages", (totalPages: number, id: string) => {
    for (let i = 0; i < totalPages; i++) {
        cy.pbCreatePage({ category: "static" }).then(page => {
            cy.pbUpdatePage({
                id: page.id,
                data: {
                    category: "static",
                    path: `/page-${id}-${i}`,
                    title: `Page-${id}-${i}`,
                    settings: {
                        general: {
                            layout: "static",
                            tags: [`page-${id}`, `page-${id}-${i}`]
                        }
                    }
                }
            }).then(updatedPage => {
                cy.pbPublishPage(page.id);
            });
        });
    }
});
