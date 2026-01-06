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

            cy.visit(Cypress.env("ADMIN_URL"));
            cy.findByText("Let's get started").click();

            cy.findByLabelText("Project name").type("Webiny (Cypress Test)");
            cy.findByLabelText("Organization name").type("Webiny");

            // Where did you hear about Webiny?
            cy.findByRole("combobox").click();
            cy.findByText("GitHub").click();

            cy.findByLabelText(/I agree to Webiny.*/i).click();

            cy.findByText("Next step").click();

            const firstName = Cypress.env("DEFAULT_ADMIN_USER_FIRST_NAME");
            const lastName = Cypress.env("DEFAULT_ADMIN_USER_LAST_NAME");
            const username = Cypress.env("DEFAULT_ADMIN_USER_USERNAME");
            const password = Cypress.env("DEFAULT_ADMIN_USER_PASSWORD");

            cy.findByLabelText("First name").type(firstName);
            cy.findByLabelText("Last name").type(lastName);
            cy.findByLabelText("Your email").type(username);
            cy.findByLabelText("Choose password").type(password);
            cy.findByText("Next step").click();
            cy.findByText("Start using Webiny").click();

            cy.findByLabelText("Email").type(username);
            cy.findByLabelText("Password").type(password);
            cy.findByText("Submit").click();
            cy.findByText(/what are we doing today?/i);
        }
    );
});
