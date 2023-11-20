import { GraphQLClient } from "graphql-request";
import { UPDATE_PAGE } from "./graphql";

Cypress.Commands.add("pbUpdatePage", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(UPDATE_PAGE, variables)
            .then(response => response.pageBuilder.updatePage.data);
    });
});
