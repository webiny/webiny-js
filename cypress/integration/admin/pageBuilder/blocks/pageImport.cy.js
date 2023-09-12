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
    var blockCategorySlug = makeid(10);
    var blockCategoryDesc = makeid(10);

    var blockName = makeid(10);
    var blockContent = makeid(10);
    var blockPreview = makeid(10);
    beforeEach(() => cy.login());

    const blockCategoryData = {
        name: blockCategoryName,
        slug: blockCategorySlug,
        icon: "icon-name",
        description: blockCategoryDesc
    };

    const pageBlockData = {
        name: blockName,
        content: blockContent,
        preview: blockPreview
    };

    it("Test the exportation of all blocks", () => {
        cy.visit("/page-builder/page-blocks");
        cy.pbCreateCategory1(blockCategoryData).then(category => {
            cy.pbCreateBlock(pageBlockData, category.slug).then(blockResponse => {
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
        cy.pbDeleteBlocks();
        cy.pbDeleteBlockCategories();
    });
});