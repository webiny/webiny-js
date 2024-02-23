import uniqid from "uniqid";
import lodashUpperFirst from "lodash/upperFirst";
import lodashCamelCase from "lodash/camelCase";

context("Headless CMS - Content Models CRUD", () => {
    beforeEach(() => cy.login());

    it("should create, edit, and delete content model - no default fields", () => {
        // 1. Visit /cms/content-models
        cy.visit("/cms/content-models");
        // 2. Create a new content model
        const uniqueId = uniqid();
        const newModelDescription = `Creating a new model for testing.`;

        // 2.1 Add name
        // 2.2 Description
        // 2.3 Click save button
        cy.findByTestId("new-record-button").click();
        cy.findByTestId("cms-new-content-model-modal").within(() => {
            // Ensures we start typing once the content model group select is loaded.
            // This is important because otherwise, typing into the first field would be partially lost.
            cy.contains("Ungrouped").should("exist");

            cy.findByTestId("cms.newcontentmodeldialog.name")
                .focus()
                // waiting seems to improve flakyness of this test
                .wait(500)
                .type(`Book - ${uniqueId}`)
                .wait(500);
            // add api singular and plural names
            cy.findByTestId("cms.newcontentmodeldialog.singularApiName")
                .focus()
                .wait(500)
                .type(lodashUpperFirst(lodashCamelCase(`Book${uniqueId}`)))
                .wait(500);
            cy.findByTestId("cms.newcontentmodeldialog.pluralApiName")
                .focus()
                .wait(500)
                .type(lodashUpperFirst(lodashCamelCase(`Books${uniqueId}`)))
                .wait(500);

            cy.findByTestId("cms.newcontentmodeldialog.description").type(newModelDescription);
            cy.findByTestId("cms.newcontentmodeldialog.defaultfields").uncheck();
            cy.findByRole("button", { name: "+ Create Model" }).click();
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
            cy.findByTestId("cms.editor.field.settings.general.label")
                .focus()
                .wait(500)
                .type("Title")
                .wait(500);
            cy.findByTestId("cms.editor.field.settings.save").click();
        });
        cy.wait(1000);

        cy.get(`[data-testid="cms-editor-fields-field-number"]`).drag(
            `[data-testid="cms-editor-row-droppable-bottom-0"]`,
            { force: true }
        );
        cy.findByTestId("cms-editor-edit-fields-dialog").within(() => {
            cy.findByTestId("cms.editor.field.settings.general.label")
                .focus()
                .wait(500)
                .type("Edition")
                .wait(500);
            cy.findByTestId("cms.editor.field.settings.save").click();
        });
        cy.wait(1000);
        // Saving the "Book" model should complete successfully.
        cy.findByTestId("cms-editor-top-bar").within(() => {
            cy.findByTestId("cms.editor.defaultbar.save").click();
        });
        cy.findByText(`Your content model was saved successfully!`).should("exist");
        // Get back to the list view
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("cms-editor-back-button")` if issue is fixed.
        cy.get('button[data-testid="cms-editor-back-button"]').click();
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
                    // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
                    // Now targeting <button> directly. Revert to `.findByTestId("cms-edit-content-model-button")` if issue is fixed.
                    cy.get('button[data-testid="cms-edit-content-model-button"]').click({
                        force: true
                    });
                });
        });
        // 4.2 Add field validations
        // a) Click on the edit icon
        cy.findAllByTestId("cms.editor.field-row")
            .first()
            .within(() => {
                // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
                // Now targeting <button> directly. Revert to `.findByTestId("cms.editor.edit-field")` if issue is fixed.
                cy.get('button[data-testid="cms.editor.edit-field"]').click();
            });
        cy.findByTestId("cms-editor-edit-fields-dialog").within(() => {
            // b) Select validation tab from dialog
            cy.findByTestId("cms.editor.field.tabs.validators").click();
            // c) Add required validator
            cy.findByTestId("cms.editor.field-validator.required")
                .parent()
                .within(() => {
                    cy.findByLabelText("Enabled").check();
                    cy.findByTestId("cms.editfield.validators.required").clear();
                    cy.findByTestId("cms.editfield.validators.required")
                        .type("Title is required.")
                        .blur();
                    cy.wait(1000);
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
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("cms-editor-back-button")` if issue is fixed.
        cy.get('button[data-testid="cms-editor-back-button"]').click();
        cy.wait(1000);

        // Delete new model
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(`Book - ${uniqueId}`).should("exist");
                    // a. Click on delete button
                    // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
                    // Now targeting <button> directly. Revert to `.findByTestId("cms-delete-content-model-button")` if issue is fixed.
                    cy.get('button[data-testid="cms-delete-content-model-button"]').click({
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

    it("should create, edit, and delete content model - with fields", () => {
        // 1. Visit /cms/content-models
        cy.visit("/cms/content-models");
        // 2. Create a new content model
        const uniqueId = uniqid();
        const newModelDescription = `Creating a new model for testing.`;

        // 2.1 Add name
        // 2.2 Description
        // 2.3 Click save button
        cy.findByTestId("new-record-button").click();
        cy.findByTestId("cms-new-content-model-modal").within(() => {
            // Ensures we start typing once the content model group select is loaded.
            // This is important because otherwise, typing into the first field would be partially lost.
            cy.contains("Ungrouped").should("exist");

            cy.findByTestId("cms.newcontentmodeldialog.name")
                .focus()
                // waiting seems to improve flakyness of this test
                .wait(500)
                .type(`Book - ${uniqueId}`)
                .wait(500);
            // add api singular and plural names
            cy.findByTestId("cms.newcontentmodeldialog.singularApiName")
                .focus()
                .wait(500)
                .type(lodashUpperFirst(lodashCamelCase(`Book${uniqueId}`)))
                .wait(500);
            cy.findByTestId("cms.newcontentmodeldialog.pluralApiName")
                .focus()
                .wait(500)
                .type(lodashUpperFirst(lodashCamelCase(`Books${uniqueId}`)))
                .wait(500);
            cy.findByTestId("cms.newcontentmodeldialog.description").type(newModelDescription);
            /**
             * checkbox is checked by default, but lets set it to true just in case someone changes that
             */
            cy.findByTestId("cms.newcontentmodeldialog.defaultfields").check();
            cy.findByRole("button", { name: "+ Create Model" }).click();
        });
        // 3. Editor
        cy.wait(1000);
        // 3.1 Editor -> Preview tab -> check message
        cy.findByTestId("cms.editor.tab.preview").click();

        // 3.2 Verify that title, description and image fields exist
        cy.findByTestId("fr.input.text.Title").should("exist");
        cy.findByTestId("fr.input.longtext.Description").should("exist");
        /**
         * TODO figure out how to test for the image field
         */
        //cy.findByTestId("fr.input.file.Image").should("exist");

        // Get back to the list view
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("cms-editor-back-button")` if issue is fixed.
        cy.get('button[data-testid="cms-editor-back-button"]').click();
        cy.wait(1000);

        // Delete new model
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(`Book - ${uniqueId}`).should("exist");
                    // a. Click on delete button
                    // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
                    // Now targeting <button> directly. Revert to `.findByTestId("cms-delete-content-model-button")` if issue is fixed.
                    cy.get('button[data-testid="cms-delete-content-model-button"]').click({
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
