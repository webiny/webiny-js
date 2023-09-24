import { customAlphabet } from "nanoid";

context("Page Builder - Blocks", () => {
    const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz");
    beforeEach(() => cy.login());
    beforeEach(() => cy.pbDeleteBlocks());
    beforeEach(() => cy.pbAllDeleteBlockCategories());

    //Data used for creating multible block categories.

    const blockNames1 = ["Block1Name"];
    const blockNames2 = ["Block1Name", "Block2Name"];
    const blockNames3 = ["Block1Name", "Block2Name", "Block3Name"];
    const blockNames4 = ["!#$%&/()="];

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

    const blockCategoryData4 = {
        name: nanoid(10).toLowerCase(),
        slug: nanoid(10).toLowerCase(),
        icon: "icon-name",
        description: nanoid(10).toLowerCase()
    };
    it.only("Should be able to use the search bar as expected", () => {
        cy.pbCreateCategoryAndBlocks(blockCategoryData1, blockNames1)
            .then(() => {
                return cy.pbCreateCategoryAndBlocks(blockCategoryData2, blockNames2);
            })
            .then(() => {
                return cy.pbCreateCategoryAndBlocks(blockCategoryData3, blockNames3);
            })
            .then(() => {
                return cy.pbCreateCategoryAndBlocks(blockCategoryData4, blockNames4);
        });

        cy.visit("/page-builder/page-blocks");

        //Check if all created categories are displayed properly for an empty search bar.
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.contains(blockCategoryData1.name).should("exist");
        cy.contains(blockCategoryData2.name).should("exist");
        cy.contains(blockCategoryData3.name).should("exist");
        cy.contains(blockCategoryData4.name).should("exist");
        //Check if all created categories are displayed properly for when searching for a block present in all categories.
        cy.findByPlaceholderText("Search blocks").clear().type(blockNames3[0]);
        cy.contains(blockCategoryData1.name).should("exist");
        cy.contains(blockCategoryData2.name).should("exist");
        cy.contains(blockCategoryData3.name).should("exist");

        //Check if all created categories are displayed properly for when searching for a block present in two of the three categories.
        cy.findByPlaceholderText("Search blocks").clear().type(blockNames3[1]);
        cy.contains(blockCategoryData2.name).should("exist");
        cy.contains(blockCategoryData3.name).should("exist");

        //Check if all created categories are displayed properly for when searching for a block present in one of the three categories.
        cy.findByPlaceholderText("Search blocks").clear().type(blockNames3[2]);
        cy.contains(blockCategoryData3.name).should("exist");

        //Check if the search bar acts properly when searching for special characters.

        cy.findByPlaceholderText("Search blocks").clear().type("!#$%&/()=");
        cy.contains(blockCategoryData4.name).should("exist");

        //Check that no categories are displayed when searching for a string that doesn't match any created block names.
        //cy.findByPlaceholderText("Search blocks").clear().type("Testing, Testing, Testing");
        //cy.contains(blockCategoryData1.name).should("not.exist");
        //cy.contains(blockCategoryData2.name).should("not.exist");
        //cy.contains(blockCategoryData3.name).should("not.exist");
        //cy.contains(blockCategoryData4.name).should("not.exist");
        
        //I know that I can probably search for the ul elements to make sure nothing shows but is there really no way to do it like this @Adrian

        // Deletes all remaining test data.
        cy.wait(100000);
        cy.pbDeleteBlocks();
        cy.pbAllDeleteBlockCategories();
    });

    it("Should not be able to delete a category that has existing blocks", () => {
        cy.pbCreateCategoryAndBlocks(blockCategoryData1, blockNames1)
        cy.visit("/page-builder/page-blocks");

        //Checks if editing block name works(NOT WORKING)
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.contains(blockCategoryData1.name).click();
        cy.findByTestId("pb-blocks-list-block-edit-btn").click();
        cy.findByTestId("pb-editor-page-title").should("exist");
        cy.findByTestId("pb-editor-page-title").click().clear().type("Newest block name");
        //cy.get('.css-1bo8ypc-TitleInputWrapper input').clear().type("Newest block name");
        cy.findByTestId("pb-blocks-editor-save-changes-btn").click();
        cy.findByTestId("pb-blocks-list-new-block-btn").should("exist");
        cy.contains(blockCategoryData1.name).click();
        cy.contains("Newest block name").should("exist");   
        //Checks if deleting non-empty block categories behaves properly
        cy.visit("/page-builder/block-categories");
        cy.get('.css-dmcazx-dataListContent').trigger('mouseover');

        cy.wait(100000);
        cy.pbDeleteBlocks();
        cy.pbAllDeleteBlockCategories();
    });
});
