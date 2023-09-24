import uniqid from "uniqid";

context("Categories Module", () => {
    beforeEach(() => cy.login());

    it("should be able to create, edit, and immediately delete a category", () => {
        const id = uniqid();
        cy.visit("/page-builder/categories");
        cy.findByTestId("data-list-new-record-button").click();

        cy.findByTestId("pb.category.new.form.name").type(`Cool Category ${id}`);
        cy.findByTestId("pb.category.new.form.button.save").click();
        cy.findAllByText("Value is required.").should("exist").should("have.length", 2);
        cy.findByTestId("pb.category.new.form.url").type(`Some URL`);
        cy.findByTestId("pb.category.new.form.button.save").click();
        cy.findByText("Value is required.").should("exist");
        cy.findByTestId("pb.category.new.form.slug").type(`cool-category-${id}`);
        cy.findByTestId("pb.category.new.form.button.save").click();
        cy.findByText("Value is required.").should("not.exist");
        cy.findByText("Category URL must begin and end with a forward slash (`/`)").should("exist");
        cy.findByTestId("pb.category.new.form.url").clear().type(`/some-url-for-category-${id}/`);
        cy.findByTestId("pb.category.new.form.button.save").click();
        cy.findByText("Category URL must begin and end with a forward slash (`/`)").should(
            "not.exist"
        );
        cy.findByTestId("pb.category.new.form.button.save").click();

        cy.wait(500);
        cy.findByText("Category saved successfully.").should("exist");

        cy.wait(500);
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(`Cool Category ${id}`).should("exist");
            cy.findByText(`/some-url-for-category-${id}/`).should("exist");

            cy.findByText(`Cool Category ${id}`)
                .parent("li")
                .within(() => {
                    cy.get("button").click({ force: true });
                });
        });

        cy.get('[role="alertdialog"] :visible').within(() => {
            cy.contains("Are you sure you want to continue?")
                .next()
                .within(() => cy.findAllByTestId("dialog-accept").next().click());
        });

        cy.findByText(`Category "cool-category-${id}" deleted.`).should("exist");
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(`Cool Category ${id}`).should("not.exist");
        });
    });
});
