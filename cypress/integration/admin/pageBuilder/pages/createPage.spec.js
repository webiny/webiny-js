import uniqid from "uniqid";

context("Pages Creation", () => {
    beforeEach(() => cy.login());

    it("should be able to create, publish, create new revision, and immediately delete everything", () => {
        const newPageTitle = `Test page ${uniqid()}`;

        cy.visit("/page-builder/pages")
            .findByTestId("new-record-button")
            .click()
            .findByTestId("pb-new-page-category-modal")
            .within(() => {
                cy.findByText("Static").click();
            })
            .findByTestId("pb-editor-page-title")
            .click()
            .get(`input[value="Untitled"]`)
            .clear()
            .type(newPageTitle)
            .findByText("Publish")
            .click()
            .wait(1000);

        cy.findByTestId("pb-editor-publish-confirmation-dialog").within(() => {
            cy.findByText(/Confirm/i).click();
        });

        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .within(() => {
                    cy.findByText(newPageTitle)
                        .should("exist")
                        .findByText(/Static/i)
                        .should("exist")
                        .findByText(/Published/i)
                        .should("exist")
                        .findByText(/(v1)/i)
                        .should("exist");
                });
        });

        cy.findByTestId("pb-page-details").within(() => {
            cy.findByTestId("pb-page-details-header-edit-revision").click();
        });

        cy.findByTestId("pb-editor-back-button").click();
        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .within(() => {
                    cy.findByText(newPageTitle)
                        .should("exist")
                        .findByText(/Static/i)
                        .should("exist")
                        .findByText(/Draft/i)
                        .should("exist")
                        .findByText(/(v2)/i)
                        .should("exist");
                });
        });
    });
});
