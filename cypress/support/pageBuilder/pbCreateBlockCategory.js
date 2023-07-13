import { GraphQLClient } from "graphql-request";
import { CREATE_BLOCK_CATEGORY } from "./graphql";

Cypress.Commands.add("pbCreateBlockCategory", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(CREATE_BLOCK_CATEGORY, variables)
            .then(response => response.pageBuilder.blockCategory.data);
    });
});
