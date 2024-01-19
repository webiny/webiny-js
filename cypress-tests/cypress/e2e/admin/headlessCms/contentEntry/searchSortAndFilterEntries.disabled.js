import uniqid from "uniqid";
import kebabCase from "lodash/kebabCase";
import upperFirst from "lodash/upperFirst";
import camelCase from "lodash/camelCase";
import { CONTENT_MODEL_DATA } from "../mocks";

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
    cy.wait(500);
    cy.get(".react-spinner-material").should("not.exist");

    // a) Click on "New Entry" button
    cy.findAllByTestId("new-entry-button").first().click({ force: true });
    // b) Fill entry details
    cy.wait(500);
    cy.findByTestId("fr.input.text.Title").type(newEntryTitle);
    cy.findByTestId("fr.input.number.Edition").type(newEntryEdition.toString());
    // c) Save entry
    cy.findByTestId("cms-content-save-content-button").click({ force: true });
    // d) Verify success message
    cy.findByText(`${model.name} entry created successfully!`).should("exist");
    cy.get(".react-spinner-material").should("not.exist");
    /**
     * As ACO was introduced, there is a new step - navigate to root folder
     */
    cy.acoNavigateToRootFolder();
};

const deleteContentEntry = () => {
    // Select entry
    cy.get("div.cms-data-list-record-title").first().click({ force: true });
    // Delete the entry
    cy.findByTestId("cms.content-form.header.more-options").click();
    cy.findByTestId("cms.content-form.header.delete").click();
    cy.findByTestId("cms.content-form.header.delete-dialog").within(() => {
        cy.findByText(/Delete content entry/i);
        cy.findByText(/Confirm/i).click({ force: true });
    });
    // Verify
    cy.findByText(/deleted successfully!/i).should("exist");
    cy.get(".react-spinner-material").should("not.exist");
    /**
     * As ACO was introduced, there is a new step - navigate to root folder
     */
    cy.acoNavigateToRootFolder();
};

context("Search, Sort and Filter Content Entries", () => {
    const newModel = uniqid("Book-");
    const singularApiName = upperFirst(camelCase(uniqid("Book")));
    const pluralApiName = upperFirst(camelCase(uniqid("Books")));
    const totalEntries = 3;
    const entries = [];
    let createdModel;
    let createdGroup;
    // Runs once before all tests in the block
    before(() => {
        cy.cmsCreateContentModelGroup({
            data: {
                name: uniqid("Group-"),
                icon: {
                    type: "emoji",
                    name: "thumbs_up",
                    value: "👍"
                }
            }
        }).then(group => {
            createdGroup = group;
            cy.cmsCreateContentModel({
                data: {
                    ...CONTENT_MODEL_DATA,
                    name: newModel,
                    modelId: kebabCase(newModel.toLowerCase()),
                    singularApiName,
                    pluralApiName,
                    group: group.id,
                    description: "Testing 123"
                }
            }).then(model => {
                createdModel = model;
                cy.visit(`/cms/content-entries/${model.modelId}?folderId=root`);
                cy.wait(2000);
                // Create few entries
                for (let i = 0; i < totalEntries; i++) {
                    createContentEntry({ model, entries });
                }
            });
        });
    });

    beforeEach(() => cy.login());

    after(() => {
        cy.login();
        cy.visit(`/cms/content-entries/${createdModel.modelId}?folderId=root`);

        cy.wait(2000);
        // Delete all entries
        for (let i = 0; i < totalEntries; i++) {
            deleteContentEntry();
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
            cy.get(".search__input").wait(200).clear();
            cy.get(".search__input").wait(200).type("NON_EXISTING_ENTRY");
            cy.wait(500);
        });
        cy.get(".title__container").within(() => {
            cy.findByText("No results found.").should("exist");
        });

        // Should able to search for a specific entry
        cy.findByTestId("default-data-list.search").within(() => {
            cy.get(".search__input").wait(100).clear();
            cy.get(".search__input").wait(100).type(entries[0].title);
            cy.wait(500);
        });

        cy.get(".cms-data-list-record-title").should("have.length", 1);
        cy.get(".cms-data-list-record-title")
            .first()
            .within(() => {
                cy.findByText(entries[0].title).should("exist");
            });

        // Clear search
        cy.findByTestId("default-data-list.search").within(() => {
            cy.get(".search__input").wait(100).clear();
        });
    });

    it("should sort entries", () => {
        cy.visit(`/cms/content-entries/${createdModel.modelId}?folderId=root`);
        // Loading should not be visible
        cy.get(".react-spinner-material").should("not.exist");
        cy.wait(500);
        // Loading should not be visible
        cy.get(".react-spinner-material").should("not.exist");

        // Last entry should be on the top
        cy.findByTestId("default-data-list").within(() => {
            cy.get(".cms-data-list-record-title")
                .first()
                .within(() => {
                    cy.findByText(entries[totalEntries - 1].title).should("exist");
                });
        });

        // Sort by ASC
        cy.get(".cms-aco-list-savedOn").within(() => {
            cy.get("div").first().click();
        });
        cy.wait(500);
        // Loading should not be visible
        cy.get(".react-spinner-material").should("not.exist");

        // First entry should be on the top
        cy.findByTestId("default-data-list").within(() => {
            cy.get(".cms-data-list-record-title")
                .first()
                .within(() => {
                    cy.findByText(entries[0].title).should("exist");
                });
        });
    });

    it("should filter entries by status", () => {
        cy.visit(`/cms/content-entries/${createdModel.modelId}?folderId=root`);

        // open the filters bar
        cy.findByTestId("cms.list-entries.toggle-filters").click();

        cy.findByTestId("filters-container").within(() => {
            cy.get("select").first().select(STATUS.draft);
            cy.wait(500);
        });

        // Loading should not be visible
        cy.get(".react-spinner-material").should("not.exist");

        // Should contain all entries
        cy.get(".cms-data-list-record-title").should("have.length", entries.length);

        // Get all items with "published" status

        cy.findByTestId("filters-container").within(() => {
            cy.get("select").first().select(STATUS.published);
            cy.wait(500);
        });

        // Loading should not be visible
        cy.get(".react-spinner-material").should("not.exist");

        // Should contain no entries
        cy.get(".cms-data-list-record-title").should("have.length", 0);
        cy.get(".title__container").within(() => {
            cy.findByText("No results found.").should("exist");
        });
    });
});
