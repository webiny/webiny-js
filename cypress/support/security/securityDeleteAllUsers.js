/**
 * Deletes all users except admin@webiny.com.
 */
Cypress.Commands.add("securityDeleteAllUsers", () => {
    return cy.login().then(() => {
        return cy.securityListUsers().then(list => {
            for (let i = 0; i < list.length; i++) {
                const { id, email } = list[i];
                if (email !== "admin@webiny.com") {
                    cy.securityDeleteUser({ id });
                }
            }
        });
    });
});
