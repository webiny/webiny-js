import uniqid from "uniqid";

context("Headless CMS - Smoke Test", () => {
    beforeEach(() => cy.login());

    it("should be able to create models and then entries", () => {
        const newModel1 = `Book ${uniqid()}`;
        const newModel2 = `Author ${uniqid()}`;

        // Let's create a new "Book" model, without any fields.
        cy.visit("/cms/content-models");
        cy.findAllByTestId("new-record-button")
            .first()
            .click();
        cy.findByTestId("cms-new-content-model-modal").within(() => {
            cy.findByText("Ungrouped");
            cy.findByLabelText("Name").type(newModel1);
            cy.findByText("+ Create").click();
        });
        // Add title field to "Book" model.
        cy.get(
            `[data-testid="cms-editor-fields-field-text"]`
        ).drag(`[data-testid="cms-editor-first-field-area"]`, { force: true });
        cy.findByTestId("cms-editor-edit-fields-dialog").within(() => {
            cy.findByLabelText("Label").type("Title");
            cy.findByText("Save").click();
        });
        cy.wait(1000);
        // Saving the "Book" model should complete successfully.
        cy.findByTestId("cms-editor-top-bar").within(() => {
            cy.findByText("Save").click();
        });
        cy.findByText(`Your content model was saved successfully!`);
        cy.should("exist");

        // Now we will try to create a new model "Author" that references "Book".
        cy.visit("/cms/content-models");
        cy.findAllByTestId("new-record-button")
            .first()
            .click();
        cy.findByTestId("cms-new-content-model-modal").within(() => {
            cy.findByText("Ungrouped");
            cy.findByLabelText("Name").type(newModel2);
            cy.findByText("+ Create").click();
        });

        cy.wait(1000);

        // Drag and drop a "text" and "ref" fields.
        cy.get(
            `[data-testid="cms-editor-fields-field-text"]`
        ).drag(`[data-testid="cms-editor-first-field-area"]`, { force: true });
        cy.findByTestId("cms-editor-edit-fields-dialog").within(() => {
            cy.findByLabelText("Label").type("Nickname");
            cy.findByText("Save").click();
        });
        cy.wait(1000);

        cy.get(
            `[data-testid="cms-editor-fields-field-ref"]`
        ).drag(`[data-testid="cms-editor-row-droppable-bottom-0"]`, { force: true });
        cy.findByTestId("cms-editor-edit-fields-dialog").within(() => {
            cy.findByLabelText("Label").type("Book");
            cy.findByLabelText("Content Models").type(newModel1.substr(0, 10));
            cy.wait(1000);
            cy.findByText(newModel1).click();
            cy.findByText("Save").click();
        });

        cy.findByTestId("cms-editor-top-bar").within(() => {
            cy.findByText("Save").click();
        });

        const saveContentModelMsg = `Your content model was saved successfully!`;
        cy.findByText(saveContentModelMsg).should("exist");

        // Great, it works! Let's go back to the list of content models, and try creating content entries.
        cy.findByTestId("cms-editor-back-button").click();
        cy.wait(1000);

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

        // Open new entry form
        cy.findAllByTestId("new-record-button")
            .first()
            .click();
        cy.findByTestId("cms-content-details").within(() => {
            cy.findByLabelText("Title").type(`${newModel1}-1`);
            cy.findByText(/save & publish/i).click();
        });
        cy.findByText("Confirm").click();
        cy.get(".react-spinner-material");
        cy.should("not.exist");
        cy.findByText(/Successfully published revision/i).should("exist");

        // Return to the list of all content models again. Now we first create an author.
        cy.visit("/cms/content-models");
        cy.wait(1000);
        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .within(() => {
                    cy.findByTestId("cms-view-content-model-button").click({
                        force: true
                    });
                });
        });

        cy.findAllByTestId("new-record-button")
            .last()
            .click();
        // Create an author.
        cy.findByTestId("cms-content-details").within(() => {
            cy.findByLabelText("Nickname").type(`${newModel2}-1`);
            cy.findByLabelText("Book").type(`${newModel1.substr(0, 10)}`);
            cy.wait(1000);
            cy.findByText(`${newModel1}-1`).click();
            cy.findByText(/save & publish/i).click();
        });

        cy.findByText("Confirm").click();
        cy.get(".react-spinner-material");
        cy.should("not.exist");
        cy.findByText(/Successfully published revision/i).should("exist");
    });
});
