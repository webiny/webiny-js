import { GraphQLClient } from "graphql-request";
import { DELETE_USER } from "./graphql";

Cypress.Commands.add("securityDeleteUser", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(DELETE_USER, variables)
            .then(response => response.adminUsers.user.data);
    });
});
