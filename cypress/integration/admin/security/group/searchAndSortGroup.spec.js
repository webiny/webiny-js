import uniqid from "uniqid";

const sort = {
    NEWEST_TO_OLDEST: "createdOn:desc",
    OLDEST_TO_NEWEST: "createdOn:asc",
    NAME_A_TO_Z: "name:asc",
    NAME_Z_TO_A: "name:desc"
};

context("Search and Sort Security Groups", () => {
    const total = 3;
    const groups = [];

    before(() => {
        for (let i = 0; i < total; i++) {
            cy.securityCreateGroup({
                data: {
                    name: uniqid(`${i}-`, "-group"),
                    description: uniqid("description-"),
                    slug: uniqid("slug-"),
                    permissions: [{ name: "content.i18n" }]
                }
            }).then(group => {
                groups.push(group);
            });
        }
    });

    beforeEach(() => {
        cy.login();
    });

    after(() => {
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            cy.securityDeleteGroup({
                slug: group.slug
            });
        }
    });

    it("should be able to search group", () => {
        cy.visit(`/security/groups`);

        // Searching for a non existing user should result in "no records found"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search groups/i).type("NON_EXISTING_USER");
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(/no records found./i).should("exist");
        });

        // Searching for a particular group by "slug"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search groups/i)
                .clear()
                .type(groups[0].slug);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(groups[0].name).should("exist");
        });

        // Searching for a particular group by "name"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search groups/i)
                .clear()
                .type(groups[0].name);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(groups[0].name).should("exist");
        });

        // Searching for a particular group by "description"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search groups/i)
                .clear()
                .type(groups[0].description);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(groups[0].description).should("exist");
        });
    });

    it("should be able to sort groups", () => {
        cy.visit(`/security/groups`);

        // Sort groups from "login A -> Z"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.NAME_A_TO_Z);
            cy.findByTestId("default-data-list.filter").click();
        });

        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .within(() => {
                    cy.findByText(groups[0].name).should("exist");
                });
        });

        // Sort groups from "name Z -> A"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.NAME_Z_TO_A);
            cy.findByTestId("default-data-list.filter").click();
        });
        // We're testing it against the third item because the first two will be system groups
        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .next()
                .next()
                .within(() => {
                    cy.findByText(groups[total - 1].name).should("exist");
                });
        });

        // Sort groups from "Oldest to Newest"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.OLDEST_TO_NEWEST);
            cy.findByTestId("default-data-list.filter").click();
        });
        // We're testing it against the third item because the first two will be system groups
        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .next()
                .next()
                .within(() => {
                    cy.findByText(groups[0].name).should("exist");
                });
        });

        // Sort groups from "Newest to Oldest"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.NEWEST_TO_OLDEST);
            cy.findByTestId("default-data-list.filter").click();
        });

        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .within(() => {
                    cy.findByText(groups[total - 1].name).should("exist");
                });
        });
    });
});
