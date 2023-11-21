import { customAlphabet } from "nanoid";

context("Categories Module", () => {
    const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz");
    const category_name = nanoid(6);
    const category_name_edited = nanoid(6);
    const category_slug = nanoid(6);
    const category_url = "/" + nanoid(6) + "/";
    const category_url_edited = "/" + nanoid(6) + "/";

    beforeEach(() => {
        cy.login();
        cy.pbDeleteAllCategories();
    });

    afterEach(() => {
        cy.pbDeleteAllCategories();
    });

    it("Should be able to create, edit, and immediately delete a category", () => {
        cy.visit("/page-builder/categories");

        // Creates new category.
        cy.findByTestId("data-list-new-record-button").click();
        cy.findByTestId("pb.category.new.form.name").type(category_name);
        cy.findByTestId("pb.category.new.form.slug").type(category_slug);
        cy.findByTestId("pb.category.new.form.url").type(category_url);
        cy.findByTestId("pb.category.new.form.button.save").click();
        cy.findByText("Category saved successfully.").should("exist");

        // Asserts the previously created category is being correctly displayed.
        cy.wait(500);
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(category_name).should("exist");
            cy.findByText(category_url).should("exist");
            cy.findByText(category_url).click();
        });

        // Assert that the title on top and the other form fields below display correct values on the right side of the screen.
        cy.get(".mdc-typography--headline5").should("contain", category_name);
        cy.findByTestId("pb.category.new.form.name").invoke("val").should("eq", category_name);
        cy.findByTestId("pb.category.new.form.slug").invoke("val").should("eq", category_slug);
        cy.findByTestId("pb.category.new.form.url").invoke("val").should("eq", category_url);

        // Tests editing category fields.
        cy.findByTestId("pb.category.new.form.name").clear().type(category_name_edited);
        cy.findByTestId("pb.category.new.form.url").clear().type(category_url_edited);

        cy.findByTestId("pb.category.new.form.button.save").click();
        cy.findByText("Category saved successfully.").should("exist");

        // Asserts the previously edited category is being correctly displayed.
        cy.wait(500);
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(category_name_edited).should("exist");
            cy.findByText(category_url_edited).should("exist");
            cy.findByText(category_url_edited).click();
        });
        cy.get(".mdc-typography--headline5").should("contain", category_name_edited);
        cy.findByTestId("pb.category.new.form.name")
            .invoke("val")
            .should("eq", category_name_edited);
        cy.findByTestId("pb.category.new.form.slug").invoke("val").should("eq", category_slug);
        cy.findByTestId("pb.category.new.form.url").invoke("val").should("eq", category_url_edited);

        // Asserts that the created category is being correctly displayed in menu item creation.
        cy.visit("/page-builder/menus?slug=main-menu");

        cy.findByTestId("pb.menu.add.addmenuitem").click();
        cy.findByTestId("pb.menu.create.items.button").within(() => {
            cy.findByText("Page list").click();
        });
        cy.findByTestId("pb.menu.new.listitem.category").type(category_name_edited);
        cy.findByText(category_name_edited).click();
        cy.findByTestId("pb.menu.new.listitem.category")
            .invoke("val")
            .should("eq", category_name_edited);

        // Deletes the previously created category and asserts it is no longer being displayed.
        cy.visit("/page-builder/categories");
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(category_name_edited)
                .parent("li")
                .within(() => {
                    cy.get("button").click({ force: true });
                });
        });
        cy.contains("Are you sure you want to continue?").should("exist");
        cy.findAllByTestId("confirmationdialog-confirm-action").click();

        cy.findByText(`Category "${category_slug}" deleted.`).should("exist");
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(category_name_edited).should("not.exist");
        });
    });
});
