import { GraphQLClient } from "graphql-request";
import { CREATE_CONTENT_MODEL } from "./graphql";

Cypress.Commands.add("cmsCreateContentModel", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("CMS_MANAGE_GRAPHQL_API_URL") + "/en-US", {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(CREATE_CONTENT_MODEL, variables)
            .then(response => response.createContentModel.data);
    });
});
