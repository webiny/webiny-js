import uniqid from "uniqid";

const selectPermission = (name, accessLevel) => {
    cy.findByTestId(name)
        .click()
        .parent()
        .within(() => {
            cy.get("select").first().select(accessLevel);
        });
};

const deleteRole = slug => {
    cy.findByTestId("default-data-list").within(() => {
        cy.get(".mdc-deprecated-list-item")
            .first()
            .within(() => {
                // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
                // Now targeting <button> directly. Revert to `.findByTestId("default-data-list.delete")` if issue is fixed.
                cy.get('button[data-testid="default-data-list.delete"]').click({ force: true });
            });
    });

    cy.findByTestId("default-data-list.delete-dialog").within(() => {
        cy.findAllByTestId("dialog-accept").next().click();
    });
    cy.findByText(`Role "${slug}" deleted.`).should("exist");
};

context("Security -> Role", () => {
    beforeEach(() => {
        cy.login();
    });

    it("should create, update and delete role", () => {
        cy.visit(`/access-management/roles`);

        // Create a role
        const [name, slug, description] = [
            uniqid("name-"),
            uniqid("slug-"),
            uniqid("description-")
        ];

        // Open role details form
        cy.findAllByTestId("new-record-button").first().click();
        // Add role's detail
        cy.findByTestId("admin.am.group.new.name").type(name);
        cy.findByTestId("admin.am.group.new.slug").type(slug);
        cy.findByTestId("admin.am.group.new.description").type(description);

        cy.findByLabelText(/All locales/i).check();

        // Save details
        cy.findByTestId("admin.am.group.new.save").click();
        // Wait for loading to finish
        cy.get(".react-spinner-material").should("not.exist");
        // Verify success message
        cy.findByText("Role saved successfully!").should("exist");

        // Update role

        const [newName, newDescription] = [uniqid("new-name-"), uniqid("new-description-")];

        cy.findByTestId("admin.am.group.new.name").should("have.value", name);
        // Add role's detail
        cy.findByTestId("admin.am.group.new.name").clear().type(newName);
        cy.findByTestId("admin.am.group.new.description").clear().type(newDescription);
        // Update permissions
        cy.findByTestId("permission.fm").click();

        cy.findByTestId("permission.fm")
            .parent()
            .within(() => {
                cy.get("select").first().select("full");
            });

        // Save details
        cy.findByTestId("admin.am.group.new.save").click();
        // Wait for loading to finish
        cy.get(".react-spinner-material").should("not.exist");
        // Verify success message
        cy.findByText("Role saved successfully!").should("exist");
        // Updated role should be in list
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(newName).should("exist");
        });

        // Delete fist role from the list
        deleteRole(slug);
    });

    it("should create role with all permissions, verify and delete it", () => {
        cy.visit(`/access-management/roles`);

        // Create a role
        const [name, slug, description] = [
            uniqid("name-"),
            uniqid("slug-"),
            uniqid("description-")
        ];

        // Open role details form
        cy.findAllByTestId("new-record-button").first().click();
        // Add role's detail
        cy.findByTestId("admin.am.group.new.name").type(name);
        cy.findByTestId("admin.am.group.new.slug").type(slug);
        cy.findByTestId("admin.am.group.new.description").type(description);
        cy.findByLabelText(/All locales/i).check();

        // Add all permissions
        selectPermission("permission.fm", "full");
        selectPermission("permission.fb", "full");
        selectPermission("permission.cms", "full");
        selectPermission("permission.pb", "full");
        selectPermission("permission.security", "full");
        selectPermission("permission.i18n", "full");

        // Save details
        cy.findByTestId("admin.am.group.new.save").click();
        // Wait for loading to finish
        cy.get(".react-spinner-material").should("not.exist");
        // Verify success message
        cy.findByText("Role saved successfully!").should("exist");

        // Verify role permissions
        // eslint-disable-next-line jest/valid-expect-in-promise
        cy.securityReadRole({ slug }).then(group => {
            // eslint-disable-next-line jest/valid-expect
            expect(group.permissions).to.deep.eq([
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
        // Group should be in list
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(name).should("exist");
        });

        // Delete first group from the list
        deleteRole(slug);
    });
});
