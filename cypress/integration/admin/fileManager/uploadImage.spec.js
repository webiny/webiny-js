context("File Manager View - CRUD", () => {
    beforeEach(() => {
        cy.login();
        cy.visit("/");
        // Open drawer
        cy.findByTestId("apps-menu").click();
        // Open "File Manage" view
        cy.findByTestId("admin-drawer-footer-menu-file-manager").click();
    });

    it("should upload, edit and delete image", () => {
        // Drop file
        cy.findByTestId("fm-list-wrapper").dropFile("sample.jpeg", "image/jpeg");
        cy.findByText("File upload complete.").should("exist");
        // Open file details
        cy.findByTestId("fm-list-wrapper").within(() => {
            cy.findAllByTestId("fm-list-wrapper-file")
                .first()
                .within(() => {
                    cy.findByTestId("fm-file-wrapper-file-info-icon").click({ force: true });
                });
        });

        // Assert the aside file details is displayed.
        cy.findByTestId("fm.file-details.drawer").should('be.visible');
        cy.findByTestId("fm.file-details.drawer").find('img').should('be.visible');
        cy.get('span').contains('File details').should('be.visible');

        // Edit file
        cy.findByTestId("fm-edit-image-button").click();
        cy.findByTestId("fm-image-editor-dialog")
            .should("be.visible")
            .within(() => {
                cy.findByText("Cancel").click();
            });
        // Delete file
        cy.findByTestId("fm-delete-file-button").click();
        cy.findByTestId("fm-delete-file-confirmation-dialog").within(() => {
            cy.findByText("Confirm").click();
        });
        cy.findByText("File deleted successfully.");
    });
});
