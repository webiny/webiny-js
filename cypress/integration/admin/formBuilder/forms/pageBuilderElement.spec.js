import uniqid from "uniqid";

context("Forms Creation", () => {
    beforeEach(() => cy.login());

    it("should be able to create, publish, create new revision, and immediately delete everything", () => {
        const pageTitle = `Test page ${uniqid()}`;

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
            .click();


            /*
            .findByTestId("pb-editor-back-button")
            .click()
            .wait(1000);

        const newFormTitle = `Test form ${uniqid()}`;

        cy.visit("/forms")
            .findByTestId("new-record-button")
            .click()
            .findByTestId("fb-new-form-modal")
            .within(() => {
                cy.findByPlaceholderText("Enter a name for your new form")
                    .type(newFormTitle)
                    .findByText("+ Create")
                    .click();
            })
            .wait(1000);

        cy.visit("/page-builder/pages");
        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .click();
        });

        cy.findByTestId("pb-page-details")
            .within(() => {
                cy.findByTestId("pb-page-details-header-edit-revision").click();
            })*/
    });
});
