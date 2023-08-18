import uniqid from "uniqid";

context("Page Builder Page Creation", () => {
    beforeEach(() => {
        cy.login();
    });

    describe("When creating new page", () => {
        const id = uniqid();

        afterEach(() => {
            cy.pbListPages({
                search: {
                    query: id
                }
            }).then(pages => {
                pages.forEach(page => cy.pbDeletePage({ id: page.id }));
            });
        });

        it("should be able to create page, publish page and check whether it exists in the list of the pages", () => {
            const newPageTitle = `Test page ${id}`;

            cy.visit("/page-builder/pages");

            // Button is hidden so we need to force click it.
            cy.findByTestId("new-page-button").click({ force: true });
            // After clicking on create blank page button, we should be redirected to the page editor of that newly created page.
            cy.findByTestId("create-blank-page-button").click();
            // Check if we got redirected to the Page Builder Editor (route "/page-builder/editor/").
            cy.url().should("includes", "/page-builder/editor/");
            // Check if we are on the Page Builder Editor page (route "/page-builder/editor/") and it is empty.
            cy.findByTestId("pb-content-add-block-button", { timeout: 15000 });

            // Changing default name for the page (because default name is Undefined) so we can use it in the query to find it's id,
            // so we can use that id to delete the page.
            cy.findByTestId("pb-editor-page-title").click();
            cy.get(`input[value="Untitled"]`).clear().type(newPageTitle).blur();
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

            // Check if we got redirected to the "/page-builder/pages/" route.
            cy.url().should("includes", "/page-builder/pages");

            // If we are on "/page-builder/pages/" route then we should see "New Page" button.
            cy.findByTestId("new-page-button").should("exist");

            // Checking whether we have new page in the the list of pages.
            cy.findByText(`${newPageTitle}`, { timeout: 15000 });
        });
    });
});
