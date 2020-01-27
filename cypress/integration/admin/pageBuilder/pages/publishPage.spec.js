import uniqid from "uniqid";

context("Pages Creation", () => {
    beforeEach(() => cy.login());

    it("should be able to publish and re-publish a page, and see changes on the public site", () => {
        const pageTitle1 = `Test page ${uniqid()}`;
        const pageTitle2 = `Test page ${uniqid()}`;

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
            .type(pageTitle1)
            .findByText("Publish")
            .click()
            .wait(1000);

        cy.findByTestId("pb-editor-publish-confirmation-dialog").within(() => {
            cy.findByText(/Confirm/i).click();
        });

        cy.findByTestId("pb-page-details").within(() => {
            cy.findByTestId("pb-page-details-header-page-options-menu").click();
        });
        cy.findByTestId("pb-page-details-header-page-options-menu-preview").click();

        cy.title().should("contain", pageTitle1);

        cy.visit("/page-builder/pages");

        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .click();
        });

        cy.findByTestId("pb-page-details")
            .within(() => {
                cy.findByTestId("pb-page-details-header-edit-revision").click();
            })
            .findByTestId("pb-editor-page-title")
            .click()
            .get(`input[value="${pageTitle1}"]`)
            .clear()
            .type(pageTitle2)
            .findByText("Publish changes")
            .click()
            .wait(1000);

        cy.findByTestId("pb-editor-publish-confirmation-dialog").within(() => {
            cy.findByText(/Confirm/i).click();
        });

        // Let's wait a bit for the CDN cache to be flushed.
        cy.wait(30000);

        cy.findByTestId("pb-page-details").within(() => {
            cy.findByTestId("pb-page-details-header-page-options-menu").click();
        });
        cy.findByTestId("pb-page-details-header-page-options-menu-preview").click();

        cy.title().should("contain", pageTitle2);
    });
});
