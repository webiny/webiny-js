import "./utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            visitWebsite(url: string): Promise<void>;
        }
    }
}

Cypress.Commands.add("visitWebsite", url => {
    cy.visit(Cypress.env("WEBSITE_URL") + url);
});
