import { customAlphabet } from "nanoid";

context("Page Builder - Template Export&Import", () => {
    const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz");
    const titleString1 = nanoid(6);
    const titleString2 = nanoid(6);
    const titleString3 = nanoid(6);
    const titleString4 = "!#$%&/()=?*";
    const pageTemplateData1 = {
        title: titleString1,
        slug: nanoid(6),
        description: nanoid(6),
        tags: [],
        layout: "static",
        pageCategory: "static"
    };
    const pageTemplateData2 = {
        title: titleString2,
        slug: nanoid(6),
        description: nanoid(6),
        tags: [],
        layout: "static",
        pageCategory: "static"
    };
    const pageTemplateData3 = {
        title: titleString3,
        slug: nanoid(6),
        description: nanoid(6),
        tags: [],
        layout: "static",
        pageCategory: "static"
    };
    const pageTemplateData4 = {
        title: titleString4,
        slug: nanoid(6),
        description: nanoid(6),
        tags: [],
        layout: "static",
        pageCategory: "static"
    };

    beforeEach(() => {
        cy.login()
            .then(() => cy.pbDeleteAllTemplates())
            .then(() => cy.pbCreatePageTemplate(pageTemplateData1))
            .then(() => cy.pbCreatePageTemplate(pageTemplateData2))
            .then(() => cy.pbCreatePageTemplate(pageTemplateData3))
            .then(() => cy.pbCreatePageTemplate(pageTemplateData4));
    });

    it("Should be able to export templates and then import them again", () => {
        cy.visit("/page-builder/page-templates");
        cy.findByTestId("export-template-button").click();
        cy.findByTestId("pb-templates-export-dialog-export-url")
            .invoke("text")
            .then(text => {
                const url = text.trim();
                console.log(url);
                cy.pbDeleteAllBlockCategories();
                cy.pbDeleteAllBlocks();

                cy.visit("/page-builder/page-templates");
                cy.findByPlaceholderText("Search templates").should("exist");
                cy.findByTestId("pb-templates-list-options-btn").click();
                cy.findByRole("menuitem", { name: "Import Templates" }).click();
                cy.contains("Paste File URL").should("exist").click();
                cy.contains("File URL").type(url);
                cy.contains("Continue").click();
                cy.findByText("All templates have been imported").should("exist");
                cy.contains("Continue").click();
                // Validation of imported blocks and categories.

                cy.findByPlaceholderText("Search templates").should("exist");
                cy.contains(pageTemplateData1.title).should("exist");
                cy.contains(pageTemplateData2.title).should("exist");
                cy.contains(pageTemplateData3.title).should("exist");
                cy.contains(pageTemplateData4.title).should("exist");
            });
    });
});
