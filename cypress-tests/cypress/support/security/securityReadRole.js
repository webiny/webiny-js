import { GraphQLClient } from "graphql-request";
import { READ_GROUP } from "./graphql";

Cypress.Commands.add("securityReadRole", (variables, token) => {
    const makeRequest = token => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${token}`
            }
        });

        return client.request(READ_GROUP, variables).then(response => response.security.group.data);
    };

    if (token) {
        return makeRequest(token);
    }

    cy.login().then(user => {
        return makeRequest(user.idToken.jwtToken);
    });
});
