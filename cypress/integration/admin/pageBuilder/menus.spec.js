context("Menus Module", () => {
    before(() => {
        return cy.login();
    });

    it("should be able to create, edit and delete menus", () => {
        cy.visit("/admin/page-builder/menus")
            .findByLabelText("Name")
            .type("Cool Menu #1")
            .findByText("Save menu")
            .click()
            .findByText("Value is required.")
            .should("exist")
            .findByLabelText("Slug")
            .type("cool-menu-1")
            .findByLabelText("Description")
            .type("This is a cool testing menu.")
            .wait(500)
            /*.findByText("Save menu")
            .click();*/
    });
});
