import uniqid from "uniqid";

context("Menus Module", () => {
    beforeEach(() => cy.login());

    it("should be able to create, edit, and immediately delete a menu", () => {
        const id = uniqid();
        cy.visit("/page-builder/menus");
        cy.findByTestId("data-list-new-record-button").click();

        cy.findByLabelText("Name").type(`Cool Menu ${id}`);
        cy.findByText("Save menu").click();
        cy.findByText("Value is required.").should("exist");
        cy.findByLabelText("Slug").type(`cool-menu-${id}`);
        cy.findByLabelText("Description").type("This is a cool test.");
        cy.findByText("Save menu").click();

        cy.findByText("Menu saved successfully.").should("exist");
        cy.wait(500);

        cy.findByLabelText("Slug").should("be.disabled");
        cy.findByLabelText("Description").type(" Test test.");
        cy.findByText("Save menu").click();

        cy.findByText("Menu saved successfully.").should("exist");
        cy.wait(500);

        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .within(() => {
                    cy.findByText(`Cool Menu ${id}`).should("exist");
                    cy.findByText("This is a cool test. Test test.").should("exist");
                    cy.get("button").click({ force: true });
                });
        });

        cy.get('[role="alertdialog"] :visible').within(() => {
            cy.contains("Are you sure you want to continue?")
                .next()
                .within(() => cy.findByText("Confirm").click());
        });

        cy.findByText(/Menu ".*" deleted\./).should("exist");
        cy.wait(500);
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(`Cool Menu ${id}`).should("not.exist");
        });
    });

    it("menus with the same slug should not be allowed - an error message must be shown", () => {
        const id = uniqid();
        cy.visit("/page-builder/menus");
        cy.findByTestId("data-list-new-record-button").click();

        cy.findByLabelText("Name").type(`Cool Menu ${id}`);
        cy.findByLabelText("Slug").type(`cool-menu-${id}`);
        cy.findByText("Save menu").click();

        cy.findByText("Menu saved successfully.").should("exist");
        cy.get(".react-spinner-material").should("not.exist");
        cy.wait(500);

        cy.findByTestId("data-list-new-record-button").click();
        cy.findByLabelText("Name").type(`Cool Menu ${id}`);
        cy.findByText("Save menu");
        cy.findByLabelText("Slug").type(`cool-menu-${id}`);
        cy.findByText("Save menu").click();

        cy.wait(500);
        cy.findByText(`Menu "cool-menu-${id}" already exists.`).should("exist");
        // Delete Menu
        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .within(() => {
                    cy.findByText(`Cool Menu ${id}`).should("exist");
                    cy.get("button").click({ force: true });
                });
        });

        cy.get('[role="alertdialog"] :visible').within(() => {
            cy.contains("Are you sure you want to continue?")
                .next()
                .within(() => cy.findByText("Confirm").click());
        });

        cy.findByText(/Menu ".*" deleted\./).should("exist");
        cy.wait(500);
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(`Cool Menu ${id}`).should("not.exist");
        });
    });
});
