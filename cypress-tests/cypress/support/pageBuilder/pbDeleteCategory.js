import { GraphQLClient } from "graphql-request";
import { DELETE_CATEGORY } from "./graphql";

Cypress.Commands.add("pbDeleteCategory", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(DELETE_CATEGORY, variables)
            .then(response => response.pageBuilder.category.data);
    });
});
