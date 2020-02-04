import uniqid from "uniqid";

context("Forms Creation", () => {
    beforeEach(() => cy.login());

    it("should be able to create, publish, create new revision, and immediately delete everything", () => {
        const newFormTitle = `Test form ${uniqid()}`;
        const newFormTitle2 = `Test form ${uniqid()}`;

        cy.visit("/forms")
            .findByTestId("new-record-button")
            .click()
            .findByTestId("fb-new-form-modal")
            .within(() => {
                cy.findByPlaceholderText("Enter a name for your new form")
                    .type(newFormTitle)
                    .findByText("+ Create");
            })
            .click()
            .wait(1000)
            .findByTestId("fb-editor-form-title")
            .click()
            .get(`input[value="${newFormTitle}"]`)
            .clear()
            .type(`${newFormTitle2} {enter}`)
            .wait(333)
            .findByTestId("fb-editor-back-button")
            .click()
            .wait(1000);

        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .within(() => {
                    cy.findByText(newFormTitle2)
                        .should("exist")
                        .findByText(/Draft/i)
                        .should("exist")
                        .findByText(/(v1)/i)
                        .should("exist");
                });
        });
    });
});
