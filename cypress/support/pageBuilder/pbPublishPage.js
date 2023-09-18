import { PUBLISH_PAGE } from "./graphql";
import { gqlClient } from "../utils";

Cypress.Commands.add("pbPublishPage", variables => {
    cy.login().then(user => {
        return gqlClient
            .request({
                query: PUBLISH_PAGE,
                variables,
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.publishPage.data);
    });
});
