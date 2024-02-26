import { GraphQLClient } from "graphql-request";
import { DELETE_CONTENT_MODEL } from "./graphql";

Cypress.Commands.add("cmsDeleteContentModel", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("CMS_MANAGE_GRAPHQL_API_URL") + "/en-US", {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(DELETE_CONTENT_MODEL, variables)
            .then(response => response.deleteContentModel.data);
    });
});
