import { customAlphabet } from "nanoid";

context("Page Builder - Blocks import", () => {
    let tokenStorage;
    const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz");
    beforeEach(() => cy.login());
    beforeEach(() => cy.pbDeleteBlocks());
    beforeEach(() => cy.pbAllDeleteBlockCategories());
    //Data used for creating multible block categories
    const blockCategoryData1 = {
        name: nanoid(10).toLowerCase(),
        slug: nanoid(10).toLowerCase(),
        icon: "icon-name",
        description: nanoid(10).toLowerCase()
    };

    const blockCategoryData2 = {
        name: nanoid(10).toLowerCase(),
        slug: nanoid(10).toLowerCase(),
        icon: "icon-name",
        description: nanoid(10).toLowerCase()
    };

    const blockCategoryData3 = {
        name: nanoid(10).toLowerCase(),
        slug: nanoid(10).toLowerCase(),
        icon: "icon-name",
        description: nanoid(10).toLowerCase()
    };

    it("Test the exportation of all blocks", () => {
        cy.visit("/page-builder/page-blocks");

        // Exports all created data and saves the exported string value.
        cy.pbCreateCategoryAndBlocks(blockCategoryData1, 1);
        cy.pbCreateCategoryAndBlocks(blockCategoryData2, 2);
        cy.pbCreateCategoryAndBlocks(blockCategoryData3, 3);

        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.findByTestId("pb-blocks-list-options-menu").click();
        cy.findByText("Export all blocks").click();
        cy.findByText("Your export is now ready!").should("exist");
        cy.get("span.link-text.mdc-typography--body2")
            .invoke("text")
            .then(importUrl => {
                tokenStorage = importUrl;
                Cypress.env("importUrl", tokenStorage);
            });
    });

    it("Test the functionality of the import block button", () => {
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.findByTestId("pb-blocks-list-options-menu").click();
        cy.findByRole("menuitem", { name: "Import blocks" }).click();
        cy.contains("File URL").type(Cypress.env("importUrl"));
        cy.contains("Continue").click();
        cy.findByText("All blocks have been imported").should("exist");
        cy.contains("Continue").click();

        // Validation of imported blocks and categories.
        cy.contains(blockCategoryData1.name).should("exist");
        cy.contains(blockCategoryData2.name).should("exist");
        cy.contains(blockCategoryData3.name).should("exist");
    });
});
