import { GraphQLClient } from "graphql-request";
import { LIST_TAGS } from "./graphql";

Cypress.Commands.add("fmListTags", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client.request(LIST_TAGS, variables).then(response => response.fileManager.listTags);
    });
});
