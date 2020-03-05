import uniqid from "uniqid";

context("Roles Module", () => {
    beforeEach(() => cy.login());

    it("should be able to create, edit, and immediately delete a role", () => {
        const id = uniqid();
        cy.visit("/roles")
            .findByLabelText("Name")
            .type(`Test Role ${id}`)
            .findByText("Save role")
            .click()
            .findByText("Value is required.")
            .should("exist")
            .findByLabelText("Slug")
            .type(`test-role-${id}`)
            .findByLabelText("Description")
            .type("This is a test test.")
            .findByText("Save role")
            .click();

        cy.wait(500)
            .findByText("Record saved successfully.")
            .should("exist");

        cy.findByLabelText("Slug")
            .type("-edited")
            .findByLabelText("Description")
            .type(" Test test.");

        // Check if the scopes auto-complete is working.
        cy.findByLabelText("Scopes")
            .type(`revi`)
            .findByText("Publish form revisions")
            .click()
            .findByLabelText("Scopes")
            .type(`revi`)
            .findByText("Unpublish form revisions")
            .click();

        cy.findByText("Save role").click();

        cy.wait(500)
            .findByTestId("default-data-list")
            .within(() => {
                cy.get("div")
                    .first()
                    .within(() => {
                        cy.findByText(`Test Role ${id}`)
                            .should("exist")
                            .findByText("This is a test test. Test test.")
                            .should("exist");
                        cy.get("button").click({ force: true });
                    });
            });

        cy.get('[role="alertdialog"] :visible').within(() => {
            cy.contains("Are you sure you want to continue?")
                .next()
                .within(() => cy.findByText("Confirm").click());
        });

        cy.findByText("Record deleted successfully.").should("exist");
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(`Test Role ${id}`).should("not.exist");
        });
    });

    it("roles with the same slug should not be allowed - an error message must be shown", () => {
        const id = uniqid();
        cy.visit("/roles")
            .findByLabelText("Name")
            .type(`Test Role ${id}`)
            .findByText("Save role")
            .findByLabelText("Slug")
            .type(`test-role-${id}`)
            .findByLabelText("Description")
            .type("This is a test test.")
            .findByText("Save role")
            .click()
            .wait(1500);

        cy.findByTestId("new-record-button")
            .click()
            .findByLabelText("Name")
            .type(`Test Role ${id}`)
            .findByText("Save role")
            .findByLabelText("Slug")
            .type(`test-role-${id}`)
            .findByLabelText("Description")
            .type("This is a test test.")
            .findByText("Save role")
            .click();

        cy.wait(500)
            .get('[role="alertdialog"] :visible')
            .within(() => {
                cy.findByText(`Role with slug "test-role-${id}" already exists.`).should("exist");
            });
    });

    it("should save scopes correctly", () => {
        const id = uniqid();
        cy.visit("/roles")
            .findByLabelText("Name")
            .type(`Test Role ${id}`)
            .findByLabelText("Slug")
            .type(`test-role-${id}`)
            .findByLabelText("Description")
            .type("This is a test test.")
            .findByLabelText("Scopes")
            .type(`revi`)
            .findByText("Publish form revisions")
            .click()
            .findByLabelText("Scopes")
            .type(`revi`)
            .findByText("Unpublish form revisions")
            .click()
            .findByText("Save role")
            .click();

        cy.wait(2500)
            .reload()
            .findByTestId("default-form")
            .within(() => {
                cy.findByText("forms:form:revision:publish")
                    .should("exist")
                    .findByText("forms:form:revision:unpublish")
                    .should("exist");
            });
    });
});
