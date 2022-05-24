/**
 * These tests sometimes start failing because data is not deleted after test runs.
 * Ideally, we want to clear all data BEFORE executing tests, just to be sure that there
 * is no unexpected data. This is especially important because we test sorting, and it
 * fails if there are unexpected items in the list.
 */

// import uniqid from "uniqid";
//
// context("Headless CMS - Content Model Groups", () => {
//     beforeEach(() => cy.login());
//
//     it.skip("should able to create, update, and immediately delete everything", () => {
//         cy.visit("/cms/content-model-groups");
//         const newGroup = `Group ${uniqid()}`;
//         const newGroup2 = `Group-2 ${uniqid()}`;
//         // Create a new group
//         cy.findAllByTestId("new-record-button").first().click();
//         cy.findByLabelText("Name").type(newGroup);
//         cy.findByLabelText("Description").type(
//             `Trying to create a new Content Model Group: ${newGroup}`
//         );
//         cy.findByText(/Save content model group/i).click();
//         // Loading should be completed
//         cy.get(".react-spinner-material").should("not.exist");
//         cy.findByText("Content model group saved successfully!").should("exist");
//
//         // Check newly created group in list
//         cy.findByTestId("default-data-list").within(() => {
//             cy.get("div").within(() => {
//                 cy.findByText(newGroup).should("exist");
//             });
//         });
//
//         // Update groups' name
//         cy.findByLabelText("Name").clear().type(newGroup2);
//
//         cy.findByText(/Save content model group/i).click();
//         // Loading should be completed
//         cy.get(".react-spinner-material").should("not.exist");
//         cy.findByText("Content model group saved successfully!").should("exist");
//         // Check if the updated group is present in the list
//         cy.findByTestId("default-data-list").within(() => {
//             cy.get("div").within(() => {
//                 cy.findByText(newGroup2).should("exist");
//                 // Initiate delete
//                 cy.findByTestId("cms.contentModelGroup.list-item.delete").click({ force: true });
//             });
//         });
//
//         // Delete the newly created group
//         cy.findByTestId("cms.contentModelGroup.list-item.delete-dialog").within(() => {
//             cy.findByText(/Confirmation/i).should("exist");
//             cy.findByText(/confirm$/i).click();
//         });
//         cy.findByText(`Content model group "${newGroup2}" deleted.`).should("exist");
//
//         // Group should not present in the list
//         cy.findByTestId("default-data-list").within(() => {
//             cy.get("div").within(() => {
//                 cy.findByText(newGroup).should("not.exist");
//             });
//         });
//     });
//
//     it.skip("should able to create, search, sort, and immediately delete everything", () => {
//         cy.visit("/cms/content-model-groups");
//         // Create few content model groups
//         const newGroup1 = `A Group ${uniqid()}`;
//         const newGroup2 = `Z Group ${uniqid()}`;
//
//         // Create a Group one
//         cy.findAllByTestId("new-record-button").first().click();
//         cy.findByLabelText("Name").type(newGroup1);
//         cy.findByLabelText("Description").type(
//             `Trying to create a new Content Model Group: ${newGroup1}`
//         );
//         cy.findByText(/Save content model group/i).click();
//         // Loading should be completed
//         cy.get(".react-spinner-material").should("not.exist");
//         cy.findByText("Content model group saved successfully!").should("exist");
//
//         // Create a Group two
//         cy.findAllByTestId("new-record-button").first().click();
//         cy.findByLabelText("Name").type(newGroup2);
//         cy.findByLabelText("Description").type(
//             `Trying to create a new Content Model Group: ${newGroup2}`
//         );
//         cy.findByText(/Save content model group/i).click();
//         // Loading should be completed
//         cy.get(".react-spinner-material").should("not.exist");
//         cy.findByText("Content model group saved successfully!").should("exist");
//
//         // Should show no results when searching for non existing group
//         cy.findByTestId("default-data-list.search").within(() => {
//             cy.findByPlaceholderText(/search content model group/i).type(
//                 "NON_EXISTING_MODEL_GROUP_NAME"
//             );
//         });
//         cy.findByTestId("ui.list.data-list").within(() => {
//             cy.findByText(/no records found./i).should("exist");
//         });
//
//         // Should able to search "Ungrouped" group
//         cy.findByTestId("default-data-list.search").within(() => {
//             cy.findByPlaceholderText(/search content model group/i)
//                 .clear()
//                 .type("ungrouped");
//         });
//         cy.findByTestId("ui.list.data-list").within(() => {
//             cy.findByText(/ungrouped/i).should("exist");
//         });
//
//         // Should able to search Group1 and Group2
//         cy.findByTestId("default-data-list.search").within(() => {
//             cy.findByPlaceholderText(/search content model group/i)
//                 .clear()
//                 .type("Group");
//         });
//         cy.findByTestId("ui.list.data-list").within(() => {
//             cy.findByText(newGroup1).should("exist");
//             cy.findByText(newGroup2).should("exist");
//         });
//
//         // Should able to search Group1 only
//         cy.findByTestId("default-data-list.search").within(() => {
//             cy.findByPlaceholderText(/search content model group/i)
//                 .clear()
//                 .type(newGroup1);
//         });
//         cy.findByTestId("ui.list.data-list").within(() => {
//             cy.findByText(newGroup1).should("exist");
//             cy.findByText(newGroup2).should("not.exist");
//         });
//         // Clear search input field
//         cy.findByTestId("default-data-list.search").within(() => {
//             cy.findByPlaceholderText(/search content model group/i).clear();
//         });
//
//         // Sort groups by "Name A->Z"
//         cy.findByTestId("default-data-list.filter").click();
//         cy.findByTestId("ui.list.data-list").within(() => {
//             cy.get("select").select("name_ASC");
//         });
//         cy.findByTestId("default-data-list.filter").click();
//
//         // Group1 should be at the top of the list
//         cy.findByTestId("default-data-list").within(() => {
//             cy.get("div")
//                 .first()
//                 .within(() => {
//                     cy.findByText(newGroup1).should("exist");
//                 });
//         });
//         // Sort groups by "Name Z->A"
//         cy.findByTestId("default-data-list.filter").click();
//         cy.findByTestId("ui.list.data-list").within(() => {
//             cy.get("select").select("name_DESC");
//         });
//         cy.findByTestId("default-data-list.filter").click();
//
//         // Group2 should be at the top of the list
//         cy.findByTestId("default-data-list").within(() => {
//             cy.get("div")
//                 .first()
//                 .within(() => {
//                     cy.findByText(newGroup2).should("exist");
//                 });
//         });
//
//         // Sort groups by "Newest to Oldest"
//         cy.findByTestId("default-data-list.filter").click();
//         cy.findByTestId("ui.list.data-list").within(() => {
//             cy.get("select").select("createdOn_DESC");
//         });
//         cy.findByTestId("default-data-list.filter").click();
//
//         // Finally, delete group2
//         cy.findByTestId("default-data-list").within(() => {
//             cy.get("div").within(() => {
//                 cy.findByText(newGroup2).should("exist");
//                 // Initiate delete
//                 cy.findByTestId("cms.contentModelGroup.list-item.delete").click({ force: true });
//             });
//         });
//         // Delete the newly created group
//         cy.findByTestId("cms.contentModelGroup.list-item.delete-dialog").within(() => {
//             cy.findByText(/Confirmation/i).should("exist");
//             cy.findByText(/confirm$/i).click();
//         });
//         // Confirm that group is deleted successfully
//         cy.findByText(`Content model group "${newGroup2}" deleted.`);
//
//         // Delete group1
//         cy.findByTestId("default-data-list").within(() => {
//             cy.get("div").within(() => {
//                 cy.findByText(newGroup1).should("exist");
//                 // Initiate delete
//                 cy.findByTestId("cms.contentModelGroup.list-item.delete").click({ force: true });
//             });
//         });
//         // Delete the newly created group
//         cy.findByTestId("cms.contentModelGroup.list-item.delete-dialog").within(() => {
//             cy.findByText(/Confirmation/i).should("exist");
//             cy.findByText(/confirm$/i).click();
//         });
//         // Confirm that group is deleted successfully
//         cy.findByText(`Content model group "${newGroup1}" deleted.`);
//     });
// });
