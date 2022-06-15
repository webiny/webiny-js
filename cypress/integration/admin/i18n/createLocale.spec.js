context("I18N app", () => {
    beforeEach(() => cy.login());

    it("should create a locale, select, unselect and immediately delete everything", () => {
        const newCode = "de-DE";

        cy.visit("/i18n/locales");
        // Create new locale
        cy.findAllByTestId("new-record-button").first().click();

        cy.findByTestId("l18n.locale.code").focus().type(newCode);
        /**
         * Testing "Autocomplete" component is tricky.
         * We're making sure option exist before triggering a click because;
         * sometimes the option item gets detached from the DOM due to re-render.
         *
         * Read more about it: https://www.cypress.io/blog/2020/07/22/do-not-get-too-detached/#investigation
         */
        cy.get("[role='listbox'] > [role='option']").within(() => {
            cy.findByText(newCode).as("code").should("exist");
        })
        cy.get("@code").click();

        cy.findByTestId("l18n.locale.save").click();
        // Loading should be completed
        cy.get(".react-spinner-material").should("not.exist");
        // Confirm that "Default locale" is selected
        cy.findByTestId("app-i18n-content.menu").within(() => {
            cy.findByText(/Locale:/i).should("exist");
            cy.findByText(/en-US/i).should("exist");
        });
        // Select newly created locale from selector
        cy.findByTestId("app-i18n-content.menu").click();
        cy.findByTestId(`app-i18n-content.menu-item.${newCode}`).should("exist");
        cy.findByTestId(`app-i18n-content.menu-item.${newCode}`).click();
        // Loading should be completed
        cy.get(".react-spinner-material").should("not.exist");
        // Confirm that "new locale" is selected
        cy.findByTestId("app-i18n-content.menu").within(() => {
            cy.findByText(/Locale:/i).should("exist");
            cy.findByText(/de-DE/i).should("exist");
        });
        // Switch back to the "Default locale"
        cy.findByTestId("app-i18n-content.menu").click();
        cy.findByTestId(`app-i18n-content.menu-item.${newCode}`).click();
        // Loading should be completed
        cy.get(".react-spinner-material").should("not.exist");
        // Delete new locale
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByTestId("default-data-list.delete").click({ force: true });
                });
        });
        cy.findByTestId("default-data-list.delete-dialog").within(() => {
            cy.findByText(/Confirmation/i);
            cy.findByTestId("dialog-accept").next().click();
        });
        // Locale shouldn't be in the list
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
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
        cy.findAllByTestId("new-record-button").first().click();

        const formContainer = cy.get("webiny-form-container");

        formContainer.within(() => {
            cy.findByTestId("l18n.locale.code").type(newCode);
            /**
             * Testing "Autocomplete" component is tricky.
             * We're making sure option exist before triggering a click because
             * sometimes the option item gets detached from the DOM due to re-render.
             *
             * Read more about it: https://www.cypress.io/blog/2020/07/22/do-not-get-too-detached/#investigation
             */
            cy.findByText(newCode).as("code").should("exist");
            cy.get("@code").click();
        });

        cy.findByTestId("l18n.locale.save").click();
        // Loading should be completed
        cy.get(".react-spinner-material").should("not.exist");
        // Check newly created locale in selector
        cy.findByTestId("app-i18n-content.menu").click();
        cy.findAllByTestId(`app-i18n-content.menu-item.${newCode}`).should("exist");
        // Set it as "Default locale"
        cy.findByLabelText("Default").check();
        cy.findByTestId("l18n.locale.save").click();
        // Wait for loading to complete
        cy.get(".react-spinner-material").should("not.exist");
        // Check the change in data list
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
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
            cy.get("li")
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
        cy.findByTestId("l18n.locale.save").click();
        // Wait for loading to complete
        cy.get(".react-spinner-material").should("not.exist");

        // Deleting new locale
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByTestId("default-data-list.delete").click({ force: true });
                });
        });
        cy.findByTestId("default-data-list.delete-dialog").within(() => {
            cy.findByText(/Confirmation/i);
            cy.findByTestId("dialog-accept").next().click();
        });
        // Locale shouldn't be in the list
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(newCode).should("not.exist");
                    cy.findByText(/en-US/i).should("exist");
                    cy.findByText("Default locale").should("exist");
                });
        });
    });
});
