/* eslint-disable jest/expect-expect */
import uniqid from "uniqid";

context("Pages Previewing", () => {
    beforeEach(() => cy.login());

    it(`should be able to preview a page with the "ssr-no-cache" query param`, () => {
        const pageTitle1 = `Test page ${uniqid()}`;
        const pageTitle2 = `Test page ${uniqid()}`;

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
            .type(pageTitle1)
            .findByTestId("pb-editor-page-options-menu")
            .click()
            .wait(1000)
            .findByTestId("pb-editor-page-options-menu-preview")
            .click();
        cy.title().should("contain", pageTitle1);

        cy.go("back")
            .wait(1000)
            .findByTestId("pb-editor-page-title")
            .click()
            .get(`input[value="${pageTitle1}"]`)
            .clear()
            .type(pageTitle2)
            .findByTestId("pb-editor-page-options-menu")
            .click()
            .wait(1000)
            .findByTestId("pb-editor-page-options-menu-preview")
            .click();
        cy.title().should("contain", pageTitle2);
    });
});
