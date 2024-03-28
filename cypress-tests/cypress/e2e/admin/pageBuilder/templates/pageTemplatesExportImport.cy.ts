import { customAlphabet } from "nanoid";

context("Page Builder - Template Export&Import", () => {
    const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz");
    let url = "";
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
        cy.login();
        cy.pbDeleteAllTemplates();
        cy.pbCreatePageTemplate(pageTemplateData1);
        cy.pbCreatePageTemplate(pageTemplateData2);
        cy.pbCreatePageTemplate(pageTemplateData3);
        cy.pbCreatePageTemplate(pageTemplateData4);
    });

    it("Should be able to export templates and then import them again", () => {
        cy.visit("/page-builder/page-templates");
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("export-template-button")` if issue is fixed.
        cy.get('button[data-testid="export-template-button"]').click();
        cy.findByTestId("pb-templates-export-dialog-export-url")
            .invoke("text")
            .then(text => {
                url = text.trim();
                cy.pbDeleteAllTemplates();

                cy.visit("/page-builder/page-templates");
                cy.findByPlaceholderText("Search templates").should("exist");
                // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
                // Now targeting <button> directly. Revert to `.findByTestId("pb-templates-list-options-btn")` if issue is fixed.
                cy.get('button[data-testid="pb-templates-list-options-btn"]').click();
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

                cy.pbListPageTemplates().then(pageTemplates => {
                    cy.wrap(pageTemplates.length).should("eq", 4);
                });
            });
    });
});
