import uniqid from "uniqid";

const sort = {
    NEWEST_TO_OLDEST: "createdOn_DESC",
    OLDEST_TO_NEWEST: "createdOn_ASC",
    NAME_A_TO_Z: "name_ASC",
    NAME_Z_TO_A: "name_DESC"
};

context("Search and Sort Security Roles", () => {
    const total = 3;
    const groups = [];

    before(() => {
        for (let i = 0; i < total; i++) {
            cy.securityCreateRole({
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
            cy.securityDeleteRole({ id: group.id });
        }
    });

    it("should be able to search role", () => {
        cy.visit(`/access-management/roles`);

        // Searching for a non existing user should result in "no records found"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search roles/i).type("NON_EXISTING_USER");
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(/no records found./i).should("exist");
        });

        // Searching for a particular role by "slug"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search roles/i)
                .clear()
                .type(groups[0].slug);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(groups[0].name).should("exist");
        });

        // Searching for a particular role by "name"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search roles/i)
                .clear()
                .type(groups[0].name);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(groups[0].name).should("exist");
        });

        // Searching for a particular role by "description"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search roles/i)
                .clear()
                .type(groups[0].description);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(groups[0].description).should("exist");
        });
    });

    it("should be able to sort roles", () => {
        cy.visit(`/access-management/roles`);

        // Sort roles from "login A -> Z"
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

        // Sort roles from "name Z -> A"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.NAME_Z_TO_A);
            cy.findByTestId("default-data-list.filter").click();
        });
        // We're testing it against the third item because the first two will be system roles
        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .next()
                .next()
                .within(() => {
                    cy.findByText(groups[total - 1].name).should("exist");
                });
        });

        // Sort roles from "Oldest to Newest"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.OLDEST_TO_NEWEST);
            cy.findByTestId("default-data-list.filter").click();
        });
        // We're testing it against the third item because the first two will be system roles
        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .next()
                .next()
                .within(() => {
                    cy.findByText(groups[0].name).should("exist");
                });
        });

        // Sort roles from "Newest to Oldest"
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
