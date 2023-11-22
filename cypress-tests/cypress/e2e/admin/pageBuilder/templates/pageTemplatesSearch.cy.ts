import { customAlphabet } from "nanoid";

context("Page Builder - Template Search", () => {
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
        cy.login();
        cy.pbDeleteAllTemplates();
        cy.pbCreatePageTemplate(pageTemplateData1);
        cy.pbCreatePageTemplate(pageTemplateData2);
        cy.pbCreatePageTemplate(pageTemplateData3);
        cy.pbCreatePageTemplate(pageTemplateData4);
    });

    it("Should be able to create templates and then search for them", () => {
        cy.visit("/page-builder/page-templates");
        cy.findByPlaceholderText("Search templates").should("exist");
        cy.contains(pageTemplateData1.title).should("exist");
        cy.contains(pageTemplateData2.title).should("exist");
        cy.contains(pageTemplateData3.title).should("exist");
        cy.contains(pageTemplateData4.title).should("exist");

        cy.findByPlaceholderText("Search templates").clear().type(titleString1);
        cy.contains(pageTemplateData1.title).should("exist");
        cy.contains(pageTemplateData2.title).should("not.exist");
        cy.contains(pageTemplateData3.title).should("not.exist");
        cy.contains(pageTemplateData4.title).should("not.exist");

        cy.findByPlaceholderText("Search templates").clear().type(titleString2);
        cy.contains(pageTemplateData1.title).should("not.exist");
        cy.contains(pageTemplateData2.title).should("exist");
        cy.contains(pageTemplateData3.title).should("not.exist");
        cy.contains(pageTemplateData4.title).should("not.exist");

        cy.findByPlaceholderText("Search templates").clear().type(titleString3);
        cy.contains(pageTemplateData1.title).should("not.exist");
        cy.contains(pageTemplateData2.title).should("not.exist");
        cy.contains(pageTemplateData3.title).should("exist");
        cy.contains(pageTemplateData4.title).should("not.exist");

        cy.findByPlaceholderText("Search templates").clear().type(titleString4);
        cy.contains(pageTemplateData1.title).should("not.exist");
        cy.contains(pageTemplateData2.title).should("not.exist");
        cy.contains(pageTemplateData3.title).should("not.exist");
        cy.contains(pageTemplateData4.title).should("exist");

        cy.findByPlaceholderText("Search templates")
            .clear()
            .type("This String should not return anything");
        cy.contains(pageTemplateData1.title).should("not.exist");
        cy.contains(pageTemplateData2.title).should("not.exist");
        cy.contains(pageTemplateData3.title).should("not.exist");
        cy.contains(pageTemplateData4.title).should("not.exist");
    });
});
