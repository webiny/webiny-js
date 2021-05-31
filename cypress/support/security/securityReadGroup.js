import { GraphQLClient } from "graphql-request";
import { READ_GROUP } from "./graphql";

Cypress.Commands.add("securityReadGroup", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client.request(READ_GROUP, variables).then(response => response.security.group.data);
    });
});
