import { GraphQLClient } from "graphql-request";
import { DELETE_GROUP } from "./graphql";

Cypress.Commands.add("securityDeleteRole", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(DELETE_GROUP, variables)
            .then(response => response.security.group.data);
    });
});
