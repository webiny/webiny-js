import { GraphQLClient } from "graphql-request";
import { CREATE_API_KEY } from "./graphql";

Cypress.Commands.add("securityCreateApiKey", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(CREATE_API_KEY, variables)
            .then(response => response.security.apiKey.data);
    });
});
