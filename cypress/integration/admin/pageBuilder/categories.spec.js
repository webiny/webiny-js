import uniqid from "uniqid";

context("Categories Module", () => {
    beforeEach(() => cy.login());

    it("should be able to create, edit, and immediately delete a category", () => {
        const id = uniqid();
        cy.visit("/page-builder/categories")
            .findByLabelText("Name")
            .type(`Cool Category ${id}`)
            .findByText("Save category")
            .click()
            .findByText("Value is required.")
            .should("exist")
            .findByLabelText("URL")
            .type(`Some URL`)
            .findByText("Save category")
            .click()
            .findByText("Value is required.")
            .should("exist")
            .findByLabelText("Slug")
            .type(`cool-category-${id}`)
            .findByText("Save category")
            .click()
            .findByText("Value is required.")
            .should("not.exist")
            .findByText("Category URL must begin and end with a forward slash (`/`)")
            .should("exist")
            .findByLabelText("URL")
            .clear()
            .type(`/some-url-for-category-${id}/`)
            .findByText("Save category")
            .click()
            .findByText("Category URL must begin and end with a forward slash (`/`)")
            .should("not.exist")
            .findByText("Save category")
            .click();

        cy.wait(500)
            .findByText("Record saved successfully.")
            .should("exist");

        cy.wait(500)
            .findByTestId("default-data-list")
            .within(() => {
                cy.get("div")
                    .first()
                    .within(() => {
                        cy.findByText(`Cool Category ${id}`)
                            .should("exist")
                            .findByText(`/some-url-for-category-${id}/`)
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
            cy.findByText(`Cool Category ${id}`).should("not.exist");
        });
    });
});
