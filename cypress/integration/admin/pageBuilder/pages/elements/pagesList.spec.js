/* eslint-disable jest/expect-expect */
import uniqid from "uniqid";

context("Page Elements - Pages List", () => {
    beforeEach(() => cy.login());

    const pageTitle = `Test page ${uniqid()}`;

    it("should be able to create Pages List element", () => {
        cy.visit("/page-builder/pages")
            .findByTestId("new-record-button")
            .click()
            .findByTestId("pb-new-page-category-modal")
            .within(() => {
                cy.findByText("Static").click();
            })
            .findByTestId("pb-editor-page-title")
            .click()
            .get(`input[value="Untitled"]`)
            .clear()
            .type(`${pageTitle} {enter}`)
            .findByTestId("pb-content-add-block-button")
            .click()
            .findByTestId("pb-editor-page-blocks-list-item-empty-block")
            .within(() => {
                cy.findByText(/click to add/i).click({ force: true });
            })
            .findByTestId("pb-editor-column-add-button")
            .click()
            .findByTestId("pb-editor-add-element-button-pages-list")
            .within(() => {
                cy.findByText(/click to add/i).click({ force: true });
            })
            .wait(500)
            .findByTestId("pb-editor-advanced-element-settings-dialog")
            .within(() => {
                cy.findByLabelText("Category")
                    .type("Static")
                    .findByText("Static")
                    .click()
                    .findByLabelText("Tags")
                    .type(`pag`)
                    .findByText("page")
                    .click()
                    .findByText("Sort direction")
                    .prev()
                    .select("Ascending")
                    .findByText("Sort by")
                    .prev()
                    .select("Title")
                    .findByText("Save")
                    .click();
            })
            .findByTestId("pb-editor-page-canvas-section")
            .within(() => {
                cy.get(".webiny-pb-page-element-page-list__item")
                    .should("have.length", 3)
                    .findByText("404")
                    .should("exist")
                    .findByText("Error Page")
                    .should("exist")
                    .findByText("Welcome to Webiny")
                    .should("exist");
            })
            .findByTestId("pb-editor-advanced-settings-button")
            .click()
            .findByTestId("pb-editor-advanced-element-settings-dialog")
            .within(() => {
                cy.findByLabelText("Tags")
                    .type(`err`)
                    .findByText("error")
                    .click()
                    .findByText("Save")
                    .click();
            });

        cy.findByTestId("pb-editor-page-canvas-section").within(() => {
            cy.get(".webiny-pb-page-element-page-list__item")
                .should("have.length", 1)
                .findByText("404")
                .should("not.exist")
                .findByText("Error Page")
                .should("exist")
                .findByText("Welcome to Webiny")
                .should("not.exist");
        });
    });
});
