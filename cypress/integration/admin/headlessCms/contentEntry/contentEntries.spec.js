import uniqid from "uniqid";
import kebabCase from "lodash/kebabCase";
import { CONTENT_MODEL_DATA } from "../mocks";

describe("Headless CMS - Content Entries", () => {
    context("CRUD", () => {
        const newModel = uniqid("Book-");
        let model;
        let group;
        // Runs once before all tests in the block
        before(() => {
            cy.cmsCreateContentModelGroup({
                data: { name: uniqid("Group-"), icon: "fas/star" }
            }).then(data => {
                group = data;
                cy.cmsCreateContentModel({
                    data: {
                        name: newModel,
                        modelId: kebabCase(newModel.toLowerCase()),
                        group: group.id,
                        description: "Testing 123"
                    }
                }).then(data => {
                    model = data;
                    cy.cmsUpdateContentModel({
                        modelId: data.modelId,
                        data: CONTENT_MODEL_DATA
                    });
                });
            });
        });

        beforeEach(() => cy.login());

        after(() => {
            cy.waitUntil(
                () =>
                    cy
                        .cmsDeleteContentModel({ modelId: model.modelId })
                        .then(data => data === true),
                {
                    description: `Wait until "ContentModel" is deleted`
                }
            );

            cy.waitUntil(
                () => cy.cmsDeleteContentModelGroup({ id: group.id }).then(data => data === true),
                {
                    description: `Wait until "ContentModelGroup" is deleted`
                }
            );
        });

        it("should create, edit, publish, unpublish, and delete content entry", () => {
            cy.visit("/cms/content-models");

            cy.findByTestId("default-data-list").within(() => {
                cy.get("li")
                    .first()
                    .within(() => {
                        cy.findByText(newModel).should("exist");
                        cy.findByTestId("cms-view-content-model-button").click({ force: true });
                    });
            });

            // Create an entry
            const newEntryTitle = `Atomic Habits`;
            const newEntryEdition = "4";
            const newEntryTitle2 = newEntryTitle + "- 2nd";

            // a) Click on "New Entry" button
            cy.findAllByTestId("new-record-button").first().click();
            // b) Fill entry details
            cy.findByTestId("cms-content-form").within(() => {
                cy.findByLabelText("Title").type(newEntryTitle);
                cy.findByLabelText("Edition").type(newEntryEdition);
            });
            // c) Save entry
            cy.findByTestId("cms-content-save-content-button").click();
            // Loading should not be visible
            cy.get(".react-spinner-material").should("not.exist");
            // d) Verify success message
            cy.findByText(`${newModel} entry created successfully!`).should("exist");

            // Check the new entry in list
            cy.findByTestId("default-data-list").within(() => {
                cy.get("li")
                    .first()
                    .within(() => {
                        cy.findByText(newEntryTitle).should("exist");
                        cy.findByText(/Draft/i).should("exist");
                        cy.findByText(/\(v1\)/i).should("exist");
                    });
            });

            // Loading should not be visible
            cy.get(".react-spinner-material").should("not.exist");

            // Publish entry
            cy.findByText(/save & publish/i).click();
            cy.findByTestId("cms-confirm-save-and-publish").within(() => {
                cy.findByText("Confirm").click();
            });
            cy.get(".react-spinner-material").should("not.exist");
            cy.findByText(/Successfully published revision/i).should("exist");
            // Check publish status
            cy.findByTestId("default-data-list").within(() => {
                cy.get("li")
                    .first()
                    .within(() => {
                        cy.findByText(newEntryTitle).should("exist");
                        cy.findByText(/Published/i).should("exist");
                        cy.findByText(/\(v1\)/i).should("exist");
                    });
            });

            // Edit an entry
            cy.findByLabelText("Title").clear().type(newEntryTitle2);
            cy.findByTestId("cms-content-save-content-button").click();
            // Check the new entry in list
            cy.findByTestId("default-data-list").within(() => {
                cy.get("li")
                    .first()
                    .within(() => {
                        cy.findByText(newEntryTitle2).should("exist");
                        cy.findByText(/Draft/i).should("exist");
                        cy.findByText(/\(v2\)/i).should("exist");
                    });
            });

            // Loading should not be visible
            cy.get(".react-spinner-material").should("not.exist");

            // Publish entry
            cy.findByText(/save & publish/i).click();
            cy.findByTestId("cms-confirm-save-and-publish").within(() => {
                cy.findByText("Confirm").click();
            });
            cy.get(".react-spinner-material").should("not.exist");
            cy.findByText(/Successfully published revision/i).should("exist");
            // Check publish status
            cy.findByTestId("default-data-list").within(() => {
                cy.get("li")
                    .first()
                    .within(() => {
                        cy.findByText(newEntryTitle2).should("exist");
                        cy.findByText(/Published/i).should("exist");
                        cy.findByText(/\(v2\)/i).should("exist");
                    });
            });

            // Check revisions tab
            cy.findByTestId("cms.content-form.tabs.revisions").click();
            // check revisions
            cy.findByTestId("cms.content-form.revisions").within(() => {
                cy.get("li")
                    .first()
                    .within(() => {
                        cy.findByTestId("cms.revision.status.published").should("exist");
                    });
                cy.get("li")
                    .next()
                    .within(() => {
                        cy.findByTestId("cms.revision.status.locked").should("exist");
                    });
            });

            // unpublish latest revision
            cy.findByTestId("cms.content-form.revisions").within(() => {
                cy.get("li")
                    .first()
                    .within(() => {
                        cy.findByTestId("cms.revision.status.published").should("exist");
                        cy.findByTestId("cms.content-form.revisions.more-options").click();
                    });
            });
            cy.findByTestId("cms.revision.unpublish").click();
            cy.findByText(/Successfully unpublished revision/i).should("exist");

            cy.findByTestId("cms.content-form.tabs.content").click();

            // Delete the entry
            cy.findByTestId("cms.content-form.header.more-options").click();
            cy.findByTestId("cms.content-form.header.delete").click();
            cy.findByTestId("cms.content-form.header.delete-dialog").within(() => {
                cy.findByText(/Delete content entry/i);
                cy.findByText(/Confirm/i).click();
            });
            cy.findByText(/deleted successfully!/i).should("exist");
        });
    });
});
