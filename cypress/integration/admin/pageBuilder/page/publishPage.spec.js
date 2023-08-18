context(
    "Should be able to publish and re-publish a page, and see changes on the public site",
    () => {
        beforeEach(() => {
            cy.login();
        });

        describe("When Publishing new page", () => {
            const pageTitle1 = `Test published page 1`;
            const pageTitle2 = `Test published page 2`;

            it(`Step 1: Should be able to create page with title ${pageTitle1}`, () => {
                cy.visit("/page-builder/pages");

                // Button is hidden so we need to force click it.
                cy.findByTestId("new-page-button").click({ force: true });
                // After clicking on create blank page button, we should be redirected to the page editor of that newly created page.
                cy.findByTestId("create-blank-page-button").click();
                // Check if we got redirected to the Page Builder Editor (route "/page-builder/editor/").
                cy.url().should("includes", "/page-builder/editor/");

                // Editing title for the page.
                cy.findByTestId("pb-editor-page-title").click();
                cy.get(`input[value="Untitled"]`).clear().type(pageTitle1).blur();
                cy.findByText("Page title updated successfully!");

                // Publishing newly create page.
                cy.findByTestId("pb.editor.header.publish.button").click();

                // Confirming that we want to publish the page.
                cy.findByTestId("pb-editor-publish-confirmation-dialog").within(() => {
                    cy.findByTestId("confirmationdialog-confirm-action").click();
                });

                // We should be able to see it in case page was published successfully,
                // and we also should be redirected to the "/page-builder/pages" route.
                cy.findByText("Your page was published successfully!");
            });

            it("Step 2: Check page title in preview", () => {
                cy.visit("/page-builder/pages");

                // Check title on the page preview drawer.
                cy.findByText(`${pageTitle1}`, { timeout: 15000 }).click();
                // Check whether we oppened a page preview drawer.
                cy.url().should("include", "&id");
                // Checking if title is correct.
                cy.findByTestId("page-details-page-title").contains(`${pageTitle1}`);

                // As we don't have a button to close page preview drawer,
                // we need to simulate click outside of the drawer to close it.
                cy.get("body").click("topLeft");
                // Check if we closed page preview drawer.
                cy.url().should("not.contain", "&id");

                // Check title on the public site.
                cy.pbListPages({ limit: 1, search: { query: pageTitle1 } }).then(pages => {
                    pages.forEach(page => {
                        cy.visit(`${Cypress.env("WEBSITE_URL")}${page.path}`);

                        cy.title().should("contain", pageTitle1);
                    });
                });
            });

            it(`Step 3: Update page title as ${pageTitle2}`, () => {
                cy.visit("/page-builder/pages");

                // Should open page preview drawer.
                cy.findByText(`${pageTitle1}`, { timeout: 15000 }).click({ force: true });
                // Should open "/page-builder/editor/" route.
                cy.findByTestId("pb-page-details-header-edit-revision").click();
                // Check if we got redirected to the Page Builder Editor (route "/page-builder/editor/").
                cy.url().should("includes", "/page-builder/editor");

                // Editing title for the page.
                cy.findByTestId("pb-editor-page-title").click();
                cy.get(`input[value="${pageTitle1}"]`).clear().type(pageTitle2).blur();
                cy.findByText("Page title updated successfully!");

                // Publishing newly create page.
                cy.findByTestId("pb.editor.header.publish.button").click();

                // Confirming that we want to publish the page.
                cy.findByTestId("pb-editor-publish-confirmation-dialog").within(() => {
                    cy.findByTestId("confirmationdialog-confirm-action").click();
                });

                // We should be able to see it in case page was published successfully,
                // and we also should be redirected to the "/page-builder/pages" route.
                cy.findByText("Your page was published successfully!");
            });

            it("Step 4: Check updated page title in page preview", () => {
                cy.visit("/page-builder/pages");

                // Check title on the page preview drawer.
                cy.findByText(`${pageTitle2}`, { timeout: 15000 }).click({ force: true });
                // Check whether we oppened a page preview drawer.
                cy.url().should("include", "&id");
                // Checking if title is correct.
                cy.findByTestId("page-details-page-title").contains(`${pageTitle2}`);

                // As we don't have a button to close page preview drawer,
                // we need to simulate click outside of the drawer to close it.
                cy.get("body").click("topLeft");
                // Check if we closed page preview drawer.
                cy.url().should("not.contain", "&id");

                // Check title on the public site.
                cy.pbListPages({ limit: 1, search: { query: pageTitle2 } }).then(pages => {
                    pages.forEach(page => {
                        cy.visit(`${Cypress.env("WEBSITE_URL")}${page.path}`);

                        cy.title().should("contain", pageTitle2);
                    });
                });
            });

            it("Step 5: Delete page immediately", () => {
                cy.visit("/page-builder/pages");

                cy.pbDeleteSpecificPage("Test published page");
            });
        });
    }
);
