import uniqid from "uniqid";

context("Forms Creation", () => {
    beforeEach(() => cy.login());

    it("should be able to create, publish, create new revision, and immediately delete everything", () => {
        const newFormTitle = `Test form ${uniqid()}`;
        const newFormTitle2 = `Test form ${uniqid()}`;

        cy.visit("/form-builder/forms");
        cy.findAllByTestId("new-record-button").first().click();
        cy.findByTestId("fb-new-form-modal").within(() => {
            cy.findByPlaceholderText("Enter a name for your new form").type(newFormTitle);
            cy.findByTestId("fb.form.create").click();
        });
        cy.wait(1000);
        cy.findByTestId("fb-editor-form-title").click();
        cy.get(`input[value="${newFormTitle}"]`).clear().type(`${newFormTitle2} {enter}`);
        cy.wait(333);
        // Add "Email" field to the form
        cy.findByTestId("form-editor-field-group-contact").click();
        cy.get(`[data-testid="fb.editor.fields.field.email"]`).drag(
            `[data-testid="fb.editor.dropzone.center"]`,
            {
                force: true
            }
        );
        cy.wait(1000);

        cy.findByTestId("fb-editor-back-button").click();
        cy.wait(1000);

        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(newFormTitle2);
                    cy.should("exist");
                    cy.findByText(/Draft/i);
                    cy.should("exist");
                    cy.findByText(/\(v1\)/i);
                    cy.should("exist");
                });
        });

        // Should only have one revision in form preview revision selector
        cy.findByTestId("fb.form-preview.header.revision-selector").click();
        cy.findByTestId("fb.form-preview.header.revision-v1").within(() => {
            cy.findByText(/Draft/i);
            cy.should("exist");
            cy.findByText(/v1/i);
            cy.should("exist");
        });

        // Publish the form and check it's status
        cy.findByTestId("fb.form-preview.header.publish").click();
        cy.findByTestId("fb.form-preview.header.publish-dialog").within(() => {
            cy.findByTestId("confirmationdialog-confirm-action").click();
        });
        cy.findByText(/Successfully published revision/i).should("exist");
        cy.wait(1000);
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(newFormTitle2);
                    cy.should("exist");
                    cy.findByText(/Published/i);
                    cy.should("exist");
                    cy.findByText(/\(v1\)/i);
                    cy.should("exist");
                });
        });

        // Create a new revision from the published form and check it status
        cy.findByTestId("fb.form-preview.header.create-revision").click();
        cy.wait(1000);
        cy.findByText(/\(v2\)/i).should("exist");
        cy.findByTestId("fb-editor-back-button").click();
        cy.wait(1000);

        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(newFormTitle2);
                    cy.should("exist");
                    cy.findByText(/Draft/i);
                    cy.should("exist");
                    cy.findByText(/\(v2\)/i);
                    cy.should("exist");
                });
        });

        // Edit form and publish it via the editor, then check the revision status
        cy.findByTestId("fb.form-preview.header.edit-revision").click();
        cy.wait(500);
        // Add "LastName" field to the form
        cy.findByTestId("form-editor-field-group-contact").click();
        cy.get(`[data-testid="fb.editor.fields.field.lastName"]`).drag(
            `[data-testid="fb.editor.dropzone.horizontal-last"]`,
            { force: true }
        );
        cy.wait(500);
        cy.findByTestId("fb.editor.default-bar.publish").click();
        cy.findByTestId("fb.editor.default-bar.publish-dialog").within(() => {
            cy.findByTestId("confirmationdialog-confirm-action").click();
        });
        cy.findByText(/Your form was published successfully/i).should("exist");
        cy.wait(1000);
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(newFormTitle2);
                    cy.should("exist");
                    cy.findByText(/Published/i);
                    cy.should("exist");
                    cy.findByText(/\(v2\)/i);
                    cy.should("exist");
                });
        });
        // Latest revision should be selected in the revision selector inside form preview
        cy.findByTestId("fb.form-preview.header.revision-selector").within(() => {
            cy.findByText(/v2/i).should("exist");
        });

        // Finally, delete the form and it's all revisions
        cy.findByTestId("fb.form-preview.header.delete").click();
        cy.wait(500);
        cy.findByTestId("fb.form-preview.header.delete-dialog").within(() => {
            cy.findByText("Confirmation required!").should("exist");
            // cy.findByText(/Confirm/i).should("exist");
            cy.findByTestId("confirmationdialog-confirm-action").click();
        });
        cy.findByText(/Revision was deleted successfully/i).should("exist");
        cy.wait(500);

        cy.findByTestId("fb.form-preview.header.delete").click();
        cy.wait(500);
        cy.findByTestId("fb.form-preview.header.delete-dialog").within(() => {
            cy.findByText("Confirmation required!").should("exist");
            // cy.findByText(/Confirm/i).should("exist");
            cy.findByTestId("confirmationdialog-confirm-action").click();
        });
        cy.findByText(/Form was deleted successfully/i).should("exist");
        cy.wait(500);
    });
});
