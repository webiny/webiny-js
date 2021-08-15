import { GraphQLClient } from "graphql-request";
import { DELETE_FILE } from "./graphql";

Cypress.Commands.add("fmDeleteFile", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(DELETE_FILE, variables)
            .then(response => response.fileManager.deleteFile.data);
    });
});
