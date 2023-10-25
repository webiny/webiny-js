import { GraphQLClient } from "graphql-request";
import { CREATE_USER } from "./graphql";

Cypress.Commands.add("securityCreateUser", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(CREATE_USER, variables)
            .then(response => response.adminUsers.user.data);
    });
});
