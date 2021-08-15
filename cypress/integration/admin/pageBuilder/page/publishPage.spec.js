context(
    "Should be able to publish and re-publish a page, and see changes on the public site",
    () => {
        beforeEach(() => cy.login());

        const pageTitle1 = `Test published page 1`;
        const pageTitle2 = `Test published page 2`;

        it(`Step 1: Create and publish page with title: ${pageTitle1}`, () => {
            cy.visit("/page-builder/pages");
            cy.findAllByTestId("new-record-button").first().click();

            cy.findByTestId("pb-new-page-category-modal").within(() => {
                cy.findByText("Static").click();
            });
            // Edit page title
            cy.findByTestId("pb-editor-page-title").click();
            cy.get(`input[value="Untitled"]`).clear().type(pageTitle1).blur();
            cy.findByText("Page title updated successfully!");
            // Publish page
            cy.findByText("Publish").click();
            cy.findByTestId("pb-editor-publish-confirmation-dialog").within(() => {
                cy.findByText(/Confirm/i).click();
            });
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
                const { path } = page;
                cy.visit(`${Cypress.env("WEBSITE_URL")}${path}`);

                cy.title().should("contain", pageTitle1);
            });
        });

        it(`Step 3: Update page title as ${pageTitle2}`, () => {
            cy.visit("/page-builder/pages");
            // Select page
            cy.findByTestId("default-data-list").within(() => {
                cy.findByText(pageTitle1)
                    .trigger("mouseover") // This is needed for click to work in CI
                    .click({ force: true });
            });
            // Create new revision
            cy.findByTestId("pb-page-details").within(() => {
                cy.findAllByText(pageTitle1);
                cy.findByTestId("pb-page-details-header-edit-revision").click();
            });
            // Update title
            cy.findByTestId("pb-editor-page-title").click();
            cy.get(`input[value="${pageTitle1}"]`).clear().type(pageTitle2).blur();
            cy.findByText("Page title updated successfully!");
            // Publish page
            cy.findByText("Publish changes").click();
            cy.findByTestId("pb-editor-publish-confirmation-dialog").within(() => {
                cy.findByText(/Confirm/i).click();
            });
        });

        it(`Step 4: Check updated page title in page preview`, () => {
            return cy.pbListPages({ limit: 1, search: { query: pageTitle2 } }).then(([page]) => {
                const { path } = page;
                cy.visit(`${Cypress.env("WEBSITE_URL")}${path}`);

                cy.title().should("contain", pageTitle2);
            });
        });

        it(`Step 5: Delete page immediately`, () => {
            return cy.pbListPages({ limit: 1, search: { query: pageTitle2 } }).then(([page]) => {
                const { id } = page;
                // Delete page by deleting first revision
                cy.pbDeletePage({ id: `${id.substr(0, id.length - 1)}1` });
            });
        });
    }
);
