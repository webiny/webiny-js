import { generateAlphaLowerCaseId } from "@webiny/utils/generateId";

context("Page Builder - Block Preview", () => {
    beforeEach(() => {
        cy.login();
        cy.pbDeleteAllBlocks();
        cy.pbDeleteAllBlockCategories();
        cy.pbDeleteAllTemplates();
    });
    const blockName = ["Block1Name"];
    const headerTitle = "Header test";
    const headerTitleUpdate = "Edited Header Text";
    const templateData = "tester";

    const blockCategoryData = {
        name: generateAlphaLowerCaseId(10),
        slug: generateAlphaLowerCaseId(10),
        icon: "icon-name",
        description: generateAlphaLowerCaseId(10)
    };

    it("Should be able to programatically create and assert a block exists with a proper heading", () => {
        cy.pbCreateCategoryAndBlocks({
            blockCategory: blockCategoryData,
            blockNames: blockName,
            content: {
                type: "heading",
                text: headerTitle
            }
        });

        cy.visit("/page-builder/page-blocks");

        // Asserts the programatically created block contains the correct data.
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => cy.contains(blockCategoryData.name).should("exist").click());
        });
        cy.contains(blockName[0]).should("exist");
        cy.contains(headerTitle).should("exist");

        // Edits the current header for headerTitleUpdate.
        cy.findByTestId("pb-blocks-list-block-edit-btn").click();
        cy.get('pb-block:contains("Header test")').click();
        cy.get('[contenteditable="true"]').clear().type(headerTitleUpdate).click();
        cy.contains("Save Changes").click();

        // Asserts the newly edited header/block contains the right information.
        cy.contains(blockCategoryData.name).click();
        cy.contains(blockName[0]).should("exist");
        cy.contains(headerTitleUpdate).should("exist");

        // Navigate to the template page and create a new template.
        cy.visit("/page-builder/page-templates");
        cy.findAllByTestId("pb-templates-list-new-template-btn").click();
        cy.findByRole("textbox", { name: "Title" }).type(templateData);
        cy.findByRole("textbox", { name: "Slug" }).type(templateData);
        cy.findByRole("textbox", { name: "Description" }).type(templateData);
        cy.findByRole("button", { name: "Create" }).click();

        // Assert the block is being properly displayed.
        cy.findByTestId("pb-content-add-block-button").click();
        cy.findByTestId("pb-editor-page-blocks-list-item-block-1-name").contains(headerTitleUpdate);

        // Add the block to the template.
        cy.contains(blockCategoryData.name).click();
        cy.get('button[label="Click to Add"]').click({ force: true });
        cy.contains("Save Changes").click();

        // Assert the template is being displayed properly on the left and then the right side of the screen.
        cy.findByTestId("default-data-list")
            .find("li.mdc-list-item")
            .should("contain", templateData);
        cy.findByTestId("default-data-list").find("li.mdc-list-item").first().click();
        cy.get('[data-testid="pb-page-templates-form"]').contains(headerTitleUpdate);
    });
});
