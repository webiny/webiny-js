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
            const firstName = Cypress.env("DEFAULT_ADMIN_USER_FIRST_NAME");
            const lastName = Cypress.env("DEFAULT_ADMIN_USER_LAST_NAME");
            const username = Cypress.env("DEFAULT_ADMIN_USER_USERNAME");
            const password = Cypress.env("DEFAULT_ADMIN_USER_PASSWORD");

            cy.visit(Cypress.env("ADMIN_URL"));
            cy.findByTestId("install-security-button").click();
            cy.findByLabelText("First Name").type(firstName);
            cy.findByLabelText("Last Name").type(lastName);
            cy.findAllByLabelText("Email").first().type(lastName);
            cy.findByTestId("install-security-button").click();

            cy.findByText("Value must be a valid e-mail address.").should("exist");

            cy.findAllByLabelText("Email").first().clear().type(username);
            cy.findAllByLabelText("Password").first().type(password);

            cy.findByTestId("install-security-button").click();

            // 1.1. Log in with the newly created user.
            cy.findByLabelText("Email").type(username);
            cy.findByLabelText("Password").type(password);
            cy.findByTestId("submit-sign-in-form-button").click();

            // TODO: finish the test once we've updated the UI.

            // // 3. Headless CMS installation (happens automatically, nothing to type / select here).
            //
            // // 4. File Manager installation (happens automatically, nothing to type / select here).
            // // Wait for the File Manager installation to finish.
            // cy.get(".react-spinner-material").should("not.exist");
            //
            // // 5. Installation complete, click the button and check if the dashboard is loaded.
            // cy.findByTestId("open-webiny-cms-admin-button").click();
            // cy.findByText(/what are we doing today?/i).should("exist");
        }
    );
});
