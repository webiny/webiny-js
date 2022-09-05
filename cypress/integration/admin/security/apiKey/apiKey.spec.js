import uniqid from "uniqid";

const selectPermission = (name, accessLevel) => {
    cy.findByTestId(name)
        .click()
        .parent()
        .within(() => {
            cy.get("select").first().select(accessLevel);
        });
};

const deleteEntry = () => {
    cy.findByTestId("default-data-list").within(() => {
        cy.get(".mdc-list-item")
            .first()
            .within(() => {
                cy.findByTestId("default-data-list.delete").click({ force: true });
            });
    });

    cy.findByTestId("default-data-list.delete-dialog").within(() => {
        cy.findAllByTestId("dialog-accept").next().click();
    });
    cy.findByText(/API\skey\s.*\sdeleted./i).should("exist");
};

context("Security -> API Key", () => {
    beforeEach(() => {
        cy.login();
    });

    it("should create, update and delete API Key", () => {
        cy.visit(`/access-management/api-keys`);

        // Create a API key
        const [name, description] = [uniqid("name-"), uniqid("description-")];

        // Open API key details form
        cy.findAllByTestId("new-record-button").first().click();
        // Add API key's detail
        cy.findByTestId("sam.key.new.form.name").type(name);
        cy.findByTestId("sam.key.new.form.description").type(description);

        cy.findByLabelText(/All locales/i).check();

        // Save details
        cy.findByTestId("sam.key.new.form.button.save").click();
        // Wait for loading to finish
        cy.get(".react-spinner-material").should("not.exist");
        // Verify success message
        cy.findByText("API key saved successfully.").should("exist");

        // Update API key

        const [newName, newDescription] = [uniqid("new-name-"), uniqid("new-description-")];
        cy.findByTestId("sam.key.new.form.name").should("have.value", name);
        // Add API key's detail
        cy.findByTestId("sam.key.new.form.name").clear().type(newName);
        cy.findByTestId("sam.key.new.form.description").clear().type(newDescription);
        // Update permissions
        selectPermission("permission.fm", "full");
        // Save details
        cy.findByTestId("sam.key.new.form.button.save").click();
        // Wait for loading to finish
        cy.get(".react-spinner-material").should("not.exist");
        // Verify success message
        cy.findByText("API key saved successfully.").should("exist");
        // Updated API key should be in list
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(newName).should("exist");
        });

        // Delete fist entry from the list
        deleteEntry();
    });

    it("should create API key with all permissions, verify and delete it", () => {
        cy.visit(`/access-management/api-keys`);

        // Create a API key
        const [name, description] = [uniqid("name-"), uniqid("description-")];

        // Open API key details form
        cy.findAllByTestId("new-record-button").first().click();
        // Add API key's detail
        cy.findByTestId("sam.key.new.form.name").type(name);
        cy.findByTestId("sam.key.new.form.description").type(description);
        cy.findByLabelText(/All locales/i).check();

        // Add all permissions
        selectPermission("permission.fm", "full");
        selectPermission("permission.fb", "full");
        selectPermission("permission.cms", "full");
        selectPermission("permission.pb", "full");
        selectPermission("permission.security", "full");
        selectPermission("permission.i18n", "full");

        // Save details
        cy.findByTestId("sam.key.new.form.button.save").click();
        // Wait for loading to finish
        cy.get(".react-spinner-material").should("not.exist");
        // Verify success message
        cy.findByText("API key saved successfully.").should("exist");

        // eslint-disable-next-line jest/valid-expect-in-promise
        cy.location("search").then(search => {
            const searchParams = new URLSearchParams(search);
            const id = searchParams.get("id");
            // Verify API key permissions
            // eslint-disable-next-line jest/valid-expect-in-promise
            cy.securityReadApiKey({ id }).then(({ permissions }) => {
                // eslint-disable-next-line jest/valid-expect
                expect(permissions).to.deep.eq([
                    {
                        name: "content.i18n"
                    },
                    {
                        name: "fm.*"
                    },
                    {
                        name: "fb.*"
                    },
                    {
                        name: "cms.*"
                    },
                    {
                        name: "pb.*"
                    },
                    {
                        name: "security.*"
                    },
                    {
                        name: "i18n.*"
                    }
                ]);
            });
            // Entry should be in list
            cy.findByTestId("default-data-list").within(() => {
                cy.findByText(name).should("exist");
            });

            // Delete first entry from the list
            deleteEntry();
        });
    });
});
