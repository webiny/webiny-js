import { generateAlphaLowerCaseId } from "@webiny/utils/generateId";

context("Page Builder - Template Visibility", () => {
    const pageTemplateData1 = {
        title: generateAlphaLowerCaseId(10),
        slug: generateAlphaLowerCaseId(10),
        description: generateAlphaLowerCaseId(10),
        tags: [],
        layout: "static",
        pageCategory: "static"
    };

    beforeEach(() => {
        cy.login();
        cy.pbDeleteAllTemplates();
        cy.pbCreatePageTemplate(pageTemplateData1);
    });

    it("Should be able to see one newly created template in the new page page", () => {
        cy.visit("/page-builder/pages?folderId=root");
        cy.findByTestId("new-page-button").click();

        cy.contains("Pick a template for your new page").should("exist");
        cy.contains(pageTemplateData1.title).should("exist");
        cy.contains(pageTemplateData1.description).should("exist");
    });
});
