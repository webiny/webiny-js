import { GraphQLClient } from "graphql-request";
import { READ_API_KEY } from "./graphql";

Cypress.Commands.add("securityReadApiKey", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(READ_API_KEY, variables)
            .then(response => response.security.apiKey.data);
    });
});
