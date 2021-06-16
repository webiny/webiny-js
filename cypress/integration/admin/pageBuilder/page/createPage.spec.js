import uniqid from "uniqid";

context("Pages Creation", () => {
    beforeEach(() => cy.login());

    it("should be able to create, publish, create new revision, and immediately delete everything", () => {
        const newPageTitle = `Test page ${uniqid()}`;

        cy.visit("/page-builder/pages");
        cy.findAllByTestId("new-record-button")
            .first()
            .click();

        cy.findByTestId("pb-new-page-category-modal").within(() => {
            cy.findByText("Static").click();
        });
        cy.findByTestId("pb-editor-page-title").click();
        cy.get(`input[value="Untitled"]`)
            .clear()
            .type(newPageTitle)
            .blur();
        cy.findByText("Page title updated successfully!");

        cy.findByText("Publish").click();

        cy.findByTestId("pb-editor-publish-confirmation-dialog").within(() => {
            cy.findByText(/Confirm/i).click();
        });
        /*
         * We're doing this check just to wait for ES indexing.
         * */
        cy.waitUntil(
            () =>
                cy.pbListPages({ limit: 1, search: { query: newPageTitle } }).then(([page]) => {
                    const { status } = page;
                    return status === "published";
                }),
            {
                description: `wait until page entry in updated in ES`
            }
        );
        // Wait till the "/pages" route
        cy.findAllByTestId("new-record-button")
            .first()
            .should("exist");
        // We're reloading the page due to ES index delay and lack of apollo cache for "ListPages" query
        cy.reload();

        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .within(() => {
                    cy.findByText(newPageTitle).should("exist");
                    cy.findByText(/Static/i).should("exist");
                    cy.findByText(/Published/i).should("exist");
                    cy.findByText(/(v1)/i).should("exist");
                });
        });

        cy.findByTestId("pb-page-details").within(() => {
            cy.findByTestId("pb-page-details-header-edit-revision").click();
        });

        cy.findByTestId("pb-editor-back-button").click();
        /*
         * We're doing this check just to wait for ES indexing.
         * */
        cy.waitUntil(
            () =>
                cy.pbListPages({ limit: 1, search: { query: newPageTitle } }).then(([page]) => {
                    const { status } = page;
                    return status === "draft";
                }),
            {
                description: `wait until page entry in updated in ES`
            }
        );
        // Wait till the "/pages" route
        cy.findAllByTestId("new-record-button")
            .first()
            .should("exist");
        // We're reloading the page due to ES index delay and lack of apollo cache for "ListPages" query
        cy.reload();

        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .within(() => {
                    cy.findByText(newPageTitle).should("exist");
                    cy.findByText(/Static/i).should("exist");
                    cy.findByText(/Draft/i).should("exist");
                    cy.findByText(/(v2)/i).should("exist");
                });
        });

        // Delete page
        cy.findByTestId("pb-page-details-header-delete-button").click();
        cy.findByTestId("pb-page-details-header-delete-dialog").within(() => {
            cy.findByText(/Confirm/i).click();
        });
        cy.wait(2000);
        // We're reloading the page due to ES index delay and lack of apollo cache for "ListPages" query
        cy.reload();
        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .within(() => {
                    cy.findByText(newPageTitle).should("not.exist");
                });
        });
    });
});
