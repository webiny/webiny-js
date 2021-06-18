context("I18N app", () => {
    beforeEach(() => cy.login());

    it("should create a locale, select, unselect and immediately delete everything", () => {
        const newCode = "de-DE";

        cy.visit("/i18n/locales");
        // Create new locale
        cy.findAllByTestId("new-record-button")
            .first()
            .click();

        cy.findByLabelText("Code").type(newCode);
        cy.wait(1000);
        cy.findByText(newCode).click();
        cy.findByText(/Save/i).click();
        cy.wait(1000);
        // Confirm that "Default locale" is selected
        cy.findByTestId("app-i18n-content.menu").within(() => {
            cy.findByText(/Locale:/i).should("exist");
            cy.findByText(/en-US/i).should("exist");
        });
        // Select newly created locale from selector
        cy.findByTestId("app-i18n-content.menu").click();
        cy.findAllByTestId(`app-i18n-content.menu-item.de-DE`).should("exist");
        cy.findAllByTestId(`app-i18n-content.menu-item.de-DE`).click();
        cy.wait(1000);
        // Confirm that "new locale" is selected
        cy.findByTestId("app-i18n-content.menu").within(() => {
            cy.findByText(/Locale:/i).should("exist");
            cy.findByText(/de-DE/i).should("exist");
        });
        // Switch back to the "Default locale"
        cy.findByTestId("app-i18n-content.menu").click();
        cy.findAllByTestId(`app-i18n-content.menu-item.en-US`).click();
        cy.wait(1000);
        // Delete new locale
        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .within(() => {
                    cy.findByTestId("default-data-list.delete").click({ force: true });
                });
        });
        cy.findByTestId("default-data-list.delete-dialog").within(() => {
            cy.findByText(/Confirmation/i);
            cy.findByText(/confirm$/i).click();
        });
        // Locale shouldn't be in the list
        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .within(() => {
                    cy.findByText(newCode).should("not.exist");
                });
        });
    });

    it(`should able to update an existing locale as "default" and immediately restore defaults`, () => {
        const newCode = "de-DE";
        cy.visit("/i18n/locales");
        // Create new locale
        cy.findAllByTestId("new-record-button")
            .first()
            .click();
        cy.findByLabelText("Code").type(newCode);
        // cy.wait(1000);
        cy.findByText(newCode).click();
        cy.findByText(/Save/i).click();
        // cy.wait(1000);
        // Check newly created locale in selector
        cy.findByTestId("app-i18n-content.menu").click();
        cy.findAllByTestId(`app-i18n-content.menu-item.${newCode}`).should("exist");
        // Set it as "Default locale"
        cy.findByLabelText("Default").check();
        cy.findByText(/Save locale/i).click();
        // Wait for loading to complete
        cy.get(".react-spinner-material").should("not.exist");
        // Check the change in data list
        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()

                .within(() => {
                    cy.findByText(newCode);
                    cy.findByText("Default locale");
                });
        });

        /**
         * Restore defaults
         */

        // Select "en-US" locale
        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .next()
                .within(() => {
                    cy.findByText(/en-US/i).click();
                });
        });
        // Wait for loading to complete
        cy.get(".react-spinner-material").should("not.exist");
        // Update it as "default"
        cy.findByLabelText("Default").check();
        cy.findByText(/Save locale/i).click();
        // Wait for loading to complete
        cy.get(".react-spinner-material").should("not.exist");

        // Deleting new locale
        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .within(() => {
                    cy.findByTestId("default-data-list.delete").click({ force: true });
                });
        });
        cy.findByTestId("default-data-list.delete-dialog").within(() => {
            cy.findByText(/Confirmation/i);
            cy.findByText(/confirm$/i).click();
        });
        // Locale shouldn't be in the list
        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .within(() => {
                    cy.findByText(newCode).should("not.exist");
                    cy.findByText(/en-US/i).should("exist");
                    cy.findByText("Default locale").should("exist");
                });
        });
    });
});
