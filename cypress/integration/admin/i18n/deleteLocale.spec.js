context("I18N app", () => {
    beforeEach(() => cy.login());

    it('should not allow deleting "default locale"', () => {
        cy.visit("/i18n/locales");
        // Delete new locale
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByTestId("default-data-list.delete").click({ force: true });
                });
        });

        cy.findByTestId("default-data-list.delete-dialog").within(() => {
            cy.findByText(/Confirmation/i);
            cy.findByText(/confirm$/i).click();
        });

        cy.findByText(
            "Cannot delete default locale, please set another locale as default first."
        ).should("exist");
    });
});
