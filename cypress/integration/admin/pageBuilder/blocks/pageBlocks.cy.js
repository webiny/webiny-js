function makeid(length) {
    var result = "";
    var characters = "abcdefghijklmnopqrstuvwxyz";
    var charactersLength = characters.length;

    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

context("Blocks Page", () => {
    let tokenStorage;
    var blockCategoryName = makeid(10);
    var slugName = makeid(10);
    beforeEach(() => cy.login());

    it("Should be able to create a block category and a block and then edit, duplicate and delete it ", () => {
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.findByTestId("pb-blocks-list-new-block-btn").click();
        cy.findByTestId("pb-blocks-list-new-block-category-btn").click();
        cy.findByRole("textbox", { name: "Name" }).type(blockCategoryName);
        cy.findByRole("textbox", { name: "Slug" }).type(slugName);
        cy.findByRole("textbox", { name: "Description" }).type(blockCategoryName);
        cy.findByTestId("pb-block-categories-form-save-block-category-btn").click();
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.findByTestId("pb-blocks-list-new-block-btn").click();
        cy.findByText(slugName).click();
        cy.findByTestId("pb-blocks-editor-save-changes-btn").click();
        cy.findByTestId("pb-blocks-list-new-block-btn").should("exist");
        cy.visit("/page-builder/block-categories");
        cy.findByPlaceholderText("Search block categories").should("exist");
        cy.contains(blockCategoryName).click();
        cy.findByRole("textbox", { name: "Description" }).type(blockCategoryName + "1");
        cy.findByTestId("pb-block-categories-form-save-block-category-btn").click();
        cy.findByPlaceholderText("Search block categories", { timeout: 10000 }).should("exist");
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.contains(blockCategoryName).click();
        cy.findByTestId("pb-blocks-list-block-duplicate-btn").eq(0).click();
        cy.findByPlaceholderText("Search blocks", { timeout: 10000 }).should("exist");
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.contains(blockCategoryName).click();
        cy.findAllByTestId("pb-blocks-list-block-delete-btn").eq(0).click();
        cy.findByTestId("confirmationdialog-confirm-action").click();
        cy.findAllByTestId("pb-blocks-list-block-delete-btn").eq(1).click();
        cy.findByTestId("confirmationdialog-confirm-action").click();
        cy.contains("New Block").should("exist");
		
	cy.pbDeleteBlocks();
	cy.pbDeleteBlockCategories();
    });    
});