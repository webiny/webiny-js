import { customAlphabet } from "nanoid";

context("Page Builder - Blocks", () => {
    const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz");
    const pageTemplateData1 = {
        title: nanoid(6),
        slug: nanoid(6),
        description: nanoid(6),
        tags: [],
        layout: "static",
        pageCategory: "static"
    };
    const pageTemplateData2 = {
        title: nanoid(6),
        slug: nanoid(6),
        description: nanoid(6),
        tags: [],
        layout: "static",
        pageCategory: "static"
    };
    const pageTemplateData3 = {
        title: nanoid(6),
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
    });

    it("Should be able to create a page and view all existing templates in it", () => {
        cy.visit("/page-builder/pages?folderId=root");
        cy.wait(1000);
        cy.findByTestId("new-page-button").click();
        cy.wait(500);
        cy.contains("Pick a template for your new page").should("exist");
        cy.contains(pageTemplateData1.title).should("exist");
        cy.contains(pageTemplateData1.description).should("exist");
        cy.contains(pageTemplateData2.title).should("exist");
        cy.contains(pageTemplateData2.description).should("exist");
        cy.contains(pageTemplateData3.title).should("exist");
        cy.contains(pageTemplateData3.description).should("exist");

        cy.get(".css-1rl9ll7-listStyle .css-5bicyh-listItem").each((item, index) => {
            // Click on the current item
            cy.wrap(item).click();

            // Wait for the right panel to load (adjust this timeout if needed)
            cy.get(".webiny-split-view__right-panel").should("be.visible", { timeout: 10000 });
            cy.contains(
                (pageTemplateData1.title && pageTemplateData1.description) || (pageTemplateData2.title && pageTemplateData2.description) || (pageTemplateData3.title && pageTemplateData3.description)
            ).should("exist");
        });
    });
});
