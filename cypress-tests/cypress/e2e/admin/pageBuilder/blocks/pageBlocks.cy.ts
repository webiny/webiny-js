import { generateAlphaLowerCaseId } from "@webiny/utils/generateId";

context("Page Builder - Blocks", () => {
    beforeEach(() => {
        cy.login();
        cy.pbDeleteAllBlocks();
        cy.pbDeleteAllBlockCategories();
    });

    // Data used for creating multiple block categories.
    const blockNames1 = ["Block1Name"];
    const blockNames2 = ["Block1Name", "Block2Name"];
    const blockNames3 = ["Block1Name", "Block2Name", "Block3Name"];
    const blockNames4 = ["!#$%&/()="];

    const blockCategoryData1 = {
        name: generateAlphaLowerCaseId(10),
        slug: generateAlphaLowerCaseId(10),
        icon: "icon-name",
        description: generateAlphaLowerCaseId(10)
    };

    const blockCategoryData2 = {
        name: generateAlphaLowerCaseId(10),
        slug: generateAlphaLowerCaseId(10),
        icon: "icon-name",
        description: generateAlphaLowerCaseId(10)
    };

    const blockCategoryData3 = {
        name: generateAlphaLowerCaseId(10),
        slug: generateAlphaLowerCaseId(10),
        icon: "icon-name",
        description: generateAlphaLowerCaseId(10)
    };

    const blockCategoryData4 = {
        name: generateAlphaLowerCaseId(10),
        slug: generateAlphaLowerCaseId(10),
        icon: "icon-name",
        description: generateAlphaLowerCaseId(10)
    };

    it("Should be able to use the search bar as expected", () => {
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

        cy.pbCreateCategoryAndBlocks({
            blockCategory: blockCategoryData4,
            blockNames: blockNames4
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

        cy.findByTestId("default-data-list").within(() => {
            cy.get("li").first().should("exist");
        });
    });

    it("Should be able to edit newly created block", () => {
        cy.pbCreateCategoryAndBlocks({
            blockCategory: blockCategoryData1,
            blockNames: blockNames1
        });

        cy.visit("/page-builder/page-blocks");

        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.contains(blockCategoryData1.name).click();
        cy.wait(500).findByTestId("pb-blocks-list-block-edit-btn").click();
        cy.wait(1500).findByTestId("pb-editor-page-title").click();
        cy.get(`input[value="${blockNames1}"]`)
            .clear()
            .type(blockNames1 + "1")
            .blur();

        cy.findByTestId("pb-blocks-editor-save-changes-btn").click();
        cy.findByTestId("pb-blocks-list-new-block-btn").should("exist");
        cy.contains(blockCategoryData1.name).click();
        cy.contains(blockNames1 + "1").should("exist");
    });
});
