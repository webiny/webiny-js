import { GraphQLClient } from "graphql-request";
import { CREATE_GROUP } from "./graphql";

Cypress.Commands.add("securityCreateGroup", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(CREATE_GROUP, variables)
            .then(response => response.security.group.data);
    });
});
