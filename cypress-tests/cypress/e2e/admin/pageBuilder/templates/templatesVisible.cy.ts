import { customAlphabet } from "nanoid";

context("Page Builder - Templates", () => {
    const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz");
    const pageTemplateData1 = {
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
        cy.createPageTemplate(pageTemplateData1);
    });

    it("Should be able to see one newly created template in the new page page", () => {
        cy.visit("/page-builder/pages?folderId=root");
        cy.findByTestId("new-page-button").click();

        cy.contains("Pick a template for your new page").should("exist");
        cy.contains(pageTemplateData1.title).should("exist");
        cy.contains(pageTemplateData1.description).should("exist");
    });
});
