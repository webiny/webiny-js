context("Login Page", () => {
    it("must log in user successfully", () => {
        cy.visit("/")
            .findByText(/sign in/i)
            .should("exist")
            .findByText(/forgot password?/i)
            .should("exist");

        cy.findByLabelText(/your e-mail/i)
            .type("admin@webiny.com")
            .findByLabelText(/your password/i)
            .type("12345678")
            .findByText(/submit/i)
            .click()
            .findByPlaceholderText(/search.../i)
            .should("exist")
            .findByText(/pages/i)
            .should("exist");

        // Make sure we can open user menu and that the e-mail is printed.
        cy.findByTestId("logged-in-user-menu-avatar")
            .click()
            .findByTestId("logged-in-user-menu-list")
            .within(() => {
                cy.findByText(Cypress.env("DEFAULT_ADMIN_USER_USERNAME")).should("exist");
            });
    });
});
