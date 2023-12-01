import uniqid from "uniqid";

const sort = {
    NEWEST_TO_OLDEST: "createdOn_DESC",
    OLDEST_TO_NEWEST: "createdOn_ASC",
    A_TO_Z: "title_ASC",
    Z_TO_A: "title_DESC"
};

context("Menus Module", () => {
    const entries = [];

    before(() => {
        for (let i = 0; i < 3; i++) {
            cy.pbCreateMenu({
                data: {
                    title: uniqid(`${i}-`, "-menu-title"),
                    slug: uniqid("-menu-slug"),
                    description: uniqid("Menu-description-")
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
            cy.pbDeleteMenu({
                slug
            });
        }
    });

    it("should be able to search menu", () => {
        cy.visit(`/page-builder/menus`);

        // Searching for a non existing entry should result in "no records found"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search menus/i).type("NON_EXISTING_ENTRY");
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(/no records found./i).should("exist");
        });

        // Searching for a particular entry by "title"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search menus/i)
                .clear()
                .type(entries[0].title);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(entries[0].title).should("exist");
        });

        // Searching for a particular entry by "description"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search menus/i)
                .clear()
                .type(entries[0].description);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(entries[0].description).should("exist");
        });
    });

    it("should be able to sort menus", () => {
        cy.visit(`/page-builder/menus`);

        // Sort entries by "Title A -> Z"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.A_TO_Z);
            cy.findByTestId("default-data-list.filter").click();
        });

        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .within(() => {
                    cy.findByText(entries[0].title).should("exist");
                });
        });

        // Sort entries by "Title Z -> A"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.Z_TO_A);
            cy.findByTestId("default-data-list.filter").click();
        });
        // We're testing it against the second element because the first one will be "Main Menu"
        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .next()
                .within(() => {
                    cy.findByText(entries[entries.length - 1].title).should("exist");
                });
        });

        // Sort entries by "Oldest to Newest"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.OLDEST_TO_NEWEST);
            cy.findByTestId("default-data-list.filter").click();
        });
        // We're testing it against the second element because the first one will be "Main Menu"
        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .next()
                .within(() => {
                    cy.findByText(entries[0].title).should("exist");
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
                    cy.findByText(entries[entries.length - 1].title).should("exist");
                });
        });
    });
});
