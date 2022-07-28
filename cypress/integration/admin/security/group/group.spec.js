import uniqid from "uniqid";

const selectPermission = (name, accessLevel) => {
    cy.findByTestId(name)
        .click()
        .parent()
        .within(() => {
            cy.get("select").first().select(accessLevel);
        });
};

const deleteGroup = slug => {
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
    cy.findByText(`Group "${slug}" deleted.`).should("exist");
};

context("Security -> Group", () => {
    beforeEach(() => {
        cy.login();
    });

    it("should create, update and delete group", () => {
        cy.visit(`/access-management/groups`);

        // Create a group
        const [name, slug, description] = [
            uniqid("name-"),
            uniqid("slug-"),
            uniqid("description-")
        ];

        // Open group details form
        cy.findAllByTestId("new-record-button").first().click();
        // Add group's detail
        cy.findByTestId("admin.am.group.new.name").type(name);
        cy.findByTestId("admin.am.group.new.slug").type(slug);
        cy.findByTestId("admin.am.group.new.description").type(description);

        cy.findByLabelText(/All locales/i).check();

        // Save details
        cy.findByTestId("admin.am.group.new.save").click();
        // Wait for loading to finish
        cy.get(".react-spinner-material").should("not.exist");
        // Verify success message
        cy.findByText("Group saved successfully!").should("exist");

        // Update group

        const [newName, newDescription] = [uniqid("new-name-"), uniqid("new-description-")];

        cy.findByTestId("admin.am.group.new.name").should("have.value", name);
        // Add group's detail
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
        cy.findByText("Group saved successfully!").should("exist");
        // Updated group should be in list
        cy.findByTestId("default-data-list").within(() => {
            cy.findByText(newName).should("exist");
        });

        // Delete fist group from the list
        deleteGroup(slug);
    });

    it("should create group with all permissions, verify and delete it", () => {
        cy.visit(`/access-management/groups`);

        // Create a group
        const [name, slug, description] = [
            uniqid("name-"),
            uniqid("slug-"),
            uniqid("description-")
        ];

        // Open group details form
        cy.findAllByTestId("new-record-button").first().click();
        // Add group's detail
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
        cy.findByText("Group saved successfully!").should("exist");

        // Verify group permissions
        // eslint-disable-next-line jest/valid-expect-in-promise
        cy.securityReadGroup({ slug }).then(group => {
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
        deleteGroup(slug);
    });
});
