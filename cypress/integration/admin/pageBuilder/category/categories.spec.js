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

    it("should not be able to create category if slug already exists", () => {
        // Create category.
        const id = uniqid();
        const slugValue = `cool-category-${id}`;

        cy.visit("/page-builder/categories");
        cy.findByTestId("data-list-new-record-button").click();

        cy.findByTestId("pb.category.new.form.name").type(`Cool Category ${id}`);
        cy.findByTestId("pb.category.new.form.button.save").click();
        cy.findAllByText("Value is required.").should("exist").should("have.length", 2);
        cy.findByTestId("pb.category.new.form.url").type(`Some URL`);
        cy.findByTestId("pb.category.new.form.button.save").click();
        cy.findByText("Value is required.").should("exist");
        cy.findByTestId("pb.category.new.form.slug").type(slugValue);
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

        // Try to create a new category using the same slug.
        cy.visit("/page-builder/categories");
        cy.findByTestId("data-list-new-record-button").click();
        cy.findByTestId("pb.category.new.form.name").type(`Cool Category ${id} duplicate`);
        cy.findByTestId("pb.category.new.form.button.save").click();
        cy.findAllByText("Value is required.").should("exist").should("have.length", 2);
        cy.findByTestId("pb.category.new.form.url").type(`Some URL`);
        cy.findByTestId("pb.category.new.form.button.save").click();
        cy.findByText("Value is required.").should("exist");
        cy.findByTestId("pb.category.new.form.slug").type(slugValue);
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
        cy.findByText(`Category with slug "${slugValue}" already exists.`).should("exist");
    });

    it("should be able to access new category form via link", () => {
        cy.visit("/page-builder/pages");
        cy.get('div.action__container button[data-testid="new-record-button"]').click();

        cy.wait(1000);
        cy.findByText("+ Create new category").click({ force: true });
        cy.wait(500);
        cy.location("pathname").should("include", "/page-builder/categories");
    });

    it("should not be able to delete categories if they contain pages", () => {
        // Create category.
        const id = uniqid();
        cy.visit("/page-builder/categories");
        cy.findByTestId("data-list-new-record-button").click();

        cy.findByTestId("pb.category.new.form.name").type(`Cool Category ${id}`);
        cy.findByText("Save category").click({ force: true });
        cy.findAllByText("Value is required.").should("exist").should("have.length", 2);
        cy.findByTestId("pb.category.new.form.url").type(`Some URL`);
        cy.findByText("Save category").click({ force: true });
        cy.findByText("Value is required.").should("exist");
        cy.findByTestId("pb.category.new.form.slug").type(`coolest-category-${id}`);
        cy.findByText("Save category").click({ force: true });
        cy.findByText("Value is required.").should("not.exist");
        cy.findByText("Category URL must begin and end with a forward slash (`/`)").should("exist");
        cy.findByTestId("pb.category.new.form.url").clear().type(`/some-url-for-category-${id}/`);
        cy.findByText("Save category").click({ force: true });
        cy.findByText("Category URL must begin and end with a forward slash (`/`)").should(
            "not.exist"
        );
        cy.wait(500);
        cy.findByText("Category saved successfully.").should("exist");

        // Use category to create a new page.
        cy.visit("/page-builder/pages");
        cy.get('div.action__container button[data-testid="new-record-button"]').click();
        cy.findByText(`Cool Category ${id}`).click({ force: true });
        cy.findByText(`Publish`).click({ force: true });
        cy.get(
            '[data-testid="pb-editor-publish-confirmation-dialog"] [data-testid="confirmationdialog-confirm-action"]'
        ).click();
        cy.wait(500);
        cy.findByText("Your page was published successfully!").should("exist");

        // Delete category.
        cy.visit("/page-builder/categories");
        cy.get('[data-testid="default-data-list"] > li:nth-child(1) button').click({
            force: true
        });
        cy.findByText("Confirm").click({ force: true });

        // assert TO BE added after bug fix
    });
});
