import uniqid from "uniqid";

context("Menus Module", () => {
    beforeEach(() => cy.login());

    it("should be able add all types items to the menu", () => {
        const id = uniqid();
        cy.visit("/page-builder/menus")
            .findByLabelText("Name")
            .type(`Cool Menu ${id}`)
            .findByText("Save menu")
            .findByLabelText("Slug")
            .type(`cool-menu-${id}`)
            .findByLabelText("Description")
            .type("This is a cool test.")

            /*
            .findByText("Save menu")
            .click();*/


    });


});
