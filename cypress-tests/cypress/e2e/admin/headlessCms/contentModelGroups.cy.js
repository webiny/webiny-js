import { generateId } from "../../../support/utils";

context("Headless CMS - Content Model Groups", () => {
    beforeEach(() => {
        cy.login();
        cy.cmsDeleteAllContentModelGroups();
    });

    it("should able to create, update, and immediately delete everything", () => {
        cy.visit("/cms/content-model-groups");
        const newGroup = `Group ${generateId()}`;
        const newGroup2 = `Group-2 ${generateId()}`;
        // Create a new group
        cy.findAllByTestId("new-record-button").first().click();
        cy.findByTestId("cms.form.group.name").type(newGroup);
        cy.findByTestId("cms.form.group.description").type(
            `Trying to create a new Content Model Group: ${newGroup}`
        );
        cy.findByTestId("cms.form.group.submit").click();
        // Loading should be completed
        cy.get(".react-spinner-material").should("not.exist");
        cy.findByText("Content model group saved successfully!").should("exist");

        // Check newly created group in list
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(newGroup).should("exist");
                });
        });

        // Update groups' name
        cy.findByTestId("cms.form.group.name").clear();
        cy.findByTestId("cms.form.group.name").type(newGroup2);

        cy.findByTestId("cms.form.group.submit").click();
        // Loading should be completed
        cy.get(".react-spinner-material").should("not.exist");
        cy.findByText("Content model group saved successfully!").should("exist");

        // Check if the updated group is present in the list
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(newGroup2).should("exist");
                    // Initiate delete
                    cy.findByTestId("cms.contentModelGroup.list-item.delete").click({
                        force: true
                    });
                });
        });

        // Delete the newly created group
        cy.findByTestId("cms.contentModelGroup.list-item.delete-dialog").within(() => {
            cy.findByText(/Confirmation/i).should("exist");
            cy.findByText("Are you sure you want to continue?");
            cy.findByText(/confirm$/i).click({ force: true });
        });
        cy.findByText(`Content model group "${newGroup2}" deleted.`).should("exist");

        // Group should not present in the list
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li").within(() => {
                cy.findByText(newGroup).should("not.exist");
            });
        });
    });

    it("should able to create, search, sort, and immediately delete everything", () => {
        cy.visit("/cms/content-model-groups");
        // Create few content model groups
        const newGroup1 = `A Group ${generateId()}`;
        const newGroup2 = `Z Group ${generateId()}`;

        // Create a Group one
        cy.findAllByTestId("new-record-button").first().click();
        cy.findByTestId("cms.form.group.name").type(newGroup1);
        cy.findByTestId("cms.form.group.description").type(
            `Trying to create a new Content Model Group: ${newGroup1}`
        );
        cy.findByTestId("cms.form.group.submit").click();
        // Loading should be completed
        cy.get(".react-spinner-material").should("not.exist");
        cy.findByText("Content model group saved successfully!").should("exist");

        // Create a Group two
        cy.findAllByTestId("new-record-button").first().click();
        cy.findByTestId("cms.form.group.name").type(newGroup2);
        cy.findByTestId("cms.form.group.description").type(
            `Trying to create a new Content Model Group: ${newGroup2}`
        );
        cy.findByTestId("cms.form.group.submit").click();
        // Loading should be completed
        cy.get(".react-spinner-material").should("not.exist");
        cy.findByText("Content model group saved successfully!").should("exist");

        // Should show no results when searching for non existing group
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/search content model group/i).type(
                "NON_EXISTING_MODEL_GROUP_NAME"
            );
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(/no records found./i).should("exist");
        });

        // Should able to search "Ungrouped" group
        cy.findByTestId("default-data-list.search").within(() => {
            const input = cy.findByPlaceholderText(/search content model group/i);
            input.clear();
            input.type("ungrouped");
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(/ungrouped/i).should("exist");
        });

        // Should able to search Group1 and Group2
        cy.findByTestId("default-data-list.search").within(() => {
            const input = cy.findByPlaceholderText(/search content model group/i);
            input.clear();
            input.type("Group");
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(newGroup1).should("exist");
            cy.findByText(newGroup2).should("exist");
        });

        // Should able to search Group1 only
        cy.findByTestId("default-data-list.search").within(() => {
            const input = cy.findByPlaceholderText(/search content model group/i);
            input.clear();
            input.type(newGroup1);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(newGroup1).should("exist");
            cy.findByText(newGroup2).should("not.exist");
        });
        // Clear search input field
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/search content model group/i).clear();
        });

        // Sort groups by "Name A->Z"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select("name_ASC");
        });
        cy.findByTestId("default-data-list.filter").click();

        // Group1 should be at the top of the list
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(newGroup1).should("exist");
                });
        });
        // Sort groups by "Name Z->A"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select("name_DESC");
        });
        cy.findByTestId("default-data-list.filter").click();

        // Group2 should be at the top of the list
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(newGroup2).should("exist");
                });
        });

        // Sort groups by "Newest to Oldest"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select("createdOn_DESC");
        });
        cy.findByTestId("default-data-list.filter").click();

        // Finally, delete group2
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(newGroup2).should("exist");
                    // Initiate delete
                    cy.findByTestId("cms.contentModelGroup.list-item.delete").click({
                        force: true
                    });
                });
        });

        // Delete the newly created group
        cy.findByTestId("cms.contentModelGroup.list-item.delete-dialog").within(() => {
            cy.findByText(/Confirmation/i).should("exist");
            cy.findByText(/confirm$/i).click({ force: true });
        });

        // Confirm that group is deleted successfully
        cy.findByText(`Content model group "${newGroup2}" deleted.`);

        // Delete group1
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(newGroup1).should("exist");
                    // Initiate delete
                    cy.findByTestId("cms.contentModelGroup.list-item.delete").click({
                        force: true
                    });
                });
        });
        // Delete the newly created group
        cy.findByTestId("cms.contentModelGroup.list-item.delete-dialog").within(() => {
            cy.findByText(/Confirmation/i).should("exist");
            cy.findByText(/confirm$/i).click({ force: true });
        });
        // Confirm that group is deleted successfully
        cy.findByText(`Content model group "${newGroup1}" deleted.`);
    });
});
