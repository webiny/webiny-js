import { generateAlphaLowerCaseId } from "@webiny/utils/generateId";

context("Page Builder - Menu CRUD", () => {
    const menuName = generateAlphaLowerCaseId(10);
    const menuSlug = generateAlphaLowerCaseId(10);

    const menuNameEdit = "Testing Menu123";
    const menuDescEdit = "This is an edited description.";

    beforeEach(() => {
        cy.login();
        cy.pbDeleteAllMenus();
    });

    it("should be able to create, edit, and immediately delete a menu", () => {
        cy.visit("/page-builder/menus");

        // Create a menu.
        cy.findByTestId("data-list-new-record-button").should("exist");
        cy.findByTestId("data-list-new-record-button").click();

        cy.findByTestId("pb.menu.create.name").type(menuName);
        cy.findByTestId("pb.menu.save.button").click();
        cy.findByText("Value is required.").should("exist");
        cy.findByTestId("pb.menu.create.slug").type(menuSlug);
        cy.findByTestId("pb.menu.create.description").type("This is a cool test.");
        cy.findByTestId("pb.menu.save.button").click();

        cy.findByText("Menu saved successfully.").should("exist");

        // Edit the menu.
        cy.findByTestId("pb.menu.create.name").clear().type(menuNameEdit);
        cy.findByTestId("pb.menu.create.slug").should("be.disabled");
        cy.findByTestId("pb.menu.create.description").clear().type(menuDescEdit);
        cy.findByTestId("pb.menu.save.button").click();
        cy.findByText("Menu saved successfully.").should("exist");

        // Assert the menu is being displayed properly on the right side of the screen.
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(menuNameEdit).should("exist");
                    cy.findByText(menuDescEdit).should("exist");
                    cy.findByTestId("pb-menus-list-delete-menu-btn").click({ force: true });
                });
        });

        // Finish deleting the menu and assert it is deleted.
        cy.contains("Are you sure you want to continue?").should("exist");
        cy.findAllByTestId("confirmationdialog-confirm-action").click();

        cy.findByText(`Menu "${menuSlug}" deleted.`).should("exist");
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(menuNameEdit).should("not.exist");
        });
    });
});
