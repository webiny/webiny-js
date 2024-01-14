import { generateAlphaLowerCaseId } from "@webiny/utils/generateId";

context("Page Builder - Categories CRUD", () => {
    const categoryName = generateAlphaLowerCaseId(6);
    const categoryNameEdited = generateAlphaLowerCaseId(6);
    const categorySlug = generateAlphaLowerCaseId(6);
    const categoryUrl = "/" + generateAlphaLowerCaseId(6) + "/";
    const categoryUrlEdited = "/" + generateAlphaLowerCaseId(6) + "/";
    const categoryNameValidate = generateAlphaLowerCaseId(6);
    const categorySlugValidate = generateAlphaLowerCaseId(6);
    const categoryUrlValidate = "/" + generateAlphaLowerCaseId(6) + "/";

    beforeEach(() => {
        cy.login();
        cy.pbDeleteAllCategories();
    });

    it("should be able to create, edit, and immediately delete a category", () => {
        cy.visit("/page-builder/categories");
        cy.findByTestId("data-list-new-record-button").click();

        // Creates new category.
        cy.findByTestId("pb.category.new.form.name").type(categoryNameValidate);
        cy.findByTestId("pb.category.new.form.button.save").click();
        cy.findAllByText("Value is required.").should("exist").should("have.length", 2);
        cy.findByTestId("pb.category.new.form.url").type(`Some URL`);
        cy.findByTestId("pb.category.new.form.button.save").click();
        cy.findByText("Value is required.").should("exist");
        cy.findByTestId("pb.category.new.form.slug").type(categorySlugValidate);
        cy.findByTestId("pb.category.new.form.button.save").click();
        cy.findByText("Value is required.").should("not.exist");
        cy.findByText("Category URL must begin and end with a forward slash (`/`)").should("exist");
        cy.findByTestId("pb.category.new.form.url").clear().type(categoryUrlValidate);
        cy.findByTestId("pb.category.new.form.button.save").click();
        cy.findByText("Category URL must begin and end with a forward slash (`/`)").should(
            "not.exist"
        );

        // Without this wait, there is not enough of a delay for the test to properly click the new Category button
        cy.wait(1000);
        cy.findByTestId("data-list-new-record-button").click();
        cy.findByTestId("pb.category.new.form.name").clear().type(categoryName);
        cy.findByTestId("pb.category.new.form.slug").clear().type(categorySlug);
        cy.findByTestId("pb.category.new.form.url").clear().type(categoryUrl);
        cy.findByTestId("pb.category.new.form.button.save").click();
        cy.findByText("Category saved successfully.").should("exist");

        // Asserts the previously created category is being correctly displayed.
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(categoryName).should("exist");
            cy.findByText(categoryUrl).should("exist");
            cy.findByText(categoryUrl).click();
        });

        // Assert that the title on top and the other form fields below display correct values on the right side of the screen.
        cy.findByTestId("pb-categories-form-title").should("contain", categoryName);
        cy.findByTestId("pb.category.new.form.name").invoke("val").should("eq", categoryName);
        cy.findByTestId("pb.category.new.form.slug").invoke("val").should("eq", categorySlug);
        cy.findByTestId("pb.category.new.form.url").invoke("val").should("eq", categoryUrl);

        // Tests editing category fields.
        cy.findByTestId("pb.category.new.form.name").clear().type(categoryNameEdited);
        cy.findByTestId("pb.category.new.form.url").clear().type(categoryUrlEdited);

        cy.findByTestId("pb.category.new.form.button.save").click();
        cy.findByText("Category saved successfully.").should("exist");

        // Asserts the previously edited category is being correctly displayed.
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(categoryNameEdited).should("exist");
            cy.findByText(categoryUrlEdited).should("exist");
            cy.findByText(categoryUrlEdited).click();
        });
        cy.get(".mdc-typography--headline5").should("contain", categoryNameEdited);
        cy.findByTestId("pb.category.new.form.name").invoke("val").should("eq", categoryNameEdited);
        cy.findByTestId("pb.category.new.form.slug").invoke("val").should("eq", categorySlug);
        cy.findByTestId("pb.category.new.form.url").invoke("val").should("eq", categoryUrlEdited);

        // Asserts that the created category is being correctly displayed in menu item creation.
        cy.visit("/page-builder/menus?slug=main-menu");

        cy.findByTestId("pb.menu.add.addmenuitem").click();
        cy.findByTestId("pb.menu.create.items.button").within(() => {
            cy.findByText("Page list").click();
        });
        cy.findByTestId("pb.menu.new.listitem.category").type(categoryNameEdited);
        cy.findByText(categoryNameEdited).click();
        cy.findByTestId("pb.menu.new.listitem.category")
            .invoke("val")
            .should("eq", categoryNameEdited);

        // Deletes the previously created category and asserts it is no longer being displayed.
        cy.visit("/page-builder/categories");
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(categoryNameEdited)
                .parent("li")
                .within(() => {
                    cy.get("button").click({ force: true });
                });
        });
        cy.contains("Are you sure you want to continue?").should("exist");
        cy.findAllByTestId("confirmationdialog-confirm-action").click();

        cy.findByText(`Category "${categorySlug}" deleted.`).should("exist");
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(categoryNameEdited).should("not.exist");
        });
    });
});
