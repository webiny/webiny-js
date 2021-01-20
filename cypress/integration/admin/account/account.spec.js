import uniqid from "uniqid";

context("Account Module", () => {
    beforeEach(() => cy.login());

    it("should be able to update account details and immediately see changes in the top-right user menu", () => {
        const [firstName, lastName] = [uniqid(), uniqid()];

        cy.visit("/account");
        cy.findByText("Bio").click();
        cy.findByLabelText("E-mail").should("value", Cypress.env("DEFAULT_ADMIN_USER_USERNAME"));
        cy.findByLabelText("Password").should("value", "");
        cy.findByLabelText("First Name")
            .clear({ force: true })
            .type(firstName);
        cy.findByLabelText("Last Name")
            .clear({ force: true })
            .type(lastName);
        cy.findByText("Update account").click();
        cy.findByText("Account saved successfully!");
        cy.should("exist");

        // Make sure the changes were propagated in the top-right user menu,
        cy.findByTestId("logged-in-user-menu-avatar").click();
        cy.findByTestId("logged-in-user-menu-list").within(() => {
            cy.findByText(Cypress.env("DEFAULT_ADMIN_USER_USERNAME"))
                .should("exist")
                .findByText(`${firstName} ${lastName}`)
                .should("exist");
        });
    });
});
