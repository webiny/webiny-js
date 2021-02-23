import { GraphQLClient } from "graphql-request";
import { DELETE_PAGE } from "./graphql";

Cypress.Commands.add("pbDeletePage", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(DELETE_PAGE, variables)
            .then(response => response.pageBuilder.deletePage.data);
    });
});
