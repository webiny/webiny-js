context("Page Builder - Template Blank Page", () => {
    beforeEach(() => {
        cy.login();
        cy.pbDeleteAllTemplates();
    });

    it("Should be able to view and assert the blank page is being displayed properly", () => {
        cy.visit("/page-builder/pages?folderId=root");
        cy.findByTestId("new-page-button").click();

        cy.contains("Pick a template for your new page").should("exist");

        cy.contains("Use a blank page template").click();

        cy.findByTestId("pb-content-add-block-button").should("exist");
        cy.contains("to start adding content").should("exist");
    });
});
