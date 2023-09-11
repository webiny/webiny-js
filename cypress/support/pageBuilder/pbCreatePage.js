import { GraphQLClient } from "graphql-request";
import { CREATE_PAGE } from "./graphql";

Cypress.Commands.add("pbCreatePage", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`,
                ["x-tenant"]: "root"
            }
        });

        return client
            .request(CREATE_PAGE, variables)
            .then(response => response.pageBuilder.createPage.data);
    });
});
