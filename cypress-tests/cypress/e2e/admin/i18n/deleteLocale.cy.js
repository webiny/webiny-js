context("I18N app", () => {
    beforeEach(() => cy.login());

    it('should not allow deleting "default locale"', () => {
        cy.visit("/i18n/locales");
        // Delete new locale
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
                    // Now targeting <button> directly. Revert to `.findByTestId("default-data-list.delete")` if issue is fixed.
                    cy.get('button[data-testid="default-data-list.delete"]').click({ force: true });
                });
        });

        cy.findByTestId("default-data-list.delete-dialog").within(() => {
            cy.findByText(/Confirmation/i);
            cy.findAllByTestId("dialog-accept").next().click();
        });

        cy.findByText(
            "Cannot delete default locale, please set another locale as default first."
        ).should("exist");
    });
});
