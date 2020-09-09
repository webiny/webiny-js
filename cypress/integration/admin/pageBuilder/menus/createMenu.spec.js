import uniqid from "uniqid";

context("Menus Module", () => {
    beforeEach(() => cy.login());

    it("should be able to create, edit, and immediately delete a menu", () => {
        const id = uniqid();
        cy.visit("/page-builder/menus")
            .findByLabelText("Name")
            .type(`Cool Menu ${id}`)
            .findByText("Save menu")
            .click()
            .findByText("Value is required.")
            .should("exist")
            .findByLabelText("Slug")
            .type(`cool-menu-${id}`)
            .findByLabelText("Description")
            .type("This is a cool test.")
            .findByText("Save menu")
            .click();

        cy.findByText("Record saved successfully.")
            .should("exist")
            .wait(500);

        cy.findByLabelText("Slug")
            .should("be.disabled")
            .findByLabelText("Description")
            .type(" Test test.")
            .findByText("Save menu")
            .click();

        cy.findByText("Record saved successfully.")
            .should("exist")
            .wait(500);

        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .within(() => {
                    cy.findByText(`Cool Menu ${id}`)
                        .should("exist")
                        .findByText("This is a cool test. Test test.")
                        .should("exist");
                    cy.get("button").click({ force: true });
                });
        });

        cy.get('[role="alertdialog"] :visible').within(() => {
            cy.contains("Are you sure you want to continue?")
                .next()
                .within(() => cy.findByText("Confirm").click());
        });

        cy.findByText("Record deleted successfully.").should("exist").wait(500);
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(`Cool Menu ${id}`).should("not.exist");
        });
    });

    it("menus with the same slug should not be allowed - an error message must be shown", () => {
        const id = uniqid();
        cy.visit("/page-builder/menus")
            .findByLabelText("Name")
            .type(`Cool Menu ${id}`)
            .findByLabelText("Slug")
            .type(`cool-menu-${id}`)
            .findByText("Save menu")
            .click();

        cy.findByText("Record saved successfully.")
            .should("exist")
            .get(".react-spinner-material")
            .should("not.exist")
            .wait(500);

        cy.findByTestId("new-record-button")
            .click()
            .findByLabelText("Name")
            .type(`Cool Menu ${id}`)
            .findByText("Save menu")
            .findByLabelText("Slug")
            .type(`cool-menu-${id}`)
            .findByText("Save menu")
            .click();

        cy.wait(500)
            .get('[role="alertdialog"] :visible')
            .within(() => {
                cy.findByText(`Menu with slug "cool-menu-${id}" already exists.`).should("exist");
            });
    });
});
