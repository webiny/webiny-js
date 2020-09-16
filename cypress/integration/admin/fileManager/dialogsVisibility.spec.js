/* eslint-disable jest/expect-expect */
context("Account Module", () => {
    beforeEach(() => cy.login());

    it("should be able to correctly show image editor and delete image dialogs", () => {
        cy.visit("/account")
            .findByText("Select an image")
            .click();

        cy.findByTestId("fm-list-wrapper").dropFile("sample.jpeg", "image/jpeg");
        cy.findByText("File upload complete.").should("exist");

        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findAllByTestId("fm-list-wrapper-file")
                .first()
                .within(() => {
                    cy.findByTestId("fm-file-wrapper-file-info-icon").click({ force: true });
                });
        });

        cy.findByTestId("fm-edit-image-button").click();
        cy.findByTestId("fm-image-editor-dialog")
            .should("be.visible")
            .within(() => {
                cy.findByText("Cancel").click();
            });

        cy.findByTestId("fm-delete-file-button").click();

        cy.findByTestId("fm-delete-file-confirmation-dialog").within(() => {
            cy.findByText("Confirm").click();
        });

        cy.findByText("File deleted successfully.");
    });
});
