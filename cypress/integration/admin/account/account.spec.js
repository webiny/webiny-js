import uniqid from "uniqid";

context("Account Module", () => {
    beforeEach(() => cy.login());

    it("should be able to update account details and immediately see changes in the top-right user menu", () => {
        const [firstName, lastName] = [uniqid(), uniqid()];

        cy.visit("/account");
        cy.findByLabelText("Email");
        cy.should("value", Cypress.env("DEFAULT_ADMIN_USER_USERNAME"));
        cy.findByLabelText("Password");
        cy.should("value", "");
        cy.findByLabelText("First Name").clear().type(firstName);
        cy.findByLabelText("Last Name").clear().type(lastName);
        cy.findByText("Update account").click();
        cy.findByText("Account saved successfully!");
        cy.should("exist");

        // Make sure the changes were propagated in the top-right user menu,
        cy.findByTestId("logged-in-user-menu-avatar").click();
        cy.findByTestId("logged-in-user-menu-list").within(() => {
            cy.findByText(Cypress.env("DEFAULT_ADMIN_USER_USERNAME"));
            cy.should("exist");
            cy.findByText(`${firstName} ${lastName}`);
            cy.should("exist");
        });
    });
});
