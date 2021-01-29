context("Login Page", () => {
    it("must log in user successfully", () => {
        cy.visit("/");
        cy.findByText(/sign in/i).should("exist");
        cy.findByText(/forgot password?/i).should("exist");

        cy.findByLabelText(/your e-mail/i).type("admin@webiny.com");
        cy.findByLabelText(/your password/i).type("12345678");
        cy.findByText(/submit/i).click();

        cy.findByPlaceholderText(/search.../i).should("exist");
        cy.findByText(/pages/i).should("exist");

        // Make sure we can open user menu and that the e-mail is printed.
        cy.findByTestId("logged-in-user-menu-avatar").click();
        cy.findByTestId("logged-in-user-menu-list").within(() => {
            cy.findByText(Cypress.env("DEFAULT_ADMIN_USER_USERNAME")).should("exist");
        });
    });
});
