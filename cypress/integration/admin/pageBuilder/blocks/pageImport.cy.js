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

    beforeEach(() => cy.login());
    beforeEach(() => cy.pbDeleteBlocks());
    beforeEach(() => cy.pbDeleteBlockCategories());

    const numBlocks = 3; // Change this to the desired number of blocks

    it("Test the exportation of all blocks", () => {
        cy.visit("/page-builder/page-blocks");

        const blockCategoryData1 = {
            name: makeid(10),
            slug: makeid(10),
            icon: "icon-name",
            description: makeid(10)
        };

        const blockCategoryData2 = {
            name: makeid(10),
            slug: makeid(10),
            icon: "icon-name",
            description: makeid(10)
        };

        const blockCategoryData3 = {
            name: makeid(10),
            slug: makeid(10),
            icon: "icon-name",
            description: makeid(10)
        };

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
    });
});
