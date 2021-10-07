context("Pages Previewing", () => {
    beforeEach(() => cy.login());

    const pageTitle1 = `Test pages previewing 1`;
    const pageTitle2 = `Test pages previewing 2`;

    it(`Step 1: Create a page with title: ${pageTitle1}`, () => {
        cy.visit("/page-builder/pages");
        cy.findAllByTestId("new-record-button").first().click();

        cy.findByTestId("pb-new-page-category-modal").within(() => {
            cy.findByText("Static").click();
        });
        cy.findByTestId("pb-editor-page-title").click();
        cy.get(`input[value="Untitled"]`).clear().type(pageTitle1).blur();
        cy.findByText("Page title updated successfully!");
    });

    it(`Step 2: Check page title in preview`, () => {
        cy.waitUntil(
            () =>
                cy
                    .pbListPages({
                        limit: 1,
                        search: { query: pageTitle1 }
                    })
                    .then(pages => Array.isArray(pages) && pages.length > 0),
            {
                description: `waitUntil page list contains newly created page`
            }
        );

        return cy.pbListPages({ limit: 1, search: { query: pageTitle1 } }).then(([page]) => {
            const { path, id } = page;
            cy.visit(
                `${Cypress.env("WEBSITE_PREVIEW_URL")}${path}?preview=${encodeURIComponent(
                    id
                )}&__locale=en-US`
            );

            cy.title().should("contain", pageTitle1);
        });
    });

    it(`Step 3: Update page title as ${pageTitle2}`, () => {
        cy.visit("/page-builder/pages");

        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(pageTitle1).click();
        });

        cy.findByTestId("pb-page-details").within(() => {
            cy.findByTestId("pb-page-details-header-edit-revision").click();
        });

        cy.findByTestId("pb-editor-page-title").click();
        cy.get(`input[value="${pageTitle1}"]`).clear().type(pageTitle2).blur();

        cy.findByText("Page title updated successfully!");
    });

    it(`Step 4: Check updated page title in page preview`, () => {
        return cy.pbListPages({ limit: 1, search: { query: pageTitle2 } }).then(([page]) => {
            const { path, id } = page;
            cy.visit(
                `${Cypress.env("WEBSITE_PREVIEW_URL")}${path}?preview=${encodeURIComponent(
                    id
                )}&__locale=en-US`
            );

            cy.title().should("contain", pageTitle2);
        });
    });

    it(`Step 5: Delete page immediately`, () => {
        return cy.pbListPages({ limit: 1, search: { query: pageTitle2 } }).then(([page]) => {
            const { id } = page;
            cy.pbDeletePage({ id });
        });
    });
});
