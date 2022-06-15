import uniqid from "uniqid";
import kebabCase from "lodash/kebabCase";
import { CONTENT_MODEL_DATA } from "../mocks";

const NEWEST_TO_OLDEST = "savedOn_DESC";
const OLDEST_TO_NEWEST = "savedOn_ASC";
const STATUS = {
    draft: "draft",
    published: "published",
    all: "all"
};

const createContentEntry = ({ model, entries }) => {
    // Create an entry
    const newEntryTitle = uniqid(`Atomic Habits `);
    const newEntryEdition = Math.round(Math.random() * 10);
    // Save for later
    entries.push({ title: newEntryTitle });

    // a) Click on "New Entry" button
    cy.findAllByTestId("new-record-button").first().click();
    // b) Fill entry details
    cy.findByLabelTestId("fr.input.text.Title").type(newEntryTitle);
    cy.findByLabelTestId("fr.input.number.Edition").type(newEntryEdition.toString());
    // c) Save entry
    cy.findByTestId("cms-content-save-content-button").click();
    // d) Verify success message
    cy.findByText(`${model.name} entry created successfully!`).should("exist");
    cy.get(".react-spinner-material").should("not.exist");
};

const deleteContentEntry = () => {
    // Select entry
    cy.findByTestId("default-data-list").within(() => {
        cy.get(".mdc-list-item").first().click();
    });
    // Delete the entry
    cy.findByTestId("cms.content-form.header.more-options").click();
    cy.findByTestId("cms.content-form.header.delete").click();
    cy.findByTestId("cms.content-form.header.delete-dialog").within(() => {
        cy.findByText(/Delete content entry/i);
        cy.findByText(/Confirm/i).click();
    });
    // Verify
    cy.findByText(/deleted successfully!/i).should("exist");
    cy.get(".react-spinner-material").should("not.exist");
};

context("Search, Sort and Filter Content Entries", () => {
    const newModel = uniqid("Book-");
    const totalEntries = 3;
    const entries = [];
    let createdModel;
    let createdGroup;
    // Runs once before all tests in the block
    before(() => {
        cy.cmsCreateContentModelGroup({
            data: { name: uniqid("Group-"), icon: "fas/star" }
        }).then(group => {
            createdGroup = group;
            cy.cmsCreateContentModel({
                data: {
                    name: newModel,
                    modelId: kebabCase(newModel.toLowerCase()),
                    group: group.id,
                    description: "Testing 123"
                }
            }).then(data => {
                cy.cmsUpdateContentModel({
                    modelId: data.modelId,
                    data: CONTENT_MODEL_DATA
                }).then(model => {
                    createdModel = model;
                    cy.visit(`/cms/content-entries/${model.modelId}`);
                    // Create few entries
                    for (let i = 0; i < totalEntries; i++) {
                        createContentEntry({ model, entries });
                    }
                });
            });
        });
    });

    beforeEach(() => cy.login());

    after(() => {
        cy.login();
        cy.visit(`/cms/content-entries/${createdModel.modelId}`);
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").first().select("savedOn_DESC");
            cy.wait(500);
        });
        cy.findByTestId("default-data-list.filter").click();
        // Delete all entries
        for (let i = 0; i < totalEntries; i++) {
            deleteContentEntry({});
        }

        cy.waitUntil(
            () =>
                cy
                    .cmsDeleteContentModel({ modelId: createdModel.modelId })
                    .then(data => data === true),
            {
                description: `Wait until "ContentModel" is deleted`
            }
        );

        cy.waitUntil(
            () =>
                cy.cmsDeleteContentModelGroup({ id: createdGroup.id }).then(data => data === true),
            {
                description: `Wait until "ContentModelGroup" is deleted`
            }
        );
    });

    it("should search entries", () => {
        // Should show "no records found" when searching for non existing entry
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/search*/i).type("NON_EXISTING_ENTRY");
            cy.wait(500);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(/no records found./i).should("exist");
        });

        // Should able to search for a specific entry
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/search*/i)
                .clear()
                .type(entries[0].title);
            cy.wait(500);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(entries[0].title).should("exist");
        });

        // Clear search
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/search*/i).clear();
        });
    });

    it("should sort entries", () => {
        cy.visit(`/cms/content-entries/${createdModel.modelId}`);
        // Sort groups by "Newest to Oldest"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").first().select(NEWEST_TO_OLDEST);
            cy.wait(500);
        });
        cy.findByTestId("default-data-list.filter").click();

        // Last entry should be on the top
        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .within(() => {
                    cy.findByText(entries[totalEntries - 1].title).should("exist");
                });
        });

        // Sort groups by "Oldest to Newest"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").first().select(OLDEST_TO_NEWEST);
            cy.wait(500);
        });
        cy.findByTestId("default-data-list.filter").click();

        // First entry should be on the top
        cy.findByTestId("default-data-list").within(() => {
            cy.get("div")
                .first()
                .within(() => {
                    cy.findByText(entries[0].title).should("exist");
                });
        });
    });

    it("should filter entries by status", () => {
        cy.visit(`/cms/content-entries/${createdModel.modelId}`);
        // Get all items with "draft" status
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").last().select(STATUS.draft);
            cy.wait(500);
        });
        cy.findByTestId("default-data-list.filter").click();

        // Should contain all entries
        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item").siblings().should("have.length", entries.length);
        });

        // Get all items with "published" status
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").last().select(STATUS.published);
            cy.wait(500);
        });
        cy.findByTestId("default-data-list.filter").click();

        // Should contain no entries
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(/no records found./i).should("exist");
        });
    });
});
