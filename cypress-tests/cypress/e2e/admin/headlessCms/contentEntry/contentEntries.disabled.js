import uniqid from "uniqid";
import kebabCase from "lodash/kebabCase";
import upperFirst from "lodash/upperFirst";
import camelCase from "lodash/camelCase";
import { CONTENT_MODEL_DATA } from "../mocks";

describe("Headless CMS - Content Entries", () => {
    context("CRUD", () => {
        const newModel = uniqid("Book-");
        const singularApiName = upperFirst(camelCase(uniqid("Book")));
        const pluralApiName = upperFirst(camelCase(uniqid("Books")));

        let model;
        let group;
        // Runs once before all tests in the block
        before(() => {
            return cy
                .cmsCreateContentModelGroup({
                    data: {
                        name: uniqid("Group-"),
                        icon: {
                            type: "emoji",
                            name: "thumbs_up",
                            value: "👍"
                        }
                    }
                })
                .then(data => {
                    group = data;
                    return cy
                        .cmsCreateContentModel({
                            data: {
                                name: newModel,
                                modelId: kebabCase(newModel.toLowerCase()),
                                singularApiName,
                                pluralApiName,
                                group: group.id,
                                description: "Testing 123"
                            }
                        })
                        .then(data => {
                            model = data;
                            return cy.cmsUpdateContentModel({
                                modelId: data.modelId,
                                data: CONTENT_MODEL_DATA
                            });
                        });
                });
        });

        beforeEach(() => cy.login());

        after(() => {
            cy.waitUntil(
                () => {
                    return cy
                        .cmsDeleteContentModel({ modelId: model.modelId })
                        .then(data => data === true);
                },
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
            const newEntryTitle2 = newEntryTitle + " - 2nd";

            // a) Click on "New Entry" button
            cy.findByTestId("new-entry-button").should("exist");
            cy.findByTestId("new-entry-button").click();
            //cy.findAllByTestId("new-entry-button").first().click({ force: true });

            // Loading should not be visible
            cy.get(".react-spinner-material").should("not.exist");

            // b) Fill entry details
            cy.findByTestId("cms-content-form").within(() => {
                cy.findByTestId("fr.input.text.Title").clear();
                cy.findByTestId("fr.input.text.Title").type(newEntryTitle);
                cy.findByTestId("fr.input.number.Edition").clear();
                cy.findByTestId("fr.input.number.Edition").type(newEntryEdition);
            });
            // c) Save entry
            cy.findByTestId("cms-content-save-content-button").click();
            // Loading should not be visible
            cy.get(".react-spinner-material").should("not.exist");
            // d) Verify success message
            cy.findByText(`${newModel} entry created successfully!`).should("exist");
            /**
             * As ACO was introduced, there is a new step - navigate to root folder
             */
            cy.acoNavigateToRootFolder();
            cy.wait(500);

            // Check the new entry in list
            cy.findByTestId("default-data-list").within(() => {
                cy.get("tbody")
                    .first()
                    .within(() => {
                        cy.get("tr").within(() => {
                            cy.findByText(newEntryTitle).should("exist");
                            cy.findByText(/Draft \(v1\)/i).should("exist");
                        });
                    });
            });

            // Loading should not be visible
            cy.get(".react-spinner-material").should("not.exist");
            // We should navigate to the new entry
            cy.get("div.cms-data-list-record-title")
                .first()
                .within(() => {
                    cy.findByText(newEntryTitle).should("exist");
                })
                .click({ force: true });
            cy.get(".mdc-text-field__input").should("exist");

            // Publish entry
            cy.findByTestId("cms-content-save-publish-content-button").click();
            cy.findByTestId("cms-confirm-save-and-publish").within(() => {
                cy.findByRole("button", { name: "Confirm" }).click();
            });
            cy.get(".react-spinner-material").should("not.exist");
            cy.findByText(/Successfully published revision/i).should("exist");

            /**
             * As ACO was introduced, there is a new step - navigate to root folder
             */
            cy.acoNavigateToRootFolder();
            // Loading should not be visible
            cy.get(".react-spinner-material").should("not.exist");
            cy.wait(500);

            // Check publish status
            cy.findByTestId("default-data-list").within(() => {
                cy.get("tbody")
                    .first()
                    .within(() => {
                        cy.get("tr").within(() => {
                            cy.findByText(newEntryTitle).should("exist");
                            cy.findByText(/Published \(v1\)/i).should("exist");
                        });
                    });
            });
            // Navigate to published entry
            cy.get("div.cms-data-list-record-title")
                .first()
                .within(() => {
                    cy.findByText(newEntryTitle).should("exist");
                })
                .click({ force: true });
            cy.get(".mdc-text-field__input").should("exist").wait(100);

            // Edit an entry
            cy.findByTestId("fr.input.text.Title").clear();
            cy.wait(500);
            cy.findByTestId("fr.input.text.Title").wait(200).type(newEntryTitle2);
            cy.findByTestId("fr.input.text.Title").should("have.value", newEntryTitle2);
            cy.findByTestId("cms-content-save-content-button").click({ force: true });

            // Loading should not be visible
            cy.get(".react-spinner-material").should("not.exist");
            /**
             * As ACO was introduced, there is a new step - navigate to root folder
             */
            cy.acoNavigateToRootFolder();
            // Loading should not be visible
            cy.get(".react-spinner-material").should("not.exist");

            cy.findByTestId("default-data-list").should("exist");

            // Check the update entry in list
            cy.findByTestId("default-data-list").within(() => {
                cy.get("tbody")
                    .first()
                    .within(() => {
                        cy.get("tr").within(() => {
                            cy.findByText(newEntryTitle2).should("exist");
                            cy.findByText(/Draft \(v2\)/i).should("exist");
                        });
                    });
            });

            // Navigate to updated entry
            cy.get("div.cms-data-list-record-title")
                .first()
                .within(() => {
                    cy.findByText(newEntryTitle2).should("exist");
                })
                .click({ force: true });
            cy.get(".mdc-text-field__input").should("exist");

            // Publish entry
            cy.findByTestId("cms-content-save-publish-content-button").click();

            cy.findByTestId("cms-confirm-save-and-publish").within(() => {
                cy.findByRole("button", { name: "Confirm" }).click();
            });
            cy.findByText(/Successfully published revision/i).should("exist");

            // Loading should not be visible
            cy.get(".react-spinner-material").should("not.exist");

            cy.acoNavigateToRootFolder();
            // Loading should not be visible
            cy.get(".react-spinner-material").should("not.exist");

            // Check publish status
            cy.findByTestId("default-data-list").within(() => {
                cy.get("tbody")
                    .first()
                    .within(() => {
                        cy.get("tr").within(() => {
                            cy.findByText(newEntryTitle2).should("exist");
                            cy.findByText(/Published \(v2\)/i).should("exist");
                        });
                    });
            });

            // Navigate to published updated entry
            cy.get("div.cms-data-list-record-title")
                .first()
                .within(() => {
                    cy.findByText(newEntryTitle2).should("exist");
                })
                .click({ force: true });
            cy.get(".mdc-text-field__input").should("exist");

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
                cy.findByRole("button", { name: "Confirm" }).click();
            });
            cy.findByText(/deleted successfully!/i).should("exist");
        });
    });
});
