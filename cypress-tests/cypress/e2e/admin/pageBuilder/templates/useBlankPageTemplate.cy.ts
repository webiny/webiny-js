context("Page Builder - Blocks", () => {
    beforeEach(() => {
        cy.login();
        cy.pbDeleteAllTemplates();
    });

    it("Should be able to create a page and view all existing templates in it", () => {
        cy.visit("/page-builder/pages?folderId=root");
        cy.findByTestId("new-page-button").click();

        cy.contains("Pick a template for your new page").should("exist");

        cy.get("button.webiny-ui-button--secondary").eq(1).click();
        cy.findByTestId("pb-content-add-block-button").should("exist");
        cy.contains("to start adding content").should("exist");
    });
});
