import { generateAlphaLowerCaseId } from "@webiny/utils/generateId";

context("Page Builder - Template CRUD", () => {
    const templateName = generateAlphaLowerCaseId(10);
    const templateNameEdit = generateAlphaLowerCaseId(10);
    beforeEach(() => {
        cy.login();
        cy.pbDeleteAllTemplates();
    });

    it("Should be able to create a template and then edit and delete it", () => {
        cy.visit("/page-builder/page-templates");

        // Creates a template using the UI.
        cy.findAllByTestId("pb-templates-list-new-template-btn").click();
        cy.findByRole("textbox", { name: "Title" }).type(templateName);
        cy.findByRole("textbox", { name: "Slug" }).type(templateName);
        cy.findByRole("textbox", { name: "Description" }).type(templateName);
        cy.findByRole("button", { name: "Create" }).click();

        // In the page editor, we click Save Changes and return back to list of templates.
        cy.findByRole("button", { name: "Save Changes" }).should("exist").click();
        cy.contains(templateName).should("exist");

        // Edits the template name using the UI.
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByTestId("pb-templates-list-edit-template-btn").click({
                        force: true
                    });
                });
        });
        cy.findByTestId("pb-editor-page-title").click();
        cy.get(`input[value="${templateName}"]`).clear().type(templateNameEdit).blur();
        cy.findByRole("button", { name: "Save Changes" }).should("exist").click();
        cy.contains(templateNameEdit).should("exist");

        // Deletes the template using the UI.
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByTestId("pb-templates-list-delete-template-btn").click({
                        force: true
                    });
                });
        });

        // Confirm deletion via the shown confirmation dialog.
        cy.contains("Are you sure you want to continue?").should("exist");
        cy.findByTestId("confirmationdialog-confirm-action").click();

        cy.visit("/page-builder/page-templates");
        cy.contains("templateNameEdit").should("not.exist");
    });
});
