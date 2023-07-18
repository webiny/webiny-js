import { GraphQLClient } from "graphql-request";
import { LIST_BLOCK_CATEGORIES } from "./graphql";

Cypress.Commands.add("pbListBlockCategories", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(LIST_BLOCK_CATEGORIES, variables)
            .then(response => response.pageBuilder.listBlockCategories.data);
    });
});
