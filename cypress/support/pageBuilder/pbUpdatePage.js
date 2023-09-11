import { UPDATE_PAGE } from "./graphql";
import { gqlClient } from "../utils";

Cypress.Commands.add("pbUpdatePage", variables => {
    cy.login().then(user => {
        return gqlClient
            .request({
                query: UPDATE_PAGE,
                variables,
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.updatePage.data);
    });
});
