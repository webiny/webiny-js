import uniqid from "uniqid";

context("Headless CMS - Content Models CRUD", () => {
    beforeEach(() => cy.login());

    it("should create, edit, and delete content model", () => {
        // 1. Visit /cms/content-models
        cy.visit("/cms/content-models");
        // 2. Create a new content model
        const uniqueId = uniqid()
        const newModelDescription = `Creating a new model for testing.`;

        // 2.1 Add name
        // 2.2 Description
        // 2.3 Click save button
        cy.findByTestId("new-record-button").click();
        cy.findByTestId("cms-new-content-model-modal").within(() => {
            cy.findByText("New Content Model").should("exist");

            cy.findByTestId("cms.newcontentmodeldialog.name").type(`Book - ${uniqueId}`);
            cy.findByTestId("cms.newcontentmodeldialog.description").type(newModelDescription);
            cy.findByRole("button", { name: "+ Create Model"}).click();
        });
        // 3. Editor
        cy.wait(1000);
        // 3.1 Editor -> Preview tab -> check message
        cy.findByTestId("cms.editor.tab.preview").click();
        cy.findByText(
            `Before previewing the form, please add at least one field to the content model.`
        ).should("exist");
        // 3.2 Edit tab -> add text field and number field -> Save button
        cy.findByTestId("cms.editor.tab.edit").click();
        cy.get(`[data-testid="cms-editor-fields-field-text"]`).drag(
            `[data-testid="cms-editor-first-field-area"]`,
            {
                force: true
            }
        );
        cy.findByTestId("cms-editor-edit-fields-dialog").within(() => {
            cy.findByTestId("cms.editor.field.settings.general.label").focus().type("Title");
            cy.findByTestId("cms.editor.field.settings.save").click();
        });
        cy.wait(1000);

        cy.get(`[data-testid="cms-editor-fields-field-number"]`).drag(
            `[data-testid="cms-editor-row-droppable-bottom-0"]`,
            { force: true }
        );
        cy.findByTestId("cms-editor-edit-fields-dialog").within(() => {
            cy.findByTestId("cms.editor.field.settings.general.label").focus().type("Edition");
            cy.wait(500);
            cy.findByTestId("cms.editor.field.settings.save").click();
        });
        cy.wait(1000);
        // Saving the "Book" model should complete successfully.
        cy.findByTestId("cms-editor-top-bar").within(() => {
           cy.findByTestId("cms.editor.defaultbar.save").click();
        });
        cy.findByText(`Your content model was saved successfully!`).should("exist");
        // Get back to the list view
        cy.findByTestId("cms-editor-back-button").click();
        cy.wait(1000);
        // 3.3 Check newly created model in data list
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(`Book - ${uniqueId}`).should("exist");
                });
        });

        // 4. Edit

        // 4.1 Click edit button from models list
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(`Book - ${uniqueId}`).should("exist");
                    cy.findByTestId("cms-edit-content-model-button").click({ force: true });
                });
        });
        // 4.2 Add field validations
        // a) Click on the edit icon
        cy.findAllByTestId("cms.editor.field-row")
            .first()
            .within(() => {
                cy.findByTestId("cms.editor.edit-field").click();
            });
        cy.findByTestId("cms-editor-edit-fields-dialog").within(() => {
            // b) Select validation tab from dialog
            cy.findByTestId("cms.editor.field.tabs.validators").click();
            // c) Add required validator
            cy.findByTestId("cms.editor.field-validator.required").within(() => {
                cy.findByLabelText("Enabled").check();
                cy.findByTestId("cms.editfield.validators.required").clear().type("Title is required.").blur();
                cy.wait(1000)
            });
            // d) Save field
            cy.findByTestId("cms.editor.field.settings.save").click();
        });
        // e) Save model
        cy.findByTestId("cms-editor-top-bar").within(() => {
            cy.findByTestId("cms.editor.defaultbar.save").click();
        });
        cy.findByText("Your content model was saved successfully!");

        // 5. Test validator in preview
        cy.findByTestId("cms.editor.tab.preview").click();
        cy.findByTestId("fr.input.text.Title").focus();
        cy.findByTestId("fr.input.number.Edition").type("2");
        cy.findByText("Title is required.").should("exist");
        // Get back to the list view
        cy.findByTestId("cms-editor-back-button").click();
        cy.wait(1000);

        // Delete new model
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(`Book - ${uniqueId}`).should("exist");
                    // a. Click on delete button
                    cy.findByTestId("cms-delete-content-model-button").click({
                        force: true
                    });
                    cy.wait(1000);
                });
        });
        // b. Confirm delete model
        cy.findByTestId("cms-delete-content-model-dialog").within(() => {
            cy.findAllByTestId("dialog-accept").next().click();
        });
        // c. Check success message
        cy.findByText(`Content model ${`Book - ${uniqueId}`} deleted successfully!.`);
    });
});
