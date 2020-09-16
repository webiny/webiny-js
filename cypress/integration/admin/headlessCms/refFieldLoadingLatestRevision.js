/* eslint-disable jest/expect-expect */
import uniqid from "uniqid";

context("Headless CMS - Smoke Test", () => {
    beforeEach(() => cy.login());

    it("should be able to create models and then entries", () => {
        const newModel1 = `Book ${uniqid()}`;
        const newModel2 = `Author ${uniqid()}`;

        // Let's create a new "Book" model
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
            });

        cy.get(`[data-testid="cms-editor-fields-field-text"]`)
            .drag(`[data-testid="cms-editor-first-field-area"]`, { force: true })
            .findByTestId("cms-editor-edit-fields-dialog")
            .within(() => {
                cy.findByLabelText("Label").type("Title");
                cy.findByText("Save").click();
            })
            .wait(1000);

        cy.findByTestId("cms-editor-top-bar").within(() => {
            cy.findByText("Save").click();
        });

        cy.findByText(`Your content model was saved successfully!`).should("exist");

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
            .wait(500)
            .findByTestId("new-record-button")
            .click()
            .wait(500);

        cy.findByTestId("cms-content-details").within(() => {
            cy.findByLabelText("Title")
                .type(`${newModel1}-2nd`)
                .findByText(/save & publish/i)
                .click();
        });

        cy.findByText("Confirm")
            .click()
            .findByText("Content created successfully.")
            .should("exist")
            .get(".react-spinner-material")
            .should("not.exist")
            .wait(1000);

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

        // Now, let's go to the book entry again, publish it, and create a new revision. Going back to the Author
        // entry, we should see the latest revision. Note that we will need to press the refresh button in order
        // to see the change.

        cy.visit("/cms/content-models");

        cy.findByText(newModel1)
            .closest("div")
            .within(() => {
                cy.findByTestId("cms-view-content-model-button").click({
                    force: true
                });
            });

        cy.findByText(`${newModel1}-1`).click();
        cy.findByTestId("cms-content-details").within(() => {
            cy.get(".react-spinner-material")
                .should("not.exist")
                .wait(1000);
            cy.findByText(/save & publish/i).click();
        });

        cy.findByTestId("cms-confirm-save-and-publish").within(() => {
            cy.findByText("Confirm").click();
        });

        cy.findByText("Content published successfully.")
            .should("exist")
            .get(".react-spinner-material")
            .should("not.exist")
            .wait(1000);

        cy.findByTestId("cms-content-details").within(() => {
            cy.get(".react-spinner-material")
                .should("not.exist")
                .wait(1000);

            // Create a new revision, by changing the title and hitting the save button.
            cy.findByLabelText("Title")
                .type(`-Rev2`)
                .findByTestId("cms-content-save-content-button")
                .click();
        });

        cy.findByText("A new revision was created.")
            .should("exist")
            .get(".react-spinner-material")
            .should("not.exist")
            .wait(1000);

        cy.visit("/cms/content-models");
        cy.findByText(newModel2)
            .closest("div")
            .within(() => {
                cy.findByTestId("cms-view-content-model-button").click({
                    force: true
                });
            });

        cy.findByText(`${newModel2}-1`).click();
        cy.findByTestId("cms-content-details").within(() => {
            cy.get(".react-spinner-material")
                .should("not.exist")
                .wait(1000);

            // Create a new revision, by changing the title and hitting the save button.
            cy.findByTestId("cms-content-refresh-content-button").click();
            cy.wait(100);
            cy.get(".react-spinner-material")
                .should("not.exist")
                .wait(1000);

            cy.findByLabelText("Book").should("value", `${newModel1}-1-Rev2`);

            cy.findByLabelText("Book")
                .clear()
                .type(`${newModel1}-2`)
                .wait(1000)
                .findByText(`${newModel1}-2nd`)
                .click()
                .findByTestId("cms-content-save-content-button")
                .click();
        });

        cy.findByText("A new revision was created.")
            .should("exist")
            .get(".react-spinner-material")
            .should("not.exist")
            .wait(500);
        cy.reload();
        cy.findByTestId("cms-content-details").within(() => {
            cy.findByLabelText("Book").should("value", `${newModel1}-2nd`);
        });
    });
});
