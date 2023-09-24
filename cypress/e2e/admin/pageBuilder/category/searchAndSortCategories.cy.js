import uniqid from "uniqid";

const sort = {
    NEWEST_TO_OLDEST: "createdOn_DESC",
    OLDEST_TO_NEWEST: "createdOn_ASC",
    A_TO_Z: "name_ASC",
    Z_TO_A: "name_DESC"
};

context("Categories Module", () => {
    const entries = [];

    before(() => {
        for (let i = 0; i < 3; i++) {
            const id = uniqid();
            cy.pbCreateCategory({
                data: {
                    name: `${i} Cool Category ${id}`,
                    slug: `category-slug-${id}`,
                    url: `/category-slug-${id}/`,
                    layout: "static"
                }
            }).then(menu => {
                entries.push(menu);
            });
        }
    });

    beforeEach(() => cy.login());

    after(() => {
        for (let i = 0; i < entries.length; i++) {
            const { slug } = entries[i];
            cy.pbDeleteCategory({
                slug
            });
        }
    });

    it("should be able to search category", () => {
        cy.visit(`/page-builder/categories`);

        // Searching for a non existing entry should result in "no records found"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search categories/i).type("NON_EXISTING_ENTRY");
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(/no records found./i).should("exist");
        });

        // Searching for a particular entry by "name"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search categories/i)
                .clear()
                .type(entries[0].name);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(entries[0].name).should("exist");
        });

        // Searching for a particular entry by "url"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search categories/i)
                .clear()
                .type(entries[0].url);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(entries[0].url).should("exist");
        });
    });

    it("should be able to sort categories", () => {
        cy.visit(`/page-builder/categories`);

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
        // We're testing it against the second element because the first one will be "Static" category
        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .next()
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
        // We're testing it against the second element because the first one will be "Static" category
        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .next()
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
