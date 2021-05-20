import uniqid from "uniqid";

context("Headless CMS - Content Model Group", () => {
    beforeEach(() => cy.login());

    it("should able to create, update and delete Content Model Group", () => {
        cy.visit("/cms/content-model-groups");
        const newGroup = `Group ${uniqid()}`;
        const newGroup2 = `Group-2 ${uniqid()}`;
        // Create a new group
        cy.findAllByTestId("new-record-button")
            .first()
            .click();
        cy.findByLabelText("Name").type(newGroup);
        cy.findByLabelText("Description").type(
            `Trying to create a new Content Model Group: ${newGroup}`
        );
        cy.wait(500);
        cy.findByText(/Save content model group/i).click();
        cy.wait(1000);

        // Check newly created group in list
        cy.findByTestId("default-data-list").within(() => {
            cy.get("div").within(() => {
                cy.findByText(newGroup).should("exist");
            });
        });

        // Update groups' name
        cy.findByLabelText("Name")
            .clear()
            .type(newGroup2);
        cy.wait(500);
        cy.findByText(/Save content model group/i).click();
        cy.wait(1000);
        // Check if the updated group is present in the list
        cy.findByTestId("default-data-list").within(() => {
            cy.get("div").within(() => {
                cy.findByText(newGroup2).should("exist");
                // Initiate delete
                cy.findByTestId("cms.contentModelGroup.list-item.delete").click({ force: true });
            });
        });

        // Delete the newly created group
        cy.findByTestId("cms.contentModelGroup.list-item.delete-dialog").within(() => {
            cy.findByText(/Confirmation/i).should("exist");
            cy.findByText(/confirm$/i).click();
            cy.wait(500);
        });
        // Group should not present in the list
        cy.findByTestId("default-data-list").within(() => {
            cy.get("div").within(() => {
                cy.findByText(newGroup).should("not.exist");
            });
        });
    });
});
