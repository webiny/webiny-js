import { customAlphabet } from "nanoid";

context("Page Builder - Blocks", () => {
    let tokenStorage;
    const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz");
    const blockCategoryName = nanoid(10); // Generate a random 10-character lowercase string
    const slugName = nanoid(10); // Generate another random 10-character lowercase string

    beforeEach(() => cy.login());
    beforeEach(() => cy.pbDeleteBlocks());
    beforeEach(() => cy.pbAllDeleteBlockCategories()); 

    it("Should be able to create a block category and a block and then edit, duplicate and delete it", () => {

        // Navigates to page, checks for proper loading and then clicks create new category button.
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.findByTestId("pb-blocks-list-new-block-btn").click();
        cy.findByTestId("pb-blocks-list-new-block-category-btn").click();
        
        // Fills in block category data and saves it.
        cy.findByRole("textbox", { name: "Name" }).type(blockCategoryName);
        cy.findByRole("textbox", { name: "Slug" }).type(slugName);
        cy.findByRole("textbox", { name: "Description" }).type(blockCategoryName);
        cy.findByTestId("pb-block-categories-form-save-block-category-btn").click();
		
        // Creates new block for created class and checks if block edit page loads.
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.findByTestId("pb-blocks-list-new-block-btn").click();
        cy.findByText(slugName).click();
        cy.findByTestId("pb-blocks-editor-save-changes-btn").click();
        cy.findByTestId("pb-blocks-list-new-block-btn").should("exist");
		
        // Checks if editing block name works.
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.contains(blockCategoryName).click();
        cy.findByTestId("pb-blocks-list-block-edit-btn").click();
        cy.findByTestId("pb-editor-page-title").should("exist");
        cy.findByTestId("pb-editor-page-title").click().type;
        cy.get('.css-1bo8ypc-TitleInputWrapper input').clear().type("Newest block name");
        cy.findByTestId("pb-blocks-editor-save-changes-btn").click();
        cy.findByTestId("pb-blocks-list-new-block-btn").should("exist");

        // Checks if editing block categories works.
        cy.visit("/page-builder/block-categories");
        cy.findByPlaceholderText("Search block categories").should("exist");
        cy.contains(blockCategoryName).click();
        cy.findByRole("textbox", { name: "Description" }).type(blockCategoryName + "1");
        cy.findByTestId("pb-block-categories-form-save-block-category-btn").click();
        cy.findByPlaceholderText("Search block categories", { timeout: 10000 }).should("exist");
        
        // Check if export blocks from current category button functions properly.
        cy.visit("/page-builder/page-blocks");
        cy.contains(blockCategoryName).click();
        cy.findByTestId("pb-blocks-list-block-export-btn").click();
        cy.findByText("Your export is now ready!").should("exist");

        // Checks if block duplication works.
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.contains(blockCategoryName).click();
        cy.findByTestId("pb-blocks-list-block-duplicate-btn").eq(0).click();
        cy.findByPlaceholderText("Search blocks", { timeout: 10000 }).should("exist");

        // Checks if block deletion works.
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.contains(blockCategoryName).click();
        cy.findAllByTestId("pb-blocks-list-block-delete-btn").eq(0).click();
        cy.findByTestId("confirmationdialog-confirm-action").click();
        cy.findAllByTestId("pb-blocks-list-block-delete-btn").eq(1).click();
        cy.findByTestId("confirmationdialog-confirm-action").click();
        cy.contains("New Block").should("exist");

        // Deletes all remaining test data.
        cy.pbDeleteBlocks();
        cy.pbAllDeleteBlockCategories();
    });
});
