import { GraphQLClient } from "graphql-request";
import { DELETE_CONTENT_MODEL_GROUP } from "./graphql";

Cypress.Commands.add("cmsDeleteContentModelGroup", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("CMS_MANAGE_GRAPHQL_API_URL") + "/en-US", {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(DELETE_CONTENT_MODEL_GROUP, variables)
            .then(response => response.deleteContentModelGroup.data);
    });
});
