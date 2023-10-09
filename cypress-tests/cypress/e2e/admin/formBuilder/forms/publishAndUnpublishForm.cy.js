import uniqid from "uniqid";

context("Forms Creation", () => {
    beforeEach(() => cy.login());

    it("should be able to create, publish, unpublish, re-publish, and immediately delete everything", () => {
        const newFormTitle = `Test form ${uniqid()}`;
        // 1. Create form
        cy.visit("/form-builder/forms");
        cy.findAllByTestId("new-record-button").first().click();
        cy.findByTestId("fb-new-form-modal").within(() => {
            cy.findByPlaceholderText("Enter a name for your new form").type(newFormTitle);
            cy.findByTestId("fb.form.create").click();
        });
        cy.wait(1000);

        // 2. Add "Email" field to the form
        cy.findByTestId("form-editor-field-group-contact").click();
        cy.get(`[data-testid="fb.editor.fields.field.email"]`).drag(
            `[data-testid="fb.editor.dropzone.center"]`,
            {
                force: true
            }
        );
        cy.wait(1000);

        // 3. Publish form from inside the editor
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
                    cy.findByText(newFormTitle).should("exist");
                    cy.findByText(/Published/i).should("exist");
                    cy.findByText(/\(v1\)/i).should("exist");
                });
        });

        // 4. UnPublish the form
        cy.findByTestId("fb.form-preview.header.unpublish").click();
        cy.findByTestId("fb.form-preview.header.unpublish-dialog").within(() => {
            cy.findByTestId("confirmationdialog-confirm-action").click();
        });
        cy.findByText(/Successfully unpublished revision/i).should("exist");
        cy.wait(1000);
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(newFormTitle).should("exist");
                    cy.findByText(/Locked/i).should("exist");
                    cy.findByText(/\(v1\)/i).should("exist");
                });
        });

        // 5. Create a new revision from the locked v1 and publish it
        cy.findByTestId("fb.form-preview.header.create-revision").click();
        cy.wait(500);
        // 5.1. Add "Website" field to the form
        cy.findByTestId("form-editor-field-group-contact").click();
        cy.get(`[data-testid="fb.editor.fields.field.website"]`).drag(
            `[data-testid="fb.editor.dropzone.horizontal-last"]`,
            { force: true }
        );
        cy.wait(1000);
        // 5.2. Publish the new revision
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
                    cy.findByText(newFormTitle).should("exist");
                    cy.findByText(/Published/i).should("exist");
                    cy.findByText(/\(v2\)/i).should("exist");
                });
        });
        // 5.3. Verify revision status in revision selector inside form preview
        cy.findByTestId("fb.form-preview.header.revision-selector").click();
        cy.findByTestId("fb.form-preview.header.revision-v2").within(() => {
            cy.findByText("(published)").should("exist");
            cy.findByText(/v2/i).should("exist");
        });
        cy.findByTestId("fb.form-preview.header.revision-v1").within(() => {
            cy.findByText("(locked)").should("exist");
            cy.findByText(/v1/i).should("exist");
        });
        cy.get("body").click();

        // 6. Try selecting "Revisions" tab and verify revisions
        cy.findByTestId("fb.form-details.tab.revisions").click();
        cy.findByTestId("fb.form-details.tab.revisions.content-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(/#2/i).should("exist");
                });

            cy.get("li")
                .next()
                .within(() => {
                    cy.findByText(/#1/i).should("exist");
                });
        });
        cy.wait(1000);
        // 7. Create a new revision from "Locked"(v1) revision
        cy.findByTestId("fb.form-details.tab.revisions.content-list").within(() => {
            cy.get("li")
                .first()
                .next()
                .within(() => {
                    cy.findByText(/#1/i).should("exist");
                    cy.findByTestId("fb.form-revisions.action-menu").click();
                });
        });
        cy.findAllByTestId("fb.form-revisions.action-menu.create-revision").last().click();
        cy.wait(1000);
        // 8. Go back in form details view and check it's status
        cy.findByTestId("fb-editor-back-button").click();
        cy.wait(1000);

        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(newFormTitle).should("exist");
                    cy.findByText(/Draft/i).should("exist");
                    cy.findByText(/\(v3\)/i).should("exist");
                });
        });

        // Finally, delete the form and it's all revisions
        for (let i = 0; i < 2; i++) {
            cy.findByTestId("fb.form-preview.header.delete").click();
            cy.wait(500);
            cy.findByTestId("fb.form-preview.header.delete-dialog").within(() => {
                cy.findByText("Confirmation required!").should("exist");
                cy.findByTestId("confirmationdialog-confirm-action").click();
            });
            cy.findByText(/Revision was deleted successfully/i).should("exist");
            cy.wait(500);
        }

        cy.findByTestId("fb.form-preview.header.delete").click();
        cy.wait(500);
        cy.findByTestId("fb.form-preview.header.delete-dialog").within(() => {
            cy.findByText("Confirmation required!").should("exist");
            cy.findByTestId("confirmationdialog-confirm-action").click();
        });
        cy.findByText(/Form was deleted successfully/i).should("exist");
        cy.wait(500);
    });
});
