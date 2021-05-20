context("I18N app", () => {
    beforeEach(() => cy.login());

    it('should not allow deleting "default locale"', () => {
        cy.visit("/i18n/locales");
        // Delete new locale
        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .within(() => {
                    cy.findByTestId("app-i18n.data-list-item.delete").click({ force: true });
                });
        });
        cy.wait(500);
        cy.findByTestId("app-i18n.data-list.delete-dialog").within(() => {
            cy.findByText(/Confirmation/i);
            cy.get(".webiny-ui-dialog__actions > :nth-child(2)").click();
        });

        cy.findByText(
            "Cannot delete default locale, please set another locale as default first."
        ).should("exist");
    });
});
