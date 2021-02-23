import uniqid from "uniqid";

describe("Cache-Control Headers", () => {
    const id = uniqid();
    let createdPage;

    before(() => cy.login());
    after(() => cy.pbDeletePage({ id: createdPage.id }));

    it(`Create a page, publish it, and check headers`, () => {
        cy.pbCreatePage({ category: "static" }).then(page => {
            createdPage = page;
            cy.pbUpdatePage({
                id: page.id,
                data: {
                    category: "static",
                    path: `/page-${id}`,
                    title: `Page-${id}`
                }
            });
            cy.pbPublishPage({ id: page.id });
        });

        const url = Cypress.env("WEBSITE_URL") + `/page-${id}/`;

        cy.visit(url);
        cy.reloadUntil(
            () => {
                // We wait until the document contains the newly added menu.
                const [title] = Cypress.$("title");
                return title.outerText === `Page-${id}`;
            },
            { repeat: 3 }
        );

        cy.intercept("GET", url).as("page");
        cy.intercept("GET", /.*static\/.*\.js/).as("js");
        cy.intercept("GET", /.*static\/.*\.css/).as("css");

        cy.visit(url);

        cy.wait("@page")
            .its("response.headers")
            .should("have.property", "cache-control", "max-age=31536000");

        cy.wait("@js")
            .its("response.headers")
            .should("have.property", "cache-control", "max-age=31536000");

        cy.wait("@css")
            .its("response.headers")
            .should("have.property", "cache-control", "max-age=31536000");
    });
});
