import { GraphQLClient } from "graphql-request";
import { CREATE_MENU } from "./graphql";

Cypress.Commands.add("pbCreateMenu", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(CREATE_MENU, variables)
            .then(response => response.pageBuilder.menu.data);
    });
});
