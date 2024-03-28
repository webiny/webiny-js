import { customAlphabet } from "nanoid";

context("Page Builder - Template Sorting", () => {
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
        cy.pbCreatePageTemplate(pageTemplateData1);
        cy.pbCreatePageTemplate(pageTemplateData2);
        cy.pbCreatePageTemplate(pageTemplateData3);
        cy.pbCreatePageTemplate(pageTemplateData4);
    });

    it("Should be able to create templates and then sort them correctly", () => {
        cy.visit("/page-builder/page-templates");

        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("default-data-list.filter")` if issue is fixed.
        cy.get('button[data-testid="default-data-list.filter"]').click();
        cy.get(".webiny-ui-select select").select("Newest to oldest");
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => cy.findByText(titleString4).should("exist"));
        });

        cy.visit("/page-builder/page-templates");
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("default-data-list.filter")` if issue is fixed.
        cy.get('button[data-testid="default-data-list.filter"]').click();
        cy.get(".webiny-ui-select select").select("Oldest to newest");
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => cy.findByText(titleString1).should("exist"));
        });

        cy.visit("/page-builder/page-templates");
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("default-data-list.filter")` if issue is fixed.
        cy.get('button[data-testid="default-data-list.filter"]').click();
        cy.get(".webiny-ui-select select").select("Title A-Z");
        cy.findByTestId("default-data-list")
            .first()
            .within(() => {
                cy.get("li")
                    .first()
                    .within(() => cy.findByText(titleString4).should("exist"));
            });

        cy.visit("/page-builder/page-templates");
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("default-data-list.filter")` if issue is fixed.
        cy.get('button[data-testid="default-data-list.filter"]').click();
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
