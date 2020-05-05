import uniqid from "uniqid";

context("Groups Module", () => {
    beforeEach(() => cy.login());

    it("should be able to create, edit, and immediately delete a group", () => {
        const id = uniqid();
        cy.visit("/groups")
            .findByLabelText("Name")
            .type(`Test Group ${id}`)
            .findByText("Save group")
            .click()
            .findAllByText("Value is required.")
            .should("have.length", 2)
            .findByLabelText("Slug")
            .type(`test-group-${id}`)
            .findByLabelText("Description")
            .type("This is a test test.")
            .findByText("Save group")
            .click();

        cy.wait(500)
            .findByText("Record saved successfully.")
            .should("exist");

        cy.findByLabelText("Slug")
            .should("disabled")
            .findByLabelText("Description")
            .type(" Test test.")
            .findByText("Save group")
            .click();

        cy.wait(500)
            .findByTestId("default-data-list")
            .within(() => {
                cy.get("div")
                    .first()
                    .within(() => {
                        cy.findByText(`Test Group ${id}`)
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
            cy.findByText(`Test Group ${id}`).should("not.exist");
        });
    });

    it("groups with the same slug should not be allowed - an error message must be shown", () => {
        const id = uniqid();
        cy.visit("/groups")
            .findByLabelText("Name")
            .type(`Test Group ${id}`)
            .findByText("Save group")
            .findByLabelText("Slug")
            .type(`test-group-${id}`)
            .findByLabelText("Description")
            .type("This is a test test.")
            .findByText("Save group")
            .click()
            .wait(1500);

        cy.findByTestId("new-record-button")
            .click()
            .findByLabelText("Name")
            .type(`Test Group ${id}`)
            .findByText("Save group")
            .findByLabelText("Slug")
            .type(`test-group-${id}`)
            .findByLabelText("Description")
            .type("This is a test test.")
            .findByText("Save group")
            .click();

        cy.wait(500)
            .get('[role="alertdialog"] :visible')
            .within(() => {
                cy.findByText(`Group with slug "test-group-${id}" already exists.`).should("exist");
            });
    });
});
