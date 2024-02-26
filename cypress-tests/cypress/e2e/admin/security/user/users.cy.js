import uniqid from "uniqid";

context("Security -> Users", () => {
    beforeEach(() => {
        cy.login();
    });

    it("should create, update and delete user", () => {
        cy.visit(`/admin-users`);

        // Create a user
        const [firstName, lastName] = [uniqid(), uniqid()];
        const [email, password] = [uniqid("", "@gmail.com"), uniqid()];
        const groupName = "Full Access";
        // Open user details form
        cy.findAllByTestId("new-record-button").first().click();
        // Add user's detail
        cy.findByLabelText("First Name").type(firstName);
        cy.findByLabelText("Last Name").type(lastName);
        cy.findByTestId("input-element-Email").type(email);
        cy.get("input[type=password]").type(password);
        cy.findByTestId("group-autocomplete").type(groupName);
        cy.wait(1000);
        cy.findByText(groupName).click();
        // Save details
        cy.findByTestId("button-element-save-user").click();
        // Wait for loading to finish
        cy.get(".react-spinner-material").should("not.exist");
        // Verify success message
        cy.findByText("User saved successfully.").should("exist");

        // Update user

        const [newFirstName, newLastName, newPassword] = [uniqid(), uniqid(), uniqid()];
        const newGroupName = "Anonymous";

        cy.findByTestId("input-element-Email").should("have.value", email);
        // Add user's detail
        cy.findByLabelText("First Name").type(newFirstName);
        cy.findByLabelText("Last Name").type(newLastName);
        cy.get("input[type=password]").type(newPassword);
        cy.findByTestId("group-autocomplete").clear().type(newGroupName);
        cy.wait(1000);
        cy.findByText(newGroupName).click();
        // Save details
        cy.findByTestId("button-element-save-user").click();
        // Wait for loading to finish
        cy.get(".react-spinner-material").should("not.exist");
        // Verify success message
        cy.findByText("User saved successfully.").should("exist");

        // Delete user

        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .within(() => {
                    cy.findByTestId("default-data-list.delete").click({ force: true });
                });
        });

        cy.findByTestId("default-data-list.delete-dialog").within(() => {
            cy.findAllByTestId("dialog-accept").next().click();
        });
        cy.findByText(`User "${email}" deleted.`).should("exist");
    });
});
