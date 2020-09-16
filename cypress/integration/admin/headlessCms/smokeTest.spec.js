import uniqid from "uniqid";
import camelCase from "lodash/camelCase";

context("Headless CMS - Smoke Test", () => {
    beforeEach(() => cy.login());

    it("should be able to create models and then entries", () => {
        const newModel1 = `Book ${uniqid()}`;
        const newModel2 = `Author ${uniqid()}`;

        // Let's create a new "Book" model, without any fields.
        cy.visit("/cms/content-models")
            .findByTestId("new-record-button")
            .click()
            .findByTestId("cms-new-content-model-modal")
            .within(() => {
                cy.findByText("Ungrouped")
                    .findByLabelText("Name")
                    .type(newModel1)
                    .findByText("+ Create")
                    .click();
            })
            .findByTestId("cms-editor-back-button")
            .click()
            .wait(1000);

        // Now we will try to create a new model that references "Book". The only problem is that the "Book" model
        // doesn't contain a title field, so we should get an error while trying to save the "Author" model.
        cy.visit("/cms/content-models")
            .findByTestId("new-record-button")
            .click()
            .findByTestId("cms-new-content-model-modal")
            .within(() => {
                cy.findByText("Ungrouped")
                    .findByLabelText("Name")
                    .type(newModel2)
                    .findByText("+ Create");
            })
            .click()
            .wait(1000);

        // Drag and drop a "text" and "ref" fields.
        cy.get(`[data-testid="cms-editor-fields-field-text"]`)
            .drag(`[data-testid="cms-editor-first-field-area"]`, { force: true })
            .findByTestId("cms-editor-edit-fields-dialog")
            .within(() => {
                cy.findByLabelText("Label").type("Nickname");
                cy.findByText("Save").click();
            })
            .wait(1000);

        cy.get(`[data-testid="cms-editor-fields-field-ref"]`)
            .drag(`[data-testid="cms-editor-row-droppable-bottom-0"]`, { force: true })
            .findByTestId("cms-editor-edit-fields-dialog")
            .within(() => {
                cy.findByLabelText("Label").type("Book");
                cy.findByLabelText("Content Model").type(newModel1.substr(0, 10));
                cy.wait(1000);
                cy.findByText(newModel1).click();
                cy.findByText("Save").click();
            });

        // This should create an error.
        cy.findByTestId("cms-editor-top-bar").within(() => {
            cy.findByText("Save").click();
        });

        const msg = `Cannot save content model because the ref field "book" references a content model "${camelCase(
            newModel1
        )}" that has no title field assigned.`;
        cy.findByText(msg).should("exist");

        // Okay, let's go back and add a title field to the "Book" model.
        cy.findByTestId("cms-editor-back-button")
            .click()
            .wait(1000)
            .findByTestId("default-data-list")
            .within(() => {
                cy.get("div")
                    .first()
                    .next()
                    .within(() => {
                        cy.findByTestId("cms-edit-content-model-button").click({
                            force: true
                        });
                    });
            });

        cy.get(`[data-testid="cms-editor-fields-field-text"]`)
            .drag(`[data-testid="cms-editor-first-field-area"]`, { force: true })
            .findByTestId("cms-editor-edit-fields-dialog")
            .within(() => {
                cy.findByLabelText("Label").type("Title");
                cy.findByText("Save").click();
            })
            .wait(1000);

        // Saving the "Book" model should complete successfully.
        cy.findByTestId("cms-editor-top-bar")
            .within(() => {
                cy.findByText("Save")
                    .click()
                    .wait(1000);
            })
            .findByText(`Your content model was saved successfully!`)
            .should("exist");

        // Now let's go back to the "Author" model and try to repeat the same process, now it should work.
        cy.findByTestId("cms-editor-back-button")
            .click()
            .wait(1000);

        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .within(() => {
                    cy.findByTestId("cms-edit-content-model-button").click({
                        force: true
                    });
                });
        });

        cy.get(`[data-testid="cms-editor-fields-field-text"]`)
            .drag(`[data-testid="cms-editor-first-field-area"]`, { force: true })
            .findByTestId("cms-editor-edit-fields-dialog")
            .within(() => {
                cy.findByLabelText("Label").type("Nickname");
                cy.findByText("Save").click();
            })
            .wait(1000);

        cy.get(`[data-testid="cms-editor-fields-field-ref"]`)
            .drag(`[data-testid="cms-editor-row-droppable-bottom-0"]`, { force: true })
            .findByTestId("cms-editor-edit-fields-dialog")
            .within(() => {
                cy.findByLabelText("Label").type("Book");
                cy.findByLabelText("Content Model").type(newModel1.substr(0, 10));
                cy.wait(1000);
                cy.findByText(newModel1).click();
                cy.findByText("Save").click();
            });

        cy.findByTestId("cms-editor-top-bar").within(() => {
            cy.findByText("Save").click();
        });

        cy.findByText(`Your content model was saved successfully!`).should("exist");

        // Great, it works! Let's go back to the list of content models, and try creating content entries.
        cy.findByTestId("cms-editor-back-button")
            .click()
            .wait(1000);

        // Return to the list of all content models and navigate to entries view. We first create a book.
        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .next()
                .within(() => {
                    cy.findByTestId("cms-view-content-model-button").click({
                        force: true
                    });
                });
        });

        cy.findByTestId("cms-content-details").within(() => {
            cy.findByLabelText("Title")
                .type(`${newModel1}-1`)
                .findByText(/save & publish/i)
                .click();
        });
        cy.findByText("Confirm")
            .click()
            .findByText("Content created successfully.")
            .should("exist")
            .get(".react-spinner-material")
            .should("not.exist")
            .wait(1000)
            .findByTestId("new-record-button")
            .click();

        // Return to the list of all content models again. Now we first create an author.
        cy.visit("/cms/content-models")
            .findByTestId("default-data-list")
            .within(() => {
                cy.get("div")
                    .first()
                    .next()
                    .within(() => {
                        cy.findByTestId("cms-view-content-model-button").click({
                            force: true
                        });
                    });
            });

        // Create an author.
        cy.findByTestId("cms-content-details").within(() => {
            cy.findByLabelText("Nickname").type(`${newModel2}-1`);
            cy.findByLabelText("Book")
                .type(`${newModel1.substr(0, 10)}`)
                .wait(1000)
                .findByText(`${newModel1}-1`)
                .click()
                .findByText(/save & publish/i)
                .click();
        });

        cy.findByText("Confirm")
            .click()
            .findByText("Content created successfully.")
            .should("exist")
            .get(".react-spinner-material")
            .should("not.exist")
            .wait(1000)
            .findByTestId("new-record-button")
            .click();
    });
});
