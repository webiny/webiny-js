import { GraphQLClient } from "graphql-request";
import { PUBLISH_PAGE } from "./graphql";

Cypress.Commands.add("pbPublishPage", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(PUBLISH_PAGE, variables)
            .then(response => response.pageBuilder.publishPage.data);
    });
});
