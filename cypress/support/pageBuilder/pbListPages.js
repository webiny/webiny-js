import { GraphQLClient } from "graphql-request";
import { LIST_PAGES } from "./graphql";

Cypress.Commands.add("pbListPages", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(LIST_PAGES, variables)
            .then(response => response.pageBuilder.listPages.data);
    });
});
