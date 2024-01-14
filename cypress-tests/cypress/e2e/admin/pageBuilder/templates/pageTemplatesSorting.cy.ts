import { generateAlphaLowerCaseId } from "@webiny/utils/generateId";

context("Page Builder - Template Sorting", () => {
    const titleString1 = "ABC";
    const titleString2 = "DEF";
    const titleString3 = "GHI";
    const titleString4 = "!#$%&/()=?*";

    const pageTemplateData1 = {
        title: titleString1,
        slug: generateAlphaLowerCaseId(10),
        description: generateAlphaLowerCaseId(10),
        tags: [],
        layout: "static",
        pageCategory: "static"
    };
    const pageTemplateData2 = {
        title: titleString2,
        slug: generateAlphaLowerCaseId(10),
        description: generateAlphaLowerCaseId(10),
        tags: [],
        layout: "static",
        pageCategory: "static"
    };
    const pageTemplateData3 = {
        title: titleString3,
        slug: generateAlphaLowerCaseId(10),
        description: generateAlphaLowerCaseId(10),
        tags: [],
        layout: "static",
        pageCategory: "static"
    };
    const pageTemplateData4 = {
        title: titleString4,
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
        cy.pbCreatePageTemplate(pageTemplateData2);
        cy.pbCreatePageTemplate(pageTemplateData3);
        cy.pbCreatePageTemplate(pageTemplateData4);
    });

    it("Should be able to create templates and then sort them correctly", () => {
        cy.visit("/page-builder/page-templates");

        cy.findByTestId("default-data-list.filter").click();
        cy.get(".webiny-ui-select select").select("Newest to oldest");
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => cy.findByText(titleString4).should("exist"));
        });

        cy.visit("/page-builder/page-templates");
        cy.findByTestId("default-data-list.filter").click();
        cy.get(".webiny-ui-select select").select("Oldest to newest");
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => cy.findByText(titleString1).should("exist"));
        });

        cy.visit("/page-builder/page-templates");
        cy.findByTestId("default-data-list.filter").click();
        cy.get(".webiny-ui-select select").select("Title A-Z");
        cy.findByTestId("default-data-list")
            .first()
            .within(() => {
                cy.get("li")
                    .first()
                    .within(() => cy.findByText(titleString4).should("exist"));
            });

        cy.visit("/page-builder/page-templates");
        cy.findByTestId("default-data-list.filter").click();
        cy.get(".webiny-ui-select select").select("Title Z-A");
        cy.findByTestId("default-data-list")
            .first()
            .within(() => {
                cy.get("li")
                    .first()
                    .within(() => cy.findByText(titleString3).should("exist"));
            });
    });
});
