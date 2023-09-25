import uniqid from "uniqid";

context(
    "Should be able to publish and re-publish a page, and see changes on the public site",
    () => {
        let id;
        const pageTitle1 = `Test published page 1`;
        const pageTitle2 = `Test published page 2`;

        beforeEach(() => {
            id = uniqid();
            cy.login();
            cy.pbDeleteAllPages();
            cy.pbCreatePage({ category: "static" }).then(page => {
                cy.pbUpdatePage({
                    id: page.id,
                    data: {
                        category: "static",
                        path: `/page-${id}`,
                        title: pageTitle1
                    }
                });
                cy.pbPublishPage({ id: page.id });
            });
        });

        describe("When Publishing new page", () => {
            it("Step 1: Check page title in preview", () => {
                cy.visit("/page-builder/pages");

                // Check title on the page preview drawer.
                cy.findByText(`${pageTitle1}`, { timeout: 15000 }).click({ force: true });
                // Check whether we opened a page preview drawer.
                cy.url().should("include", "&id");
                // Checking if title is correct.
                cy.findByTestId("page-details-page-title").contains(`${pageTitle1}`);
                // As we don't have a button to close page preview drawer,
                // we need to simulate click outside of the drawer to close it.
                cy.get("body").click("topLeft");
                // Check if we closed page preview drawer.
                cy.url().should("not.contain", "&id");
            });
            it(`Step 2: Check published public page with title ${pageTitle1}`, () => {
                cy.visit("/page-builder/pages");

                cy.findByText(`${pageTitle1}`, { timeout: 15000 }).click({ force: true });

                cy.findByTestId("pb-page-details-header-page-options-menu").click();
                // Open preview of the page.
                cy.findByTestId("pb-page-details-header-page-options-menu-preview").click();
                /*
                    As we run into CORS when we are trying to open a public page with cy.visit(),
                    we can open it in other way. When we open public page we get redirected to a new tab in the browser,
                    so we can actually get access to that new tab with cypress as we do below.

                    But still we are going to run into CORS, so to fix that we can use one of the suggested work arounds,
                    from the Cypress docs https://docs.cypress.io/guides/guides/web-security#Common-Workarounds.
                    But in our case none of the suggested work arounds work, so as last resort we have to use "chromeWebSecurity" to make it work,
                    https://docs.cypress.io/guides/guides/web-security#Disabling-Web-Security.
                */
                cy.window().then(previewTab => {
                    // Check the title of the published page.
                    cy.title().should("contain", pageTitle1);

                    // Close public page.
                    previewTab.close();
                });
            });
            it("Step 3: Update page title, re-publish page, and check page title in the preview", () => {
                cy.visit("/page-builder/pages");

                // Should open page preview drawer.
                cy.findByText(`${pageTitle1}`, { timeout: 15000 }).click({ force: true });
                // Should open "/page-builder/editor/" route.
                cy.findByTestId("pb-page-details-header-edit-revision").click();
                // Check if we got redirected to the Page Builder Editor (route "/page-builder/editor/").
                cy.url().should("includes", "/page-builder/editor");

                // Editing title for the page.
                cy.findByTestId("pb-editor-page-title").click();
                cy.get(`input[value="${pageTitle1}"]`).clear().type(pageTitle2).blur();
                cy.findByText("Page title updated successfully!");

                // Publishing newly created page.
                cy.findByTestId("pb.editor.header.publish.button").click();

                // Confirming that we want to publish the page.
                cy.findByTestId("pb-editor-publish-confirmation-dialog").within(() => {
                    cy.findByTestId("confirmationdialog-confirm-action").click();
                });

                // We should be able to see it in case page was published successfully,
                // and we also should be redirected to the "/page-builder/pages" route.
                cy.findByText("Your page was published successfully!");

                // Check title on the page preview drawer.
                cy.findByText(`${pageTitle2}`, { timeout: 15000 }).click({ force: true });
                // Check whether we oppened a page preview drawer.
                cy.url().should("include", "&id");
                // Checking if title is correct.
                cy.findByTestId("page-details-page-title").contains(`${pageTitle2}`);

                // As we don't have a button to close page preview drawer,
                // we need to simulate click outside of the drawer to close it.
                cy.get("body").click("topLeft");
                // Check if we closed page preview drawer.
                cy.url().should("not.contain", "&id");
            });
            it(`Step 4: Check published public page with title ${pageTitle2} and delete it`, () => {
                cy.visit("/page-builder/pages");

                cy.findByText(`${pageTitle2}`, { timeout: 15000 }).click({ force: true });

                cy.findByTestId("pb-page-details-header-page-options-menu").click();
                // Open preview of the page.
                cy.findByTestId("pb-page-details-header-page-options-menu-preview").click();
                /*
                    We need this work around because after we click on preview we get an error that says,
                    "Public website URL is missing." even though it exists. And because of that error cypress cannot open,
                    the public website. So to fix that we need to click on the Cancel button that is located in that modal,
                    and after that we should reopen public website.
                    P.S. the error "Public website URL is missing." only occures in this 4 test step, in the second one it works as expected.
                */
                cy.findByText("Retry").should("exist").prev().click({ force: true });
                cy.findByTestId("pb-page-details-header-page-options-menu").click();
                // Open preview of the page.
                cy.findByTestId("pb-page-details-header-page-options-menu-preview").click();
                // Check title on the public site.
                cy.window().then(previewTab => {
                    // Check the title of the published page.
                    cy.title().should("contain", pageTitle2);
                    // Close public page.
                    previewTab.close();
                });

                cy.visit("/page-builder/pages");
                // Delete the page.
                cy.findByText(`${pageTitle2}`, { timeout: 15000 }).click({ force: true });
                cy.findByTestId("pb-page-details-header-delete-button").click();
                cy.findByTestId("pb-page-details-header-delete-dialog").within(() => {
                    cy.findByTestId("confirmationdialog-confirm-action").click();
                });
                cy.findByText(`${pageTitle2}`, { timeout: 15000 }).should("not.exist");
            });
        });
    }
);
