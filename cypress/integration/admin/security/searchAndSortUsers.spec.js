import uniqid from "uniqid";

const sort = {
    NEWEST_TO_OLDEST: "createdOn:desc",
    OLDEST_TO_NEWEST: "createdOn:asc",
    LOGIN_A_TO_Z: "login:asc",
    LOGIN_Z_TO_A: "login:desc"
};

context("Search and sort security users", () => {
    const total = 3;
    const users = [];

    before(() => {
        for (let i = 0; i < total; i++) {
            cy.securityCreateUser({
                data: {
                    login: uniqid(`${i}-`, "@gmail.com"),
                    firstName: uniqid("first name-"),
                    lastName: uniqid("last name-"),
                    group: "full-access"
                }
            }).then(user => {
                users.push(user);
            });
        }
    });

    beforeEach(() => {
        cy.login();
    });

    after(() => {
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            cy.securityDeleteUser({
                login: user.login
            });
        }
    });

    it("should able to search users", () => {
        cy.visit(`/security/users`);

        // Searching for a non existing user should result in "no records found"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search users/i).type("NON_EXISTING_USER");
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(/no records found./i).should("exist");
        });

        // Searching for a particular user by "login"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search users/i)
                .clear()
                .type(users[0].login);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(users[0].login).should("exist");
        });

        // Searching for a particular user by "first name"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search users/i)
                .clear()
                .type(users[0].firstName);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(users[0].login).should("exist");
        });

        // Searching for a particular user by "last name"
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/Search users/i)
                .clear()
                .type(users[0].lastName);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(users[0].login).should("exist");
        });
    });

    it("should able to sort users", () => {
        cy.visit(`/security/users`);

        // Sort users from "login A -> Z"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.LOGIN_A_TO_Z);
            cy.findByTestId("default-data-list.filter").click();
        });

        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .within(() => {
                    cy.findByText(users[0].login).should("exist");
                });
        });

        // Sort users from "login Z -> A"
        cy.findByTestId("default-data-list.filter").click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select(sort.LOGIN_Z_TO_A);
            cy.findByTestId("default-data-list.filter").click();
        });
        // We're testing it against the second element because the first one will be "Admin" user
        cy.findByTestId("default-data-list").within(() => {
            cy.get(".mdc-list-item")
                .first()
                .next()
                .within(() => {
                    cy.findByText(users[total - 1].login).should("exist");
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
                    cy.findByText(users[0].login).should("exist");
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
                    cy.findByText(users[total - 1].login).should("exist");
                });
        });
    });
});
