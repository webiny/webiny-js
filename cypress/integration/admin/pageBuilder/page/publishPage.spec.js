import uniqid from "uniqid";

context(
    "Should be able to publish and re-publish a page, and see changes on the public site",
    () => {
        let id;
        const pageTitle1 = `Test published page 1`;
        const pageTitle2 = `Test published page 2`;

        beforeEach(() => {
            id = uniqid();
            cy.login();
            cy.pbDeleteAllPages();
            cy.pbCreatePage({ category: "static" }).then(page => {
                cy.pbUpdatePage({
                    id: page.id,
                    data: {
                        category: "static",
                        path: `/page-${id}`,
                        title: pageTitle1
                    }
                });
                cy.pbPublishPage({ id: page.id });
            });
        });

        describe("When Publishing new page", () => {
            it("Step 1: Check page title in preview", () => {
                cy.visit("/page-builder/pages");

                // Check title on the page preview drawer.
                cy.findByText(`${pageTitle1}`, { timeout: 15000 }).click({ force: true });
                // Check whether we opened a page preview drawer.
                cy.url().should("include", "&id");
                // Checking if title is correct.
                cy.findByTestId("page-details-page-title").contains(`${pageTitle1}`);
                // As we don't have a button to close page preview drawer,
                // we need to simulate click outside of the drawer to close it.
                cy.get("body").click("topLeft");
                // Check if we closed page preview drawer.
                cy.url().should("not.contain", "&id");
            });
            it(`Step 2: Check published public page with title ${pageTitle1}`, () => {
                cy.pbCheckPublishedPage(() => Cypress.$(`title:contains(${pageTitle1})`), {
                    query: pageTitle1
                });
            });
            it("Step 3: Update page title, re-publish page, and check page title in the preview", () => {
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

                // Publishing newly created page.
                cy.findByTestId("pb.editor.header.publish.button").click();

                // Confirming that we want to publish the page.
                cy.findByTestId("pb-editor-publish-confirmation-dialog").within(() => {
                    cy.findByTestId("confirmationdialog-confirm-action").click();
                });

                // We should be able to see it in case page was published successfully,
                // and we also should be redirected to the "/page-builder/pages" route.
                cy.findByText("Your page was published successfully!");

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
            });
            it(`Step 4: Check published public page with title ${pageTitle2}`, () => {
                cy.pbCheckPublishedPage(() => Cypress.$(`title:contains(${pageTitle2})`), {
                    query: pageTitle2
                });
            });
        });
    }
);
