// This test fails on import. It either times out or is unable to input the ZIP file URL. Invetigation required.

// context("Export & Import Pages", () => {
//     beforeEach(() => cy.login());
//     const pageTitle = "Welcome to Webiny";
//
//     const searchForPage = title => {
//         cy.findByTestId("default-data-list.search").within(() => {
//             cy.findByPlaceholderText(/Search pages/i).type(title);
//         });
//         // Wait for loading
//         cy.findByTestId("default-data-list.loading");
//     };
//
//     const clearSearch = () => {
//         cy.findByTestId("default-data-list.search").within(() => {
//             cy.findByPlaceholderText(/Search pages/i).clear();
//         });
//     };
//
//     it.skip("should be able to export and import a page", () => {
//         cy.visit("/page-builder/pages");
//         searchForPage(pageTitle);
//         // Select page for export
//         cy.findByTestId("default-data-list").within(() => {
//             cy.get(".mdc-deprecated-list-item")
//                 .first()
//                 .within(() => {
//                     cy.findByText(/Welcome to Webiny/i).should("exist");
//                     cy.findByTestId("pages-default-data-list.select-page").click({ force: true });
//                     cy.get(`[type="checkbox"]`).should("exist");
//                     cy.get(`[type="checkbox"]`).check();
//                 });
//         });
//
//         // Initiate page export
//         cy.findByTestId("export-page-button").click();
//
//         // Select revision type
//         cy.findByTestId("export-pages.select-revision-type-dialog").should("be.visible");
//         cy.findByTestId("export-pages.select-revision-type-dialog").within(() => {
//             cy.findByText(/Continue/i).click();
//         });
//         // Initial loading
//         cy.findByTestId("export-pages.initial-dialog").should("be.visible");
//         // Loading with stats
//         cy.findByTestId("export-pages.loading-dialog").should("be.visible");
//         // Export ready
//         cy.findByTestId("export-pages.export-ready-dialog").should("be.visible");
//         // Copy export file URL
//         cy.findByTestId("export-pages.export-ready-dialog").within(() => {
//             cy.findByTestId("export-pages.export-ready-dialog.copy-button").click();
//         });
//         cy.findByText(/Successfully copied!/i).should("be.visible");
//         // Close dialog
//         cy.findByTestId("export-pages.export-ready-dialog").within(() => {
//             cy.findByText(/Close/i).click();
//         });
//         clearSearch();
//
//         // Import page
//         cy.findByTestId("import-page-button").click();
//         // Select category
//         cy.findByTestId("pb-new-page-category-modal").within(() => {
//             cy.findByText("Static").click();
//         });
//         // User input
//         cy.findByTestId("import-pages.input-dialog").within(() => {
//             cy.findByText(/Paste file URL/i).click();
//             // Let's check the copied text
//             // eslint-disable-next-line jest/valid-expect-in-promise
//             cy.window()
//                 .its("navigator.clipboard")
//                 .invoke("readText")
//                 // .should("inc", 'npm install -D cypress')
//                 .then(text => {
//                     cy.findByLabelText("File URL").focus().realClick().type(text);
//                 });
//             cy.findByText(/Continue/i).click();
//         });
//         // Loading
//         cy.findByTestId("import-pages.loading-dialog").should("be.visible");
//         // Verify the result
//         cy.findByTestId("import-pages.loading-dialog").within(() => {
//             cy.findByText("All pages have been imported").should("be.visible");
//             cy.findByText(/Show details/i).click();
//             cy.findByTestId("import-pages-dialog.show-detail-list")
//                 .children()
//                 .should("have.length", 1);
//
//             cy.findByText(/Continue/i).click();
//         });
//
//         // Page should be there
//         searchForPage(pageTitle);
//
//         cy.findByTestId("default-data-list").within(() => {
//             cy.get(".mdc-deprecated-list-item")
//                 .first()
//                 .within(() => {
//                     cy.findByText("Welcome to Webiny").should("exist");
//                     cy.findByText(/Static/i).should("exist");
//                     cy.findByText(/Draft/i).should("exist");
//                     cy.findByText(/(v1)/i).should("exist");
//                     cy.findByTestId("pages-default-data-list.select-page").click({ force: true });
//                 });
//         });
//
//         // Delete the imported page
//         cy.findByTestId("default-data-list").within(() => {
//             cy.get(".mdc-deprecated-list-item")
//                 .first()
//                 .within(() => {
//                     cy.findByTestId("pages-default-data-list.select-page").click({ force: true });
//                 });
//         });
//         cy.findByTestId("pb-page-details-header-delete-button").click();
//         cy.findByTestId("pb-page-details-header-delete-dialog").within(() => {
//             cy.findByText(/Confirm/i).click();
//         });
//         cy.findByTestId("default-data-list").within(() => {
//             cy.get(".mdc-deprecated-list-item")
//                 .first()
//                 .within(() => {
//                     cy.findByText(/Draft/i).should("not.exist");
//                 });
//         });
//     });
// });
