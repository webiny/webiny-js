context(
    "Should be able to publish and re-publish a page, and see changes on the public site",
    () => {
        const pagePath = `/testing-page-republish`;
        const pageTitle1 = `Testing page republish`;
        const pageTitle2 = pageTitle1 + " (updated)";

        beforeEach(() => {
            cy.login();
        });

        it(`Step 1: Create and publish a test page`, () => {
            cy.pbDeleteAllPages();
            cy.pbCreatePage({ category: "static" }).then(page => {
                cy.pbUpdatePage({
                    id: page.id,
                    data: {
                        path: pagePath,
                        title: pageTitle1
                    }
                });
                cy.pbPublishPage({ id: page.id });
            });
        });

        it(`Step 2: Check published public page with title ${pageTitle1}`, () => {
            cy.visit(Cypress.env("WEBSITE_URL") + pagePath);
            cy.reloadUntil(() => Cypress.$(`title:contains(${pageTitle1})`).length > 0);
        });

        it("Step 3: Update page title and republish page", () => {
            cy.visit("/page-builder/pages");

            cy.findByText(`${pageTitle1}`, { timeout: 15000 }).click({ force: true });
            cy.findByTestId("pb-page-details-header-edit-revision").click();

            // Editing title for the page.
            cy.findByTestId("pb-editor-page-title").click();
            cy.get(`input[value="${pageTitle1}"]`).clear().type(pageTitle2).blur();
            cy.findByText("Page title updated successfully!");

            // Publishing newly created page.
            cy.findByTestId("pb.editor.header.publish.button").click();

            // Confirming that we want to publish the page.
            cy.findByTestId("pb-editor-publish-confirmation-dialog").within(() => {
                cy.findByTestId("confirmationdialog-confirm-action").click();
            });

            // We should be able to see it in case page was published successfully,
            // and we also should be redirected to the "/page-builder/pages" route.
            cy.findByText("Your page was published successfully!");
        });

        it(`Step 4: Check published public page with title ${pageTitle2}`, () => {
            cy.visit(Cypress.env("WEBSITE_URL") + pagePath);
            cy.reloadUntil(() => Cypress.$(`title:contains(${pageTitle2})`).length > 0);
        });
    }
);
