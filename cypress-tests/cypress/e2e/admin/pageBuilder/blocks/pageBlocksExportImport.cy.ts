import { customAlphabet } from "nanoid";

context("Page Builder - Blocks Export/Import", () => {
    const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz");

    beforeEach(() => {
        cy.login();
        cy.pbDeleteAllBlocks();
        cy.pbDeleteAllBlockCategories();
    });

    const blockNames1 = ["Block1Name"];

    const blockNames2 = ["Block1Name", "Block2Name"];

    const blockNames3 = ["Block1Name", "Block2Name", "Block3Name"];

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

    it("Test the importation and exportation of all blocks", () => {
        cy.visit("/page-builder/page-blocks");
        // Exports all created data and saves the exported string value.
        cy.pbCreateCategoryAndBlocks({
            blockCategory: blockCategoryData1,
            blockNames: blockNames1
        });
        cy.pbCreateCategoryAndBlocks({
            blockCategory: blockCategoryData2,
            blockNames: blockNames2
        });
        cy.pbCreateCategoryAndBlocks({
            blockCategory: blockCategoryData3,
            blockNames: blockNames3
        });

        cy.findByPlaceholderText("Search blocks").should("exist");
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("pb-blocks-list-options-menu")` if issue is fixed.
        cy.get('button[data-testid="pb-blocks-list-options-menu"]').click();
        cy.findByText("Export all blocks").click();
        cy.findByText("Your export is now ready!").should("exist");

        cy.get(".link-text.mdc-typography--body2")
            .invoke("text")
            .then(text => {
                const url = text.trim();
                console.log(url);
                cy.pbDeleteAllBlockCategories();
                cy.pbDeleteAllBlocks();

                cy.visit("/page-builder/page-blocks");
                cy.findByPlaceholderText("Search blocks").should("exist");
                // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
                // Now targeting <button> directly. Revert to `.findByTestId("pb-blocks-list-options-menu")` if issue is fixed.
                cy.get('button[data-testid="pb-blocks-list-options-menu"]').click();
                cy.findByRole("menuitem", { name: "Import blocks" }).click();
                cy.contains("Paste File URL").should("exist").click();
                cy.contains("File URL").type(url);
                cy.contains("Continue").click();
                cy.findByText("All blocks have been imported").should("exist");
                cy.contains("Continue").click();

                // Validation of imported blocks and categories.
                cy.contains(blockCategoryData1.name).should("exist");
                cy.contains(blockCategoryData2.name).should("exist");
                cy.contains(blockCategoryData3.name).should("exist");

                cy.contains(blockCategoryData1.name).click();
                cy.contains(blockNames1[0]).should("exist");
                cy.contains(blockCategoryData1.name).click();
                cy.contains(blockNames2[0]).should("exist");
                cy.contains(blockCategoryData1.name).click();
                cy.contains(blockNames3[0]).should("exist");
            });
    });

    it("Test the importation and exportation functionality of the import block button", () => {
        cy.visit("/page-builder/page-blocks");
        cy.pbCreateCategoryAndBlocks({
            blockCategory: blockCategoryData1,
            blockNames: blockNames1
        });

        cy.contains(blockCategoryData1.name).click();
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("pb-blocks-list-block-export-btn")` if issue is fixed.
        cy.get('button[data-testid="pb-blocks-list-block-export-btn"]').click();
        cy.findByText("Your export is now ready!").should("exist");
        cy.get(".link-text.mdc-typography--body2")
            .invoke("text")
            .then(url => {
                cy.pbDeleteAllBlockCategories();
                cy.pbDeleteAllBlocks();

                cy.visit("/page-builder/page-blocks");
                // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
                // Now targeting <button> directly. Revert to `.findByTestId("pb-blocks-list-options-menu")` if issue is fixed.
                cy.get('button[data-testid="pb-blocks-list-options-menu"]').click();
                cy.findByRole("menuitem", { name: "Import blocks" }).click();
                cy.contains("Paste File URL").should("exist").click();
                cy.contains("File URL").type(url);
                cy.contains("Continue").click();
                cy.findByText("All blocks have been imported").should("exist");
                cy.contains("Continue").click();

                cy.visit("/page-builder/page-blocks");
                cy.contains(blockCategoryData1.name).should("exist");
            });
    });
});
