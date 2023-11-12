import { customAlphabet } from "nanoid";

context("Page Builder - Templates", () => {
    const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz");
    const titleString1 = "ABC";
    const titleString2 = "DEF";
    const titleString3 = "GHI";
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
        cy.wait(1000);
        cy.createPageTemplate(pageTemplateData1);
        cy.createPageTemplate(pageTemplateData2);
        cy.createPageTemplate(pageTemplateData3);
        cy.createPageTemplate(pageTemplateData4);
    });

    it("Should be able to create templates and then sort them correctly", () => {
        cy.visit("/page-builder/page-templates");

        cy.findByTestId("default-data-list.filter").click();
        cy.get(".webiny-ui-select select").select("Newest to oldest");
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li .mdc-list-item__text")
                .first()
                .each($span => {
                    cy.wrap($span).invoke("text").should("include", titleString4);
                });
        });
        cy.visit("/page-builder/page-templates");
        cy.findByTestId("default-data-list.filter").click();
        cy.get(".webiny-ui-select select").select("Oldest to newest");
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li .mdc-list-item__text")
                .first()
                .each($span => {
                    cy.wrap($span).invoke("text").should("include", titleString1);
                });
        });
        cy.visit("/page-builder/page-templates");
        cy.findByTestId("default-data-list.filter").click();
        cy.get(".webiny-ui-select select").select("Title A-Z");
        cy.findByTestId("default-data-list")
            .first()
            .within(() => {
                cy.get("li .mdc-list-item__text")
                    .first()
                    .each($span => {
                        cy.wrap($span).invoke("text").should("include", titleString4);
                    });
            });

        cy.visit("/page-builder/page-templates");
        cy.findByTestId("default-data-list.filter").click();
        cy.get(".webiny-ui-select select").select("Title Z-A");
        cy.findByTestId("default-data-list")
            .first()
            .within(() => {
                cy.get("li .mdc-list-item__text")
                    .first()
                    .each($span => {
                        cy.wrap($span).invoke("text").should("include", titleString3);
                    });
            });
    });
});
