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
    it(
        "should be able to complete the initial installation wizard",
        {
            retries: {
                runMode: 0,
                openMode: 0
            }
        },
        () => {
            cy.clearLocalStorage();
            // 1. Security installation.
            cy.visit(Cypress.env("ADMIN_URL"));
            cy.findByTestId("install-security-button").click();
            cy.findByLabelText("First Name").type(Cypress.env("DEFAULT_ADMIN_USER_FIRST_NAME"));
            cy.findByLabelText("Last Name").type(Cypress.env("DEFAULT_ADMIN_USER_LAST_NAME"));
            cy.findAllByLabelText("Email")
                .first()
                .type(Cypress.env("DEFAULT_ADMIN_USER_LAST_NAME"));
            cy.findByTestId("install-security-button").click();

            cy.findByText("Value must be a valid e-mail address.").should("exist");

            cy.findAllByLabelText("Email")
                .first()
                .clear()
                .type(Cypress.env("DEFAULT_ADMIN_USER_USERNAME"));
            cy.findAllByLabelText("Password")
                .first()
                .type(Cypress.env("DEFAULT_ADMIN_USER_PASSWORD"));

            cy.findByTestId("install-security-button").click();

            // 1.1. Log in with the newly created user.
            cy.findByLabelText("Your e-mail").type(Cypress.env("DEFAULT_ADMIN_USER_USERNAME"));
            cy.findByLabelText("Your password").type(Cypress.env("DEFAULT_ADMIN_USER_PASSWORD"));
            cy.findByTestId("submit-sign-in-form-button").click();

            // 2. I18N installation.
            cy.findByLabelText("Select default locale").clear().type("en-u");
            cy.findByText("en-US").click();
            cy.findByTestId("install-i18n-button").click();

            // 3. File Manager installation (happens automatically, nothing to type / select here).

            // Wait for the File Manager installation to finish.
            cy.get(".react-spinner-material").should("not.exist");

            // 4. Page Builder and Form Builder Installation.

            // Let's ensure we've reached this step (useful when in CI/CD, to see if we even reached this screen).
            cy.findByText(/Name of your website/i).should("exist");

            cy.findByTestId("install-pb-button").click();

            cy.findByText("Value is required.").should("exist");

            cy.findByLabelText("Site Name").type(Cypress.env("WEBSITE_NAME"));
            cy.findByTestId("install-pb-button").click();

            // Wait for the Page Builder installation to finish.
            cy.get(".react-spinner-material", { timeout: 30000 * 3 }).should("not.exist");

            // 5. Form Builder installation (happens automatically, nothing to type / select here).

            // 6. Headless CMS installation (happens automatically, nothing to type / select here).

            // 7. Installation complete, click the button and check if the pages list was shown to the user.
            cy.findByTestId("open-webiny-cms-admin-button").click();
            cy.findByText(/Learn more about Webiny/i).should("exist");
        }
    );
});
