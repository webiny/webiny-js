import uniqid from "uniqid";

const sort = {
    NEWEST_TO_OLDEST: "createdOn_DESC",
    OLDEST_TO_NEWEST: "createdOn_ASC",
    EMAIL_A_TO_Z: "email_ASC",
    EMAIL_Z_TO_A: "email_DESC"
};

context("Search and sort security users", () => {
    const total = 3;
    const users = [];

    before(() => {
        return cy.securityDeleteAllUsers().then(() =>
            cy.securityReadGroup({ slug: "full-access" }).then(group => {
                for (let i = 0; i < total; i++) {
                    cy.securityCreateUser({
                        data: {
                            email: uniqid(`${i}-`, "@gmail.com"),
                            firstName: uniqid("first name-"),
                            lastName: uniqid("last name-"),
                            password: "12345678",
                            group: group.id
                        }
                    }).then(user => {
                        users.push(user);
                    });
                }
            })
        );
    });

    beforeEach(() => {
        cy.login();
    });

    after(() => {
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            cy.securityDeleteUser({
                id: user.id
            });
        }
    });

    it("should able to search users", () => {
        cy.visit(`/admin-users`);

        // Searching for a non existing user should result in "no records found"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search users/i).type("NON_EXISTING_USER");
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(/no records found./i).should("exist");
        });

        // Searching for a particular user by "email"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search users/i)
                .clear()
                .type(users[0].email);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(users[0].email).should("exist");
        });

        // Searching for a particular user by "first name"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search users/i)
                .clear()
                .type(users[0].firstName);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(users[0].email).should("exist");
        });

        // Searching for a particular user by "last name"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search users/i)
                .clear()
                .type(users[0].lastName);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(users[0].email).should("exist");
        });
    });

    it("should able to sort users", () => {
        cy.visit(`/admin-users`);

        // Sort users from "email A -> Z"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.EMAIL_A_TO_Z);
            cy.findByTestId("default-data-list.filter").click();
        });

        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .within(() => {
                    cy.findByText(users[0].email).should("exist");
                });
        });

        // Sort users from "email Z -> A"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.EMAIL_Z_TO_A);
            cy.findByTestId("default-data-list.filter").click();
        });
        // We're testing it against the second element because the first one will be "Admin" user
        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .next()
                .within(() => {
                    cy.findByText(users[total - 1].email).should("exist");
                });
        });

        // Sort users from "Oldest to Newest"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.OLDEST_TO_NEWEST);
            cy.findByTestId("default-data-list.filter").click();
        });
        // We're testing it against the second element because the first one will be "Admin" user
        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .next()
                .within(() => {
                    cy.findByText(users[0].email).should("exist");
                });
        });

        // Sort users from "Newest to Oldest"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.NEWEST_TO_OLDEST);
            cy.findByTestId("default-data-list.filter").click();
        });

        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .within(() => {
                    cy.findByText(users[total - 1].email).should("exist");
                });
        });
    });
});
