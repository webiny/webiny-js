import uniqid from "uniqid";

context("Account Module", () => {
    beforeEach(() => cy.login());

    it("should be able to update account details and immediately see changes in the top-right user menu", () => {
        const [firstName, lastName] = [uniqid(), uniqid()];

        cy.visit("/account")
            .findByLabelText("E-mail")
            .should("value", Cypress.env("DEFAULT_ADMIN_USER_USERNAME"))
            .findByLabelText("Password")
            .should("value", "")
            .findByLabelText("First Name")
            .clear()
            .type(firstName)
            .findByLabelText("Last Name")
            .clear()
            .type(lastName)
            .findByText("Update account")
            .click()
            .findByText("Account saved successfully!");
        cy.should("exist");

        // Make sure the changes were propagated in the top-right user menu,
        cy.findByTestId("logged-in-user-menu-avatar")
            .click()
            .findByTestId("logged-in-user-menu-list")
            .within(() => {
                cy.findByText(Cypress.env("DEFAULT_ADMIN_USER_USERNAME"))
                    .should("exist")
                    .findByText(`${firstName} ${lastName}`)
                    .should("exist");
            });
    });
});
