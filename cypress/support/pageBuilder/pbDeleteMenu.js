import { GraphQLClient } from "graphql-request";
import { DELETE_MENU } from "./graphql";

Cypress.Commands.add("pbDeleteMenu", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(DELETE_MENU, variables)
            .then(response => response.pageBuilder.menu.data);
    });
});
