import { customAlphabet } from "nanoid";

context("Page Builder - Blocks", () => {
    const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz");
    const titleString1 = "ABC";
    const titleString2 = "DEF";
    const titleString3 = "GHI";
    const titleString4 = "!#$%&/()=?*";

    const titleSlug = "TKL";

    const pageTemplateData1 = {
        title: titleString1,
        slug: titleSlug,
        description: nanoid(6),
        tags: [],
        layout: "static",
        pageCategory: "static"
    };
    const pageTemplateData2 = {
        title: titleString2,
        slug: titleSlug,
        description: nanoid(6),
        tags: [],
        layout: "static",
        pageCategory: "static"
    };
    const pageTemplateData3 = {
        title: titleString3,
        slug: titleSlug,
        description: nanoid(6),
        tags: [],
        layout: "static",
        pageCategory: "static"
    };
    const pageTemplateData4 = {
        title: titleString4,
        slug: titleSlug,
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

    it("Should be able to create templates and then sort them correctly", () => {

        cy.visit("/page-builder/page-templates");

        cy.findByTestId("default-data-list").within(() => {
            cy.get("li .mdc-list-item__text").each(($span) => {
                cy.wrap($span).invoke('text').then((text) => {
                    const extractedText = text.split(titleSlug)[0].trim();
                    console.log(extractedText);
                });
            });
        });
        

    });
});
