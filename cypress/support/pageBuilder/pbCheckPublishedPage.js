import { login } from "../login";

Cypress.Commands.add("pbCheckPublishedPage", async (callback, query = {}) => {
    const user = await login();

    cy.pbListPages({ user, limit: 1, search: query }).then(pages => {
        pages.forEach(page => {
            cy.visit(Cypress.env("WEBSITE_URL") + `${page.path}`);

            callback();
        });
    });
});
