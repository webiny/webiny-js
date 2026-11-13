import { GraphQLClient } from "graphql-request";
import { LIST_USERS } from "./graphql";

Cypress.Commands.add("securityListUsers", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.expose("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(LIST_USERS, variables)
            .then(response => response.adminUsers.users.data);
    });
});
