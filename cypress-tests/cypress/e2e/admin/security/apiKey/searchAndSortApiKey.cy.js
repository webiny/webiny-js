import uniqid from "uniqid";

const sort = {
    NEWEST_TO_OLDEST: "createdOn_DESC",
    OLDEST_TO_NEWEST: "createdOn_ASC",
    NAME_A_TO_Z: "name_ASC",
    NAME_Z_TO_A: "name_DESC"
};

context("Search and Sort Security API Key", () => {
    const total = 3;
    const apiKeys = [];

    before(() => {
        for (let i = 0; i < total; i++) {
            cy.securityCreateApiKey({
                data: {
                    name: uniqid(`${i}-`, "-api-key"),
                    description: uniqid("description-"),
                    permissions: [{ name: "content.i18n" }]
                }
            }).then(key => {
                apiKeys.push(key);
            });
        }
    });

    beforeEach(() => {
        cy.login();
    });

    after(() => {
        for (let i = 0; i < apiKeys.length; i++) {
            const { id } = apiKeys[i];
            cy.securityDeleteApiKey({
                id
            });
        }
    });

    it("should be able to search api key", () => {
        cy.visit(`/access-management/api-keys`);

        // Searching for a non existing api key should result in "no records found"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search api keys/i).type("NON_EXISTING_ENTRY");
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(/no records found./i).should("exist");
        });

        // Searching for a particular entry by "name"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search api keys/i)
                .clear()
                .type(apiKeys[0].name);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(apiKeys[0].name).should("exist");
        });

        // Searching for a particular entry by "description"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search api keys/i)
                .clear()
                .type(apiKeys[0].description);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(apiKeys[0].description).should("exist");
        });
    });

    it("should be able to sort apiKeys", () => {
        cy.visit(`/access-management/api-keys`);

        // Sort apiKeys from "Name A -> Z"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.NAME_A_TO_Z);
            cy.findByTestId("default-data-list.filter").click();
        });

        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-deprecated-list-item")
                .first()
                .within(() => {
                    cy.findByText(apiKeys[0].name).should("exist");
                });
        });

        // Sort apiKeys from "Name Z -> A"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.NAME_Z_TO_A);
            cy.findByTestId("default-data-list.filter").click();
        });

        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-deprecated-list-item")
                .first()
                .within(() => cy.findByText(apiKeys[total - 1].name))
                .should("exist");
        });

        // Sort apiKeys from "Oldest to Newest"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.OLDEST_TO_NEWEST);
            cy.findByTestId("default-data-list.filter").click();
        });

        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-deprecated-list-item")
                .first()
                .within(() => {
                    cy.findByText(apiKeys[0].name).should("exist");
                });
        });

        // Sort apiKeys from "Newest to Oldest"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.NEWEST_TO_OLDEST);
            cy.findByTestId("default-data-list.filter").click();
        });

        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-deprecated-list-item")
                .first()
                .within(() => {
                    cy.findByText(apiKeys[total - 1].name).should("exist");
                });
        });
    });
});
