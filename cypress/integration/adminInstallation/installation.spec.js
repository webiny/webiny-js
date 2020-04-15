/**
 * Note that in order to run this test, you need to have a freshly deployed system.
 *
 * If you'll be adding more assertions, the easiest way to get the installation wizard back is
 * to delete (or rename) the database on which your project is relying on. Also, you'll need to delete
 * the user created in AWS Cognito, since if the user exists, the wizard looks a bit different, and the test fails.
 *
 * This is made specifically for CI, where we want to run all other Cypress tests (located in
 * cypress/integration/admin folder), but really can't until the installation wizard is finished.
 */
context("Admin Installation", () => {
    it("should be able to complete the initial installation wizard", () => {
        // 1. Security installation.
        cy.visit("/")
            .findByLabelText("First Name")
            .type(Cypress.env("DEFAULT_ADMIN_USER_FIRST_NAME"))
            .findByLabelText("Last Name")
            .type(Cypress.env("DEFAULT_ADMIN_USER_LAST_NAME"))
            .findByLabelText("E-mail")
            .type(Cypress.env("DEFAULT_ADMIN_USER_LAST_NAME"))
            .findByTestId("install-security-button")
            .click();

        cy.findByText("Value must be a valid e-mail address.").should("exist");

        cy.findByLabelText("E-mail")
            .clear()
            .type(Cypress.env("DEFAULT_ADMIN_USER_USERNAME"))
            .findByLabelText("Password")
            .type(Cypress.env("DEFAULT_ADMIN_USER_PASSWORD"))
            .findByTestId("install-security-button")
            .click();

        // 1.1. Log in with the newly created user.
        cy.findByLabelText("Your e-mail")
            .type(Cypress.env("DEFAULT_ADMIN_USER_USERNAME"))
            .findByLabelText("Your password")
            .type(Cypress.env("DEFAULT_ADMIN_USER_PASSWORD"))
            .findByTestId("submit-sign-in-form-button")
            .click();

        // 2. I18N installation.
        cy.findByLabelText("Select default locale")
            .clear()
            .type("en-g")
            .findByText("en-GB")
            .click()
            .findByTestId("install-i18n-button")
            .click();

        // 3.Page Builder and Form Builder Installation.
        cy.findByLabelText("Site Name")
            .findByTestId("install-pb-button")
            .click();

        cy.findByText("Value is required.").should("exist");

        cy.findByLabelText("Site Name")
            .type(Cypress.env("SITE_NAME"))
            .findByTestId("install-pb-button")
            .click()
            .wait(30000); // Wait for the Page Builder to install and also the Form Builder.

        cy.findByTestId("open-webiny-cms-admin-button")
            .click()
            .wait(2000)
            .findByText(/Select a page on the left side/i)
            .should("exist");
    });
});
