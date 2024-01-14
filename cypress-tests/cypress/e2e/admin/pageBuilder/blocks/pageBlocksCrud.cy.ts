import { generateAlphaLowerCaseId } from "@webiny/utils/generateId";

context("Page Builder - Blocks", () => {
    const blockCategoryName = generateAlphaLowerCaseId(10);
    const blockCategorySlug = generateAlphaLowerCaseId(10);

    beforeEach(() => {
        cy.login();
        cy.pbDeleteAllBlocks();
        cy.pbDeleteAllBlockCategories();
    });

    it("Should be able to create a block category and a block and then edit, duplicate and delete it", () => {
        // Navigates to page, checks for proper loading and then clicks create new category button.
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.findByTestId("pb-blocks-list-new-block-btn").click();
        cy.findByTestId("pb-blocks-list-new-block-category-btn").click();

        // Fills in block category data and saves it.
        cy.findByRole("textbox", { name: "Name" }).type(blockCategoryName);
        cy.findByRole("textbox", { name: "Slug" }).type(blockCategorySlug);
        cy.findByRole("textbox", { name: "Description" }).type(blockCategoryName);
        cy.findByTestId("pb-block-categories-form-save-block-category-btn").click();

        // Creates new block within the created category and checks if block edit page loads.
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.findByTestId("pb-blocks-list-new-block-btn").click();
        cy.findByText(blockCategorySlug).click();
        cy.findByTestId("pb-blocks-editor-save-changes-btn").click();
        cy.findByTestId("pb-blocks-list-new-block-btn").should("exist");

        // Checks if editing block categories works.
        cy.visit("/page-builder/block-categories");
        cy.findByPlaceholderText("Search block categories").should("exist");
        cy.contains(blockCategoryName).click();
        cy.findByRole("textbox", { name: "Description" }).type(blockCategoryName + "1");
        cy.findByTestId("pb-block-categories-form-save-block-category-btn").click();
        cy.findByPlaceholderText("Search block categories", { timeout: 10000 }).should("exist");
        cy.contains(blockCategoryName + "1").should("exist");

        // Checks if block duplication works.
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.contains(blockCategoryName).click();
        cy.findByTestId("pb-blocks-list-block-duplicate-btn").eq(0).click();
        cy.findByPlaceholderText("Search blocks", { timeout: 10000 }).should("exist");
        cy.contains(blockCategoryName).click();
        cy.contains("New block (copy)").should("exist");
        cy.contains("New block").should("exist");

        // Checks if deleting a block category works as expected when it contains blocks.

        cy.visit("/page-builder/block-categories");
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByTestId("pb-block-categories-list-delete-block-category-btn").click({
                        force: true
                    });
                });
        });
        cy.findByTestId("confirmationdialog-confirm-action").click();
        cy.findByText(
            "Cannot delete block category because some page blocks are linked to it."
        ).should("be.visible");

        // Checks if block deletion works.
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.contains(blockCategoryName).click();
        cy.findAllByTestId("pb-blocks-list-block-delete-btn").eq(0).click();
        cy.findByTestId("confirmationdialog-confirm-action").click();
        cy.findAllByTestId("pb-blocks-list-block-delete-btn").eq(0).click();
        cy.findByTestId("confirmationdialog-confirm-action").click();
        cy.contains("New Block").should("exist");

        // Checks if deleting a block category works as expected when it doesn't contain blocks.

        cy.visit("/page-builder/block-categories");
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByTestId("pb-block-categories-list-delete-block-category-btn").click({
                        force: true
                    });
                });
        });
        cy.findByTestId("confirmationdialog-confirm-action").click();

        // Checks if no categories are left.
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li").should("not.exist"); // Assert that there are no <li> elements
        });

        // Deletes all remaining test data.
        cy.pbDeleteAllBlocks();
        cy.pbDeleteAllBlockCategories();
    });
});
