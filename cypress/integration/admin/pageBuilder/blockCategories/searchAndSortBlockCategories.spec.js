import uniqid from "uniqid";

const sort = {
    NEWEST_TO_OLDEST: "createdOn_DESC",
    OLDEST_TO_NEWEST: "createdOn_ASC",
    A_TO_Z: "name_ASC",
    Z_TO_A: "name_DESC"
};

context("Block Categories Module", () => {
    const entries = [];

    before(() => {
        // Delete all block categories if such exist
        cy.pbDeleteAllBlockCategories();

        // Create three block categories
        for (let i = 0; i < 3; i++) {
            const id = uniqid();
            cy.pbCreateBlockCategory({
                data: {
                    name: `${i} Cool Block Category ${id}`,
                    slug: `block-category-slug-${id}`,
                    icon: `block-category-icon-${id}`,
                    description: `${i} Cool Block Category Description ${id}`
                }
            }).then(menu => {
                entries.push(menu);
            });
        }
    });

    after(() => {
        // Delete created block categories
        for (let i = 0; i < entries.length; i++) {
            const { slug } = entries[i];
            cy.pbDeleteBlockCategory({
                slug
            });
        }
    });

    beforeEach(() => cy.login());

    it("should be able to search block category", () => {
        cy.visit(`/page-builder/block-categories`);

        // Searching for a non existing entry should result in "No records found"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText("Search block categories").type("NON_EXISTING_ENTRY");
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText("No records found.").should("exist");
        });

        // Searching for a particular entry by "name"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText("Search block categories").clear().type(entries[0].name);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(entries[0].name).should("exist");
        });

        // Searching for a particular entry by "slug"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText("Search block categories").clear().type(entries[0].slug);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(entries[0].name).should("exist");
        });

        // Searching for a particular entry by "description"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText("Search block categories")
                .clear()
                .type(entries[0].description);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(entries[0].description).should("exist");
        });
    });

    it("should be able to sort block categories", () => {
        cy.visit(`/page-builder/block-categories`);

        // Sort entries by "Name A -> Z"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.A_TO_Z);
            cy.findByTestId("default-data-list.filter").click();
        });

        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .within(() => {
                    cy.findByText(entries[0].name).should("exist");
                });
        });

        // Sort entries by "Name Z -> A"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.Z_TO_A);
            cy.findByTestId("default-data-list.filter").click();
        });

        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .within(() => {
                    cy.findByText(entries[entries.length - 1].name).should("exist");
                });
        });

        // Sort entries by "Oldest to Newest"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.OLDEST_TO_NEWEST);
            cy.findByTestId("default-data-list.filter").click();
        });

        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .within(() => {
                    cy.findByText(entries[0].name).should("exist");
                });
        });

        // Sort entries by "Newest to Oldest"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.NEWEST_TO_OLDEST);
            cy.findByTestId("default-data-list.filter").click();
        });

        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .within(() => {
                    cy.findByText(entries[entries.length - 1].name).should("exist");
                });
        });
    });
});
