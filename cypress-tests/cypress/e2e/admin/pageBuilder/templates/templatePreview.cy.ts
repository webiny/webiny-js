import { customAlphabet } from "nanoid";

context("Page Builder - Template Preview", () => {
    const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz");
    const pageTemplateData1 = {
        title: "test1",
        slug: nanoid(6),
        description: nanoid(6),
        tags: [],
        layout: "static",
        pageCategory: "static"
    };
    const pageTemplateData2 = {
        title: "test2",
        slug: nanoid(6),
        description: nanoid(6),
        tags: [],
        layout: "static",
        pageCategory: "static"
    };
    const pageTemplateData3 = {
        title: "test3",
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
        cy.findByTestId("new-page-button").click();

        cy.contains("Pick a template for your new page").should("exist");
        cy.contains(pageTemplateData1.title).should("exist");
        cy.contains(pageTemplateData1.description).should("exist");
        cy.contains(pageTemplateData2.title).should("exist");
        cy.contains(pageTemplateData2.description).should("exist");
        cy.contains(pageTemplateData3.title).should("exist");
        cy.contains(pageTemplateData3.description).should("exist");

        // Find and click on each li item within the ul element.
        cy.findByTestId("pb-new-page-dialog-templates-list")
            .find("li")
            .each(($li, index) => {
                const counter = 3 - index;
                cy.wrap($li).click();
                // Wait for the right panel to load.
                cy.findByTestId("pb-new-page-dialog-template-preview").should("be.visible");
                // Immediately sets the value to the value of the correct pageTemplateData defined at the start.
                const currentTemplateData = eval(`pageTemplateData${counter}`);
                // Check if the clicked element is being properly displayed on the right side of the screen.
                cy.findByTestId("pb-new-page-dialog-template-preview")
                    .contains(`${currentTemplateData.title}`)
                    .should("exist");
                cy.findByTestId("pb-new-page-dialog-template-preview")
                    .contains(`${currentTemplateData.description}`)
                    .should("exist");
            });
    });
});
