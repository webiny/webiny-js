import uniqid from "uniqid";

context("Page Builder - Page Creation", () => {
    beforeEach(() => {
        cy.login();
        cy.pbDeleteAllPages();
    });

    it("as a user, I should be able create and publish a page and see it in the list of pages", () => {
        const id = uniqid();

        const newPageTitle = `Test page ${id}`;

        cy.visit("/page-builder/pages");

        // Button is hidden so we need to force click it.
        cy.findByTestId("new-page-button", { timeout: 15000 }).click();

        cy.findByTestId("create-blank-page-button").click();
        cy.findByTestId("pb-content-add-block-button", { timeout: 15000 });

        cy.findByTestId("pb-editor-page-title").click();
        cy.get(`input[value="Untitled"]`).clear().type(newPageTitle).blur();
        cy.findByText("Page title updated successfully!");

        // Publishing newly create page.
        cy.findByTestId("pb.editor.header.publish.button").click();

        // Confirming that we want to publish the page.
        cy.findByTestId("pb-editor-publish-confirmation-dialog").within(() => {
            cy.findByTestId("confirmationdialog-confirm-action").click();
        });

        cy.findByText("Your page was published successfully!");

        cy.url().should("includes", "/page-builder/pages");

        // Checking whether we have new page in the the list of pages.
        cy.findByText(newPageTitle, { timeout: 15000 });

        // Opening preview drawer for the Page.
        cy.findByText(newPageTitle).click({ force: true });

        cy.findByTestId("pb-page-details-header-delete-button").click();

        cy.findByTestId("pb-page-details-header-delete-dialog").within(() => {
            cy.findByTestId("confirmationdialog-confirm-action").click({ force: true });
        });

        // Checking that the page was deleted.
        cy.findByText(`Test page`).should("not.exist");
    });
});
