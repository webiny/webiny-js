import { generateAlphaLowerCaseId } from "@webiny/utils/generateId";

context("Forms Creation", () => {
    beforeEach(() => cy.login());

    describe("Create Form", () => {
        const newFormTitle = `Test form 1 ${generateAlphaLowerCaseId(10)}`;
        const newFormTitle2 = `Test form 2 ${generateAlphaLowerCaseId(10)}`;

        it("should be able to create form, rename it, publish it, create new revision and delete it", () => {
            cy.visit("/form-builder/forms");

            // Creating new form.
            // After creating new form we should be redirected to the form editing page.
            cy.findAllByTestId("new-record-button").first().click();
            cy.findByTestId("fb-new-form-modal").within(() => {
                cy.findByPlaceholderText("Enter a name for your new form").type(newFormTitle);
                cy.findByTestId("fb.form.create").click();
            });

            // Check if we got redirected on form editor page.
            cy.findByTestId("add-step-action", { timeout: 15000 });

            // Renaming Form.
            cy.findByTestId("fb-editor-form-title").click({ force: true });
            cy.get(`input[value="${newFormTitle}"]`).clear().type(newFormTitle2).blur();

            // Publishing form after we changed name of it.
            cy.findByTestId("fb.editor.default-bar.publish").click({ force: true });
            // Confirming publishing operation in the confirmation dialog.
            cy.findByTestId("fb.editor.default-bar.publish-dialog").within(() => {
                cy.findByTestId("confirmationdialog-confirm-action").click();
            });

            // Should see this text if publishing operation was successful.
            cy.findByText("Your form was published successfully!");

            // Check if we have renamed form in the list of forms.
            cy.findByTestId("default-data-list").within(() => {
                cy.findAllByTestId("default-data-list-element")
                    .first()
                    .within(() => {
                        cy.findByText(newFormTitle2);
                    });
            });

            // Should open form edit page for the form with title "newFormTitle2".
            cy.findByTestId("default-data-list").within(() => {
                cy.findAllByTestId("default-data-list-element")
                    .first()
                    .within(() => {
                        cy.findByText(newFormTitle2).should("be.visible");
                        cy.findByTestId("edit-form-action").click({ force: true });
                    });
            });

            // Check if we got redirected on form editor page.
            cy.findByTestId("add-step-action", { timeout: 15000 }).click({ force: true });

            // Confirm that we have added a new step.
            cy.findAllByTestId("form-step-element").should("have.length", "2");

            // Publishing form after we added a new step.
            cy.findByTestId("fb.editor.default-bar.publish").click({ force: true });
            // Confirming publishing operation in the confirmation dialog.
            cy.findByTestId("fb.editor.default-bar.publish-dialog").within(() => {
                cy.findByTestId("confirmationdialog-confirm-action").click();
            });
            // Should see this text if publishing operation was successfull.
            cy.findByText("Your form was published successfully!");

            // Check that revision version is 2.
            cy.findByTestId("default-data-list").within(() => {
                cy.findAllByTestId("default-data-list-element")
                    .first()
                    .within(() => {
                        cy.findByText(newFormTitle2).should("be.visible");
                        cy.findByTestId("fb.form.status").within(() => {
                            cy.findByText("Published (v2)");
                        });
                    });
            });

            // Deleting form.
            cy.findByTestId("default-data-list").within(() => {
                cy.findAllByTestId("default-data-list-element")
                    .first()
                    .within(() => {
                        cy.findByTestId("delete-form-action").click({ force: true });
                    });
            });

            cy.findAllByTestId("form-deletion-confirmation-dialog", { timeout: 15000 })
                .first()
                .within(() => {
                    cy.findByTestId("confirmationdialog-confirm-action").click({ force: true });
                });
        });
    });
});
