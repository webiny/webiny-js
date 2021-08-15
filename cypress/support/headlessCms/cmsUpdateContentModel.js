import { GraphQLClient } from "graphql-request";
import { UPDATE_CONTENT_MODEL } from "./graphql";

Cypress.Commands.add("cmsUpdateContentModel", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("CMS_MANAGE_GRAPHQL_API_URL") + "/en-US", {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(UPDATE_CONTENT_MODEL, variables)
            .then(response => response.updateContentModel.data);
    });
});
