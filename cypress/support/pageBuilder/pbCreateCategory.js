import { GraphQLClient } from "graphql-request";
import { CREATE_CATEGORY } from "./graphql";

Cypress.Commands.add("pbCreateCategory", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(CREATE_CATEGORY, variables)
            .then(response => response.pageBuilder.category.data);
    });
});
