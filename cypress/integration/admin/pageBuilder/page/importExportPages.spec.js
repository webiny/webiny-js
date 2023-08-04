// We need this to grant Cypress access to the clipboard.
Cypress.automation("remote:debugger:protocol", {
    command: "Browser.grantPermissions",
    params: {
        permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"],
        origin: window.location.origin
    }
});

context("Export & Import Pages", () => {
    beforeEach(() => cy.login());

    describe("When exporting and importing page", () => {
        const pageTitle1 = `Test published page 1`;

        afterEach(() => {
            cy.pbDeleteSpecificPage(pageTitle1);
        });

        const searchForPage = title => {
            cy.findByTestId("default-data-list.search").within(() => {
                cy.findByPlaceholderText(/Search.../i).type(title);
            });
        };

        const clearSearch = () => {
            cy.findByTestId("default-data-list.search").within(() => {
                cy.findByPlaceholderText(/Search.../i).clear({ force: true });
            });
        };

        it("should be able to export and import a page", () => {
            cy.visit("/page-builder/pages");

            // Button is hidden so we need to force click it.
            cy.findByTestId("new-page-button").click({ force: true });
            // Redirects us to the Page Builder Editor page (route "/page-builder/editor/").
            cy.findByTestId("create-blank-page-button").click();
            // Check if we got redirected to the Page Builder Editor (route "/page-builder/editor/").
            cy.url().should("includes", "/page-builder/editor/");

            // Editing title for the page.
            cy.findByTestId("pb-editor-page-title").click();
            cy.get(`input[value="Untitled"]`).clear().type(pageTitle1).blur();
            cy.findByText("Page title updated successfully!");

            // Publishing newly create page.
            cy.findByTestId("pb.editor.header.publish.button").click();

            // Confirming that we want to publish the page.
            cy.findByTestId("pb-editor-publish-confirmation-dialog").within(() => {
                cy.findByTestId("confirmationdialog-confirm-action").click();
            });

            // We should be able to see it in case page was published successfully,
            // and we also should be redirected to the "/page-builder/pages" route.
            cy.findByText("Your page was published successfully!");

            searchForPage(pageTitle1);
            // Select first page in the list for the export
            cy.findAllByTestId("datatable-row")
                .first()
                .within(() => {
                    cy.findByText(pageTitle1).should("exist");
                    cy.get(`input[type="checkbox"]`).check();
                });

            // Initiate page export
            cy.findByTestId("default-data-list.export").click();

            // Select revision type
            cy.findByTestId("export-pages.select-revision-type-dialog").should("be.visible");
            cy.findByTestId("export-pages.select-revision-type-dialog").within(() => {
                cy.findByText(/Continue/i).click({ force: true });
            });
            // Initial loading
            cy.findByTestId("export-pages.initial-dialog").should("be.visible");
            // Loading with stats
            cy.findByTestId("export-pages.loading-dialog").should("be.visible");
            // Export ready
            cy.findByTestId("export-pages.export-ready-dialog").should("be.visible");
            // Copy export file URL
            cy.findByTestId("export-pages.export-ready-dialog").within(() => {
                cy.findByTestId("export-pages.export-ready-dialog.copy-button").click({
                    force: true
                });
            });
            cy.findByText(/Successfully copied!/i).should("be.visible");
            // Close dialog
            cy.findByTestId("export-pages.export-ready-dialog").within(() => {
                cy.findByText(/Close/i).click({ force: true });
            });
            clearSearch();

            // Import page
            cy.findByTestId("default-data-list.import").click();
            // Select category
            cy.findByTestId("pb-new-page-category-modal").within(() => {
                cy.findByText("Static").click();
            });
            // User input
            cy.findByTestId("import-pages.input-dialog").within(() => {
                cy.findByText(/Paste file URL/i).click({ force: true });
                // Let's check the copied text
                // eslint-disable-next-line jest/valid-expect-in-promise
                cy.window()
                    .its("navigator.clipboard")
                    .invoke("readText")
                    .then(text => {
                        cy.findByTestId("import-pages.input-dialog.input-url")
                            .focus()
                            .click({ force: true })
                            .type(text);
                    });
                cy.findByText(/Continue/i).click({ force: true });
            });
            // Loading
            cy.findByTestId("import-pages.loading-dialog").should("be.visible");
            // Verify the result
            cy.findByTestId("import-pages.loading-dialog").within(() => {
                cy.findByText("All pages have been imported").should("be.visible");
                cy.findByText(/Show details/i).click();
                cy.findByTestId("import-pages-dialog.show-detail-list")
                    .children()
                    .should("have.length", 1);

                cy.findByText(/Continue/i).click({ force: true });
            });

            // Page should be there
            searchForPage(pageTitle1);
        });
    });
});
